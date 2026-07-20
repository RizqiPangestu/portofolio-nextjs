# Google Drive Image Storage Guide (Manual Workflow)

A step-by-step guide for storing image assets in **Google Drive** and
referencing them from data that lives in Google Sheets (see
[`google-sheets-integration.md`](./google-sheets-integration.md)).

This is the **manual workflow**: you upload images to a Drive folder yourself,
copy a public URL, and paste it into a sheet cell (e.g. the `image` column that
maps to `EventObject.image`). The app just reads that URL — no upload code and
no extra credentials required.

> Why this fits the app: the `image` field is already a plain `string` passed
> straight into `<Image>` in `src/app/untuk-nia/_components/ObjectCarousel.tsx`,
> so a Drive URL is a drop-in replacement for the current local paths like
> `/untuk-nia/images/placeholder-1.svg`.

---

## Table of contents

1. [The critical gotcha (link format)](#the-critical-gotcha-link-format)
2. [Step-by-step](#step-by-step)
3. [Required config change (next/image)](#required-config-change-nextimage)
4. [Why this fits this app](#why-this-fits-this-app)
5. [Caveats](#caveats)
6. [Migrating `events.ts` / `popups.ts` into the sheet](#migrating-eventsts--popupsts-into-the-sheet)
7. [Alternatives](#alternatives)
8. [Troubleshooting](#troubleshooting)

---

## The critical gotcha (link format)

Google Drive's normal **share link** does **not** work in an `<img>` /
`next/image`:

```
https://drive.google.com/file/d/FILE_ID/view?usp=sharing   ❌ (opens the Drive UI, not the image)
```

The old direct-view trick is now **deprecated and returns 403**:

```
https://drive.google.com/uc?export=view&id=FILE_ID          ❌ (403 Forbidden)
```

The format that reliably works is the `lh3.googleusercontent.com` host:

```
https://lh3.googleusercontent.com/d/FILE_ID                 ✅
```

You can cap the size by appending a parameter (handy for the carousel):

```
https://lh3.googleusercontent.com/d/FILE_ID=w1200           # max width 1200px
https://lh3.googleusercontent.com/d/FILE_ID=h800            # max height 800px
```

> The `lh3` subdomain can be `lh3`…`lh6`. The file must have "Anyone with the
> link → Viewer" so no Google login is required to load it.

---

## Step-by-step

1. In Google Drive, create one dedicated folder, e.g. **`untuk-nia-images`**.
2. Right-click the folder → **Share** → set to **Anyone with the link → Viewer**.
   Everything you drop inside inherits this, so you only set it once.
3. Upload your images into that folder.
4. For each image: right-click → **Share** → **Copy link**. You get:
   ```
   https://drive.google.com/file/d/1AbCdEfG.../view?usp=sharing
   ```
5. Grab the **FILE_ID** — the part between `/d/` and `/view`.
6. Build the usable URL (optionally add `=w1200`):
   ```
   https://lh3.googleusercontent.com/d/1AbCdEfG...=w1200
   ```
7. Paste that URL into the `image` column of your sheet (the cell that maps to
   `EventObject.image`).

---

## Required config change (next/image)

Because images are rendered with **`next/image`** (`<Image>`), Next.js blocks
external image hosts unless they're whitelisted. Add the Google host to
`next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // ...existing patterns...
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/d/**",
      },
    ],
  },
};
```

> This is already applied in this repo. Restart `npm run dev` after editing
> `next.config.ts`.

---

## Why this fits this app

- The `image` field is already a `string`, and `ObjectCarousel` passes it
  straight to `<Image src={...}>` — a Drive URL is a drop-in replacement for the
  current `/untuk-nia/images/*.svg` paths. No component changes needed.
- Because the app uses **`next/image`**, Next fetches each Drive image **once**,
  optimizes it, and caches it on the server. Visitors hit that cache, not Drive,
  which shields you from Drive's per-file rate limits — a real advantage over a
  plain `<img>`.

---

## Caveats

- Drive is **not a real CDN**. For a low-traffic personal page it's fine (and
  `next/image` caching helps a lot), but it's not built for scale.
- Google has changed this link format before and could again. If it ever breaks,
  or you want automatic per-device resizing/compression, move to a purpose-built
  image host (see [Alternatives](#alternatives)).
- The 15 GB Drive quota is shared with Gmail and the rest of your Google account.

---

## Migrating `events.ts` / `popups.ts` into the sheet

The event carousel needs **multiple images per event** (each `EventObject` has
its own `image`), while a sheet row is flat. Two clean options:

- **One row per slide** with columns like
  `eventId | slideId | title | body | image | viewMs`, then group rows by
  `eventId` in code (the same pattern the wishlist already uses in
  `src/app/untuk-nia/_data/wishlist.ts`).
- **One row per event** and store the slides as a JSON string in a single cell.

Notes:

- `popups.ts` (quizzes/quotes) mostly uses icons that live in
  `public/untuk-nia/icons/` and don't really need Drive — only the event slide
  photos in `events.ts` do.
- Follow the read/write contract in
  [`google-sheets-integration.md`](./google-sheets-integration.md): the client
  supplies `columnNames` + `rows`, so a new tab (e.g. `Events`) just needs a
  header row and a `rowsToEvents` helper mirroring `rowsToWishlistItems`.

---

## Alternatives

| Tool | Best for | Free tier | Notes |
| --- | --- | --- | --- |
| **Google Drive** (this guide) | Staying in one ecosystem | 15 GB (shared with Gmail) | No new service/credentials. Not a real CDN; link format can change. |
| **Cloudinary** | Images specifically | 25 GB storage + 25 GB bandwidth/mo | Real image CDN, auto resize/compress/format. Same "paste a URL" workflow. Best upgrade path. |
| **Vercel Blob** | If deployed on Vercel | 1 GB free (Hobby) | Native to Vercel, simple SDK, served over CDN. |
| **Supabase Storage** | "Real" object storage + optional DB later | 1 GB free | S3-like, public buckets, good SDK. |
| **Cloudflare R2** | Scale / no egress fees | 10 GB free | S3-compatible, zero egress cost, more setup. |
| **GitHub (`public/` folder)** | Static, rarely-changing assets | free | Commit to `public/untuk-nia/images/` and reference locally — no external service. |

---

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Image shows Drive UI, not the picture | Using the `/file/d/FILE_ID/view` share link | Convert to `https://lh3.googleusercontent.com/d/FILE_ID` |
| `403 Forbidden` on the image | Using deprecated `uc?export=view&id=` format | Switch to the `lh3.googleusercontent.com/d/` format |
| Image loads only when logged into Google | File/folder not public | Set sharing to **Anyone with the link → Viewer** |
| `next/image` error: hostname not configured | Host missing from `remotePatterns` | Add `lh3.googleusercontent.com` (`/d/**`) and restart dev server |
| Image loads huge / slow | No size cap | Append `=w1200` (or a suitable width) to the URL |
| Works locally, breaks in prod | Config not deployed / stale build | Redeploy after the `next.config.ts` change |
