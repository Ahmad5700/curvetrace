"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sourceHtml = fs.readFileSync(path.join(root, "src", "index.html"), "utf8");
const appSource = fs.readFileSync(path.join(root, "src", "app.js"), "utf8");
const bundledHtml = fs.readFileSync(path.join(root, "dist", "CurveTrace.html"), "utf8");

const htmlIds = [...sourceHtml.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const referencedIds = [...appSource.matchAll(/\$\("([^"]+)"\)/g)].map((match) => match[1]);
const duplicates = htmlIds.filter((id, index) => htmlIds.indexOf(id) !== index);
const missing = [...new Set(referencedIds)].filter((id) => !htmlIds.includes(id));

assert.deepEqual(duplicates, [], `Duplicate HTML ids: ${duplicates.join(", ")}`);
assert.deepEqual(missing, [], `JavaScript references missing HTML ids: ${missing.join(", ")}`);
assert.ok(!/<script\s+src=/i.test(bundledHtml), "Bundled app must not depend on external scripts");
assert.ok(!/<link\s+rel="stylesheet"/i.test(bundledHtml), "Bundled app must not depend on an external stylesheet");
assert.ok(bundledHtml.includes("CurveTrace Project"), "Bundled app should contain project support");
assert.ok(bundledHtml.includes("Save combined CSV"), "Bundled app should contain combined CSV export");
assert.ok(bundledHtml.length > 50000, "Bundled app appears unexpectedly incomplete");

console.log("CurveTrace structure tests passed.");
