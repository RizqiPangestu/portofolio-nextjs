# portofolio-nextjs
Portofolio with NextJs

Container image (Buildpacks): see [BUILD.md](./BUILD.md).

## Deploy to GitHub Pages

The GitHub Actions workflow builds and deploys the static portfolio when code is pushed to `master`. In the repository settings, set **Pages > Build and deployment > Source** to **GitHub Actions**. The project-site URL will be `https://<username>.github.io/portofolio-nextjs/`.

GitHub Pages cannot run Next.js API routes or dynamic short links. The API-backed pages and `/untuk-nia` section are omitted from the Pages build; they remain available in regular Next.js deployments.
