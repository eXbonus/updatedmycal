# My Calendar Premium

A React + Vite calendar/reminder app based on the supplied source file.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy to GitHub Pages

1. Create a GitHub repository and upload/push all files in this folder.
2. Make sure the default branch is `main`.
3. Open **Settings → Pages**.
4. Under **Build and deployment → Source**, select **GitHub Actions**.
5. Push to `main` (or run the workflow manually).
6. Open the Pages URL shown in the repository's Pages settings or Actions deployment.

The project uses a relative Vite base path so it works when hosted from a GitHub Pages project URL.

## Data

Calendar entries and theme preferences are stored in the browser's `localStorage`, so they stay on the device/browser where they were entered. CSV export is generated in the browser.
