/**
 * Post-build patcher.
 *
 * Expo's web export in SDK 54 emits index.html but does NOT:
 *   - link the PWA manifest
 *   - add the theme-color / iOS-specific meta tags
 *   - place an /icon.png at the site root for the manifest to reference
 *
 * This script fixes all three after `expo export` runs, so the deployed
 * site is installable on Android and iOS Safari with a working icon.
 *
 * Idempotent — running twice is safe (the icon is copied unconditionally;
 * the head injection checks for an existing manifest link first).
 */

const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "..", "dist");
const indexPath = path.join(distDir, "index.html");

if (!fs.existsSync(indexPath)) {
  console.error(`post-build: ${indexPath} not found. Did expo export run?`);
  process.exit(1);
}

// ── 1. Copy the app icon to dist/icon.png ────────────────────────────────────
// manifest.webmanifest and the apple-touch-icon <link> both reference
// "/icon.png". Expo bundles assets under hashed paths, so nothing lands at
// that predictable root path unless we put it there ourselves.
const iconSrc = path.join(__dirname, "..", "assets", "images", "icon.png");
const iconDest = path.join(distDir, "icon.png");

if (fs.existsSync(iconSrc)) {
  fs.copyFileSync(iconSrc, iconDest);
  console.log("post-build: copied app icon to dist/icon.png");
} else {
  console.warn(
    `post-build: WARNING — icon source not found at ${iconSrc}.\n` +
      "  The PWA manifest icon (/icon.png) will 404 and install may fail.",
  );
}

// ── 2. Inject PWA + theme-color + iOS head tags ──────────────────────────────
let html = fs.readFileSync(indexPath, "utf-8");

if (html.includes('rel="manifest"')) {
  console.log("post-build: manifest already linked, skipping head injection.");
  process.exit(0);
}

const injection = `    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="apple-touch-icon" href="/icon.png" />
    <meta name="theme-color" content="#C9A84C" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Prabhupada Slokas" />
  </head>`;

html = html.replace("</head>", injection);
fs.writeFileSync(indexPath, html);

console.log("post-build: PWA head tags injected into dist/index.html");
