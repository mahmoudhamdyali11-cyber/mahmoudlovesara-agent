import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Script } from "node:vm";

const root = process.cwd();
const html = readFileSync(resolve(root, "index.html"), "utf8");
const manifest = JSON.parse(
  readFileSync(resolve(root, "manifest.webmanifest"), "utf8"),
);

const requiredChecks = [
  ["Arabic RTL document", /<html[^>]+lang="ar"[^>]+dir="rtl"/i],
  ["Page description", /<meta[^>]+name="description"/i],
  ["Private-content indexing policy", /<meta[^>]+name="robots"[^>]+content="noindex,nofollow"/i],
  ["Manifest link", /<link[^>]+rel="manifest"[^>]+href="\/manifest\.webmanifest"/i],
  ["Signed URL support for private photos", /createSignedUrl\(/],
];

for (const [label, pattern] of requiredChecks) {
  if (!pattern.test(html)) {
    console.error(`FAIL: ${label}`);
    process.exitCode = 1;
  }
}

if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
  console.error("FAIL: manifest must declare at least one app icon");
  process.exitCode = 1;
}

for (const icon of manifest.icons ?? []) {
  if (!icon.src || !readFileSync(resolve(root, icon.src.replace(/^\//, "")), "utf8")) {
    console.error(`FAIL: manifest icon is missing or unreadable: ${icon.src}`);
    process.exitCode = 1;
  }
}

if (/\/storage\/v1\/object\/public\/photos\//.test(html)) {
  console.error("FAIL: frontend still constructs public photo storage URLs");
  process.exitCode = 1;
}

if (/src="\$\{[ne]\.src\}"/.test(html)) {
  console.error("FAIL: an unescaped dynamic image source remains in HTML templates");
  process.exitCode = 1;
}

const scriptTags = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
let checkedScripts = 0;

for (const [, attributes, source] of scriptTags) {
  if (/\bsrc\s*=/i.test(attributes) || !source.trim()) continue;
  checkedScripts += 1;
  try {
    new Script(source, { filename: `index.html:inline-script-${checkedScripts}.js` });
  } catch (error) {
    console.error(`FAIL: inline script ${checkedScripts} syntax: ${error.message}`);
    process.exitCode = 1;
  }
}

if (checkedScripts === 0) {
  console.error("FAIL: no inline JavaScript was checked");
  process.exitCode = 1;
}

if (process.exitCode) {
  process.exit(1);
}

console.log(`PASS: metadata, manifest, private image URL guards, and ${checkedScripts} inline script(s) checked.`);
