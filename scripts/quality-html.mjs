import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Script } from "node:vm";

const root = process.cwd();
const html = readFileSync(resolve(root, "index.html"), "utf8");
const manifest = JSON.parse(
  readFileSync(resolve(root, "manifest.webmanifest"), "utf8"),
);
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const storageMigration = readFileSync(
  resolve(root, "supabase/migrations/20261017002935_secure_private_photo_storage.sql"),
  "utf8",
);

const requiredChecks = [
  ["Arabic RTL document", /<html[^>]+lang="ar"[^>]+dir="rtl"/i],
  ["Page description", /<meta[^>]+name="description"/i],
  ["Private-content indexing policy", /<meta[^>]+name="robots"[^>]+content="noindex,nofollow"/i],
  ["Manifest link", /<link[^>]+rel="manifest"[^>]+href="\/manifest\.webmanifest"/i],
  ["Signed URL support for private photos", /createSignedUrl\(/],
  ["Import guard preserves the 100-image limit", /أكثر من 100 صورة/],
];

if (packageJson.packageManager !== "pnpm@10.34.7") {
  console.error("FAIL: packageManager must match the CI-pinned pnpm version");
  process.exitCode = 1;
}

if (!/set public = false/i.test(storageMigration) || !/drop policy if exists "public can view album photos"/i.test(storageMigration) || !/create policy "album owners can view photos storage"/i.test(storageMigration)) {
  console.error("FAIL: private photo storage migration is incomplete");
  process.exitCode = 1;
}

for (const [label, pattern] of requiredChecks) {
  if (!pattern.test(html)) {
    console.error(`FAIL: ${label}`);
    process.exitCode = 1;
  }
}
const safeImageSourceMatch = html.match(
  /function safeImageSrc\(t\)\{[\s\S]*?\}function cssImageUrl/,
);
if (!safeImageSourceMatch) {
  console.error("FAIL: safeImageSrc helper not found for behavior checks");
  process.exitCode = 1;
} else {
  try {
    const helperSource = safeImageSourceMatch[0].replace(/function cssImageUrl$/, "");
    const safeImageSrc = new Script("(" + helperSource + ")").runInNewContext({
      URL,
      location: { href: "https://app.test/" },
    });
    assert.equal(safeImageSrc("javascript:alert(1)"), "");
    assert.equal(safeImageSrc("data:text/html;base64,PHNjcmlwdD4="), "");
    assert.equal(safeImageSrc("https://user:pass@example.com/image.jpg"), "");
    assert.equal(safeImageSrc("data:image/jpeg;base64,SGVsbG8="), "data:image/jpeg;base64,SGVsbG8=");
    assert.equal(safeImageSrc("https://example.com/image.jpg"), "https://example.com/image.jpg");
  } catch (error) {
    console.error("FAIL: safeImageSrc behavior test: " + error.message);
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

if (/src="\$\{(?!esc\()[^"]+\}"/.test(html)) {
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
