// Scans assets/work/<category>/ and writes assets/manifest.js, the file the
// published site reads to build each overlay gallery.
//
// Normally you don't run this: the GitHub workflow does it on push, and local
// previews read the folders directly. To rebuild by hand:
//
//   node .github/build-media.mjs

import { readdirSync, writeFileSync, statSync } from "node:fs";
import { join, dirname, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const workDir = join(root, "assets", "work");

const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"];
const VIDEO_EXT = [".mp4", ".webm", ".mov", ".m4v"];
const DOC_EXT = [".pdf"];

// keep in step with typeOf() in script.js
function typeOf(name) {
  const ext = extname(name).toLowerCase();
  if (VIDEO_EXT.includes(ext)) return "video";
  if (DOC_EXT.includes(ext)) return "doc";
  return "image";
}

// Filenames the camera or phone made up. No point showing these as captions.
const AUTO_NAME = /^(img|dsc|dscn|pxl|photo|image|screenshot|video|vid|mvimg)[\s_-]*\d+$/i;

// "03 - Spring Reel.jpg" -> "Spring Reel"; "IMG_4821.jpg" -> "" (no caption)
function captionFrom(file) {
  const stem = basename(file, extname(file))
    .replace(/^\d+\s*[-_.)]*\s*/, "")   // strip a leading sort number
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!stem || AUTO_NAME.test(stem)) return "";
  return stem;
}

// Sorts "2.jpg" before "10.jpg", which a plain string sort gets backwards.
const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

// GitHub refuses any file over 100 MB, so one that size can never reach the
// published site. Listing it would only produce a broken tile - skip it and
// say so, rather than putting a dead link in the manifest.
const MAX_BYTES = 100 * 1024 * 1024;
const skipped = [];

function scan(slug) {
  const dir = join(workDir, slug);
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return []; // folder not created yet - the page falls back to placeholders
  }

  return entries
    .filter((name) => !name.startsWith(".") && statSync(join(dir, name)).isFile())
    .filter((name) => {
      const ext = extname(name).toLowerCase();
      return IMAGE_EXT.includes(ext) || VIDEO_EXT.includes(ext) || DOC_EXT.includes(ext);
    })
    .filter((name) => {
      const bytes = statSync(join(dir, name)).size;
      if (bytes <= MAX_BYTES) return true;
      skipped.push({ path: slug + "/" + name, mb: bytes / 1048576 });
      return false;
    })
    .sort(collator.compare)
    .map((name) => ({
      // encoded so spaces, "#", "&" etc. in filenames resolve as paths, not URL syntax
      src: "assets/work/" + encodeURIComponent(slug) + "/" + encodeURIComponent(name),
      type: typeOf(name),
      caption: captionFrom(name),
    }));
}

const slugs = readdirSync(workDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort(collator.compare);

const manifest = {};
for (const slug of slugs) manifest[slug] = scan(slug);

// Written as a .js assignment rather than .json so the page still works when
// index.html is opened straight from disk (fetch() of a local file is blocked).
const out =
  "// GENERATED FILE - do not edit by hand.\n" +
  "// Rebuild with: node .github/build-media.mjs\n" +
  "window.PORTFOLIO_MEDIA = " +
  JSON.stringify(manifest, null, 2) +
  ";\n";

writeFileSync(join(root, "assets", "manifest.js"), out);

let total = 0;
for (const slug of slugs) {
  const files = manifest[slug];
  total += files.length;
  const label = files.length === 0 ? "empty" : files.length + " file" + (files.length === 1 ? "" : "s");
  console.log("  " + slug.padEnd(30) + label);
}
console.log("\nWrote assets/manifest.js - " + total + " files across " + slugs.length + " categories.");

if (skipped.length) {
  console.log("\nSkipped " + skipped.length + " file(s) over 100 MB - too large for GitHub:");
  for (const f of skipped) console.log("  " + f.mb.toFixed(0).padStart(6) + " MB  " + f.path);
  console.log("Compress these to web size and they will be picked up automatically.");
}
