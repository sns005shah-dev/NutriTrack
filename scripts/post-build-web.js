// Post-build script to ensure relative asset links for universal hosting compatibility
// Works seamlessly on GitHub Pages subpaths (/NutriTrack/), Cloudflare Pages, Vercel, and local servers.

const fs = require('fs');
const path = require('path');

const distHtmlPath = path.join(__dirname, '..', 'dist', 'index.html');

if (fs.existsSync(distHtmlPath)) {
  let html = fs.readFileSync(distHtmlPath, 'utf8');
  // Replace leading slashes for Expo bundle and favicon with relative paths
  html = html.replace(/src="\/_expo\//g, 'src="./_expo/');
  html = html.replace(/href="\/_expo\//g, 'href="./_expo/');
  html = html.replace(/href="\/favicon\.ico"/g, 'href="./favicon.ico"');
  fs.writeFileSync(distHtmlPath, html, 'utf8');
  console.log('✅ post-build: Converted bundle asset paths to relative (./) for universal hosting.');
} else {
  console.warn('⚠️ post-build: dist/index.html not found.');
}
