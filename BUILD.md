# Container image with Buildpacks

## 1. Install the buildpack CLI

The tool is `**pack**` ([install](https://buildpacks.io/docs/tools/pack/install-pack/)):

```bash
brew install buildpacks/tap/pack
```

## 2. Command that works for this Next.js app

Google’s builder `gcr.io/buildpacks/builder` can fail at **DETECT** with `No buildpack groups passed detection` even when `package.json` is present (known to happen with some `pack` + lifecycle + builder combinations). A reliable option for Node/Next is the **Heroku** builder:

```bash
cd /path/to/portofolio   # folder that contains package.json

pack build portofolio-img \
  --builder heroku/builder:24 \
  --path .
```

Run the image (Next listens on `PORT`, default 3000):

```bash
docker run --rm -p 3000:3000 -e PORT=3000 portofolio-img
```

## 3. If you deploy on Google Cloud

- Prefer **Cloud Run “from source”**, **Cloud Buildpacks via gcloud**, or a **Dockerfile** so the platform pins builder/lifecycle versions.
- If you must use `pack` locally with Google’s builder and detection keeps failing, upgrade `pack` and Docker, then retry; otherwise use the Heroku builder above or a Dockerfile.

## 4. Git + `pack` (optional)

If the project is a git repo, some `pack` versions use the git tree for the archive; keep `package.json` **committed** so it is always included.