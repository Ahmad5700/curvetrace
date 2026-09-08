"use strict";

const fs = require("fs");
const path = require("path");

const root = __dirname;
const sourceDirectory = path.join(root, "src");
const outputDirectory = path.join(root, "dist");
let html = fs.readFileSync(path.join(sourceDirectory, "index.html"), "utf8");
const css = fs.readFileSync(path.join(sourceDirectory, "styles.css"), "utf8");
const core = fs.readFileSync(path.join(sourceDirectory, "core.js"), "utf8");
const app = fs.readFileSync(path.join(sourceDirectory, "app.js"), "utf8");

html = html.replace(
  /\s*<link rel="stylesheet" href="styles\.css" data-bundle>\s*/,
  `\n<style>\n${css}\n</style>\n`
);
html = html.replace(
  /\s*<script src="core\.js" data-bundle><\/script>\s*/,
  `\n<script>\n${core}\n</script>\n`
);
html = html.replace(
  /\s*<script src="app\.js" data-bundle><\/script>\s*/,
  `\n<script>\n${app}\n</script>\n`
);

fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(path.join(outputDirectory, "CurveTrace.html"), html, "utf8");
console.log(`Bundled dist/CurveTrace.html (${Buffer.byteLength(html).toLocaleString()} bytes)`);
