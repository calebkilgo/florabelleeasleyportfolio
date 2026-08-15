// `folder` points at assets/work/<folder>/ — drop images there and they show up
// in that category's gallery on the next refresh. See assets/work/README.md.
//
// `instagram` is optional: give a category a profile URL and its overlay shows
// an Instagram link. Leave it off and no icon appears.
//
// TODO: replace titles, tags, and blurbs with real work
const categories = [
  { title: "Student Spotlight", tag: "Broadcasting", folder: "student-spotlight", blurb: "Student Spotlight is a self-hosted segment on a live radio show. Each guest is a student at Fort Payne High School at the time of the interview." },
  { title: "Interviews", tag: "Broadcasting", folder: "interviews", blurb: "Targeted pitches built around what a specific reporter actually covers." },
  { title: "Alabama Living Real Estate", tag: "Public Relations", folder: "alabama-living-real-estate", instagram: "https://www.instagram.com/alabamalivingco/", blurb: "Below are a few designs that Flora Belle has created for the Best of Alabama winning real estate agency, Alabama Living Real Estate." },
  { title: "Pete Davis for Mayor Campaign", tag: "Campaign Manager", folder: "pete-davis-for-mayor", blurb: "Below are a few graphics and promotional materials Flora Belle created while serving as Campaign Manager for the Pete Davis for Mayor campaign during the municipal election." },
  { title: "Camp Skyline Ranch", tag: "Social Media", folder: "camp-skyline-ranch", instagram: "https://www.instagram.com/campskyline/", blurb: "Below are several reels Flora Belle created during her time as a Social Media Intern at Camp Skyline Ranch for Girls, highlighting camp life, activities, and special moments." },
  { title: "BeWell Nutrition", tag: "Social Media", folder: "bewell-nutrition", instagram: "https://www.instagram.com/bewellnutrition_/", blurb: "Below are a few designs Flora Belle has created for Be Well Nutrition, including the brand’s logo." },
  { title: "Clubs", tag: "Public Relations", folder: "clubs", blurb: "Below are several designs Flora Belle has created for organizations including Key Club, Fort Payne High School’s Broadcasting Program, and Future Business Leaders of America." },
  { title: "Suite K Salon + Spa", tag: "Social Media", folder: "suite-k-salon-spa", instagram: "https://www.instagram.com/suiteksalon/", blurb: "Below are a few designs Flora Belle created to promote Suite K Salon + Spa, an award-winning local salon and spa." },
  { title: "Photography", tag: "Content", folder: "photography", blurb: "Below are a few photos taken by Flora Belle during her time as a school photographer for the yearbook staff." },
  { title: "Backdrops", tag: "Graphic Design", folder: "backdrops", blurb: "Below are backdrop designs created by Flora Belle." },
  { title: "Tech Team", tag: "Content", folder: "tech-team", blurb: "Below are graphics created by Flora Belle that earned 1st place in the regional tech fair." },
  { title: "Voiceovers", tag: "Broadcasting", folder: "voiceovers", blurb: "Below are a few videos featuring voiceover work by Flora Belle." },
  { title: "Yearbook Designs", tag: "Graphic Design", folder: "yearbook-designs", blurb: "The Fort Payne High School Yearbook Staff is a team of 10 students that craft and curate the annual yearbook. The book is made completly from scratch from cover to cover. Below are a few pages that Flora Belle has designed. " },
  { title: "Fort Payne City Schools", tag: "Advertising", folder: "fort-payne-city-schools", blurb: "Below is a promotional flyer designed by Flora Belle that was selected to be featured in the DeKalb Living Magazine to promote Fort Payne City Schools." },
];

// written by .github/build-media.mjs; empty if that script has never been run.
// Overwritten below by live folder reads when previewing on a local server.
let media = window.PORTFOLIO_MEDIA || {};

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i;
const DOC_EXT = /\.pdf$/i;

function typeOf(name) {
  if (VIDEO_EXT.test(name)) return "video";
  if (DOC_EXT.test(name)) return "doc";
  return "image";
}

// Filenames the camera made up. Kept in step with .github/build-media.mjs.
const AUTO_NAME = /^(img|dsc|dscn|pxl|photo|image|screenshot|video|vid|mvimg)[\s_-]*\d+$/i;

// "03 - Spring Reel.jpg" -> "Spring Reel"; "IMG_4821.jpg" -> "" (no caption)
function captionFrom(file) {
  const stem = file
    .replace(/\.[^.]+$/, "")
    .replace(/^\d+\s*[-_.)]*\s*/, "")   // strip a leading sort number
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return !stem || AUTO_NAME.test(stem) ? "" : stem;
}

// sorts "2.jpg" before "10.jpg", which a plain string sort gets backwards
const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

// A local file server (VS Code Live Server, `python -m http.server`) answers a
// folder request with an HTML page of links, which is enough to read the folder
// live — drop an image in, refresh, it's there, no build step. GitHub Pages has
// no such listing, so the published site reads the manifest instead.
async function readFolder(folder) {
  const base = "assets/work/" + encodeURIComponent(folder) + "/";
  const res = await fetch(base);
  if (!res.ok) return [];

  const doc = new DOMParser().parseFromString(await res.text(), "text/html");
  const names = Array.from(doc.querySelectorAll("a[href]"))
    .map(function (a) {
      const href = a.getAttribute("href").split(/[?#]/)[0];
      try { return decodeURIComponent(href.split("/").filter(Boolean).pop() || ""); }
      catch { return ""; }
    })
    .filter(function (name) {
      return IMAGE_EXT.test(name) || VIDEO_EXT.test(name) || DOC_EXT.test(name);
    });

  return Array.from(new Set(names))   // some servers link each file twice (icon + name)
    .sort(collator.compare)
    .map(function (name) {
      return {
        src: base + encodeURIComponent(name),
        type: typeOf(name),
        caption: captionFrom(name),
      };
    });
}

const isLocalPreview =
  /^https?:$/.test(location.protocol) &&
  ["localhost", "127.0.0.1", "[::1]", "::1"].indexOf(location.hostname) !== -1;

async function refreshFromFolders() {
  const found = {};
  await Promise.all(categories.map(async function (cat) {
    try {
      const files = await readFolder(cat.folder);
      // an empty result usually means the server served something other than a
      // listing, so keep the manifest rather than blanking the category
      if (files.length) found[cat.folder] = files;
    } catch { /* not a listing server - manifest stands */ }
  }));

  media = Object.assign({}, media, found);
  if (overlay.classList.contains("open")) openCategory(current); // redraw what's on screen
}

// Browsers without a built-in PDF viewer (most mobile ones) render an embedded
// PDF as a blank box, so those fall back to a link card instead.
const canEmbedPdf = navigator.pdfViewerEnabled !== false;

// A scrollable PDF inside the tile. #toolbar=0 hides the viewer chrome, which
// is too cramped to use at tile size - the expand button covers that instead.
function docEmbed(item, label) {
  const wrap = document.createElement("div");
  wrap.className = "doc-embed";

  const frame = document.createElement("iframe");
  frame.className = "doc-frame";
  frame.src = item.src + "#toolbar=0&navpanes=0&view=FitH";
  frame.title = label;
  frame.loading = "lazy";
  wrap.appendChild(frame);

  // the iframe swallows mousemove, so the custom dot would freeze mid-tile;
  // hide it and let the PDF viewer's own native cursor take over
  wrap.addEventListener("mouseenter", function () { cursor.classList.remove("on"); });

  const expand = document.createElement("button");
  expand.className = "doc-expand";
  expand.type = "button";
  expand.setAttribute("data-hover", "");
  expand.setAttribute("aria-label", "Open " + label + " full size");
  expand.textContent = "Expand";
  expand.addEventListener("click", function () { openDoc(item.src, label); });
  wrap.appendChild(expand);

  return wrap;
}

// fallback tile: no inline viewer available, so open the file directly
function docCard(item, label) {
  const link = document.createElement("a");
  link.className = "doc-card";
  link.href = item.src;
  link.target = "_blank";
  link.rel = "noopener";
  link.setAttribute("data-hover", "");
  link.setAttribute("aria-label", "Open " + label + " (PDF)");
  link.innerHTML =
    '<span class="doc-kind">PDF</span>' +
    '<span class="doc-name"></span>' +
    '<span class="doc-open">Open &#8599;</span>';
  link.querySelector(".doc-name").textContent = label;
  return link;
}

const PLACEHOLDERS_PER_CATEGORY = 3;

// stand-ins for categories whose folder is still empty, seeded so a category
// shows the same set on every open
function placeholders(cat, i) {
  const items = [];
  for (let p = 0; p < PLACEHOLDERS_PER_CATEGORY; p++) {
    items.push({
      src: "https://picsum.photos/seed/flora-" + i + "-" + p + "/640/800",
      type: "image",
      caption: cat.title + " — sample " + (p + 1),
    });
  }
  return items;
}

const indexEl = document.getElementById("index");
categories.forEach(function (cat, i) {
  const li = document.createElement("li");
  const num = String(i + 1).padStart(2, "0");
  li.innerHTML =
    '<button data-i="' + i + '" data-hover>' +
      '<span class="num">' + num + '</span>' +
      '<span class="title">' + cat.title + '</span>' +
      '<span class="tag">' + cat.tag + '</span>' +
    '</button>';
  indexEl.appendChild(li);
});

const tickerTrack = document.getElementById("tickerTrack");
const names = categories.map(function (c) { return c.title; });
// listed twice so the -50% scroll keyframe loops without a visible seam
const tickerText = names.concat(names).map(function (n) {
  return "<span>" + n + " &nbsp;·</span>";
}).join("");
tickerTrack.innerHTML = tickerText;

window.addEventListener("load", function () {
  setTimeout(function () {
    document.getElementById("loader").classList.add("done");
    document.body.classList.add("loaded");
  }, 900);
});

const cursor = document.getElementById("cursor");
// c* = rendered position, t* = target; start offscreen so the dot never flashes at 0,0
let cx = -100, cy = -100, tx = -100, ty = -100;

document.addEventListener("mousemove", function (e) {
  tx = e.clientX;
  ty = e.clientY;
  cursor.classList.add("on");
});

// delegated so dynamically built index rows are covered too
document.addEventListener("mouseover", function (e) {
  if (e.target.closest("[data-hover], a, button")) cursor.classList.add("grow");
});
document.addEventListener("mouseout", function (e) {
  if (e.target.closest("[data-hover], a, button")) cursor.classList.remove("grow");
});

// eases toward the pointer instead of snapping, for the trailing effect
function tick() {
  cx += (tx - cx) * 0.2;
  cy += (ty - cy) * 0.2;
  cursor.style.transform = "translate(" + cx + "px, " + cy + "px) translate(-50%, -50%)";

  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

const overlay = document.getElementById("overlay");
const overlayNum = document.getElementById("overlayNum");
const overlayTitle = document.getElementById("overlayTitle");
const overlayDesc = document.getElementById("overlayDesc");
const overlayGallery = document.getElementById("overlayGallery");
const overlaySocial = document.getElementById("overlaySocial");
let current = 0;

// line-art glyph, drawn with currentColor so it inherits the link's colour
const IG_GLYPH =
  '<svg class="ig-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<rect x="2.6" y="2.6" width="18.8" height="18.8" rx="5.4"/>' +
    '<circle cx="12" cy="12" r="4.4"/>' +
    '<circle class="ig-dot" cx="17.4" cy="6.6" r="1.15"/>' +
  '</svg>';

// "https://www.instagram.com/camp_skyline/" -> "@camp_skyline"
function igHandle(url) {
  const match = String(url).match(/instagram\.com\/([^/?#]+)/i);
  return match ? "@" + match[1] : "Instagram";
}

function renderSocial(cat) {
  overlaySocial.innerHTML = "";
  if (!cat.instagram) return; // categories without a profile show nothing

  const link = document.createElement("a");
  link.className = "ig-link";
  link.href = cat.instagram;
  link.target = "_blank";
  link.rel = "noopener";
  link.setAttribute("data-hover", "");
  link.setAttribute("aria-label", cat.title + " on Instagram");
  link.innerHTML = IG_GLYPH + '<span class="ig-handle"></span>';
  link.querySelector(".ig-handle").textContent = igHandle(cat.instagram);
  overlaySocial.appendChild(link);
}

// wraps at both ends so prev/next never run out
function openCategory(i) {
  current = (i + categories.length) % categories.length;
  const cat = categories[current];
  overlayNum.textContent =
    String(current + 1).padStart(2, "0") + " / " + String(categories.length).padStart(2, "0") + " — " + cat.tag;
  overlayTitle.textContent = cat.title;
  overlayDesc.textContent = cat.blurb;
  renderSocial(cat);

  const files = media[cat.folder] || [];
  const items = files.length ? files : placeholders(cat, current);

  overlayGallery.innerHTML = "";
  items.forEach(function (item, p) {
    const fig = document.createElement("figure");

    if (item.type === "video") {
      const video = document.createElement("video");
      video.src = item.src;
      video.controls = true;
      video.playsInline = true;
      video.preload = "metadata";
      fig.appendChild(video);
    } else if (item.type === "doc") {
      const label = item.caption || cat.title + " " + (p + 1);
      fig.appendChild(canEmbedPdf ? docEmbed(item, label) : docCard(item, label));
    } else {
      const img = document.createElement("img");
      img.src = item.src;
      img.alt = item.caption || cat.title + " " + (p + 1);
      img.loading = "lazy";
      fig.appendChild(img);
    }

    // no visible caption - the filename still feeds alt text and the PDF
    // reader's title, so it stays useful to screen readers without showing
    overlayGallery.appendChild(fig);
  });

  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden", "false");
  overlay.scrollTop = 0;
  document.body.style.overflow = "hidden"; // stop the page behind the overlay from scrolling
}

function closeOverlay() {
  overlay.classList.remove("open");
  overlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

const docViewer = document.getElementById("docViewer");
const docViewerFrame = document.getElementById("docViewerFrame");
const docViewerTitle = document.getElementById("docViewerTitle");

// full-size reader, layered over the category overlay so closing it returns
// to the gallery rather than the page
function openDoc(src, label) {
  docViewerFrame.src = src;
  docViewerTitle.textContent = label;
  docViewer.classList.add("open");
  docViewer.setAttribute("aria-hidden", "false");
  document.getElementById("docViewerClose").focus();
}

function closeDoc() {
  docViewer.classList.remove("open");
  docViewer.setAttribute("aria-hidden", "true");
  docViewerFrame.src = "about:blank"; // unload the PDF so it stops eating memory
}

document.getElementById("docViewerClose").addEventListener("click", closeDoc);
docViewer.addEventListener("click", function (e) {
  if (e.target === docViewer) closeDoc(); // click the backdrop to dismiss
});

indexEl.addEventListener("click", function (e) {
  const btn = e.target.closest("button");
  if (btn) openCategory(Number(btn.dataset.i));
});
document.getElementById("overlayClose").addEventListener("click", closeOverlay);
document.getElementById("prevCat").addEventListener("click", function () { openCategory(current - 1); });
document.getElementById("nextCat").addEventListener("click", function () { openCategory(current + 1); });
document.addEventListener("keydown", function (e) {
  // the document reader sits on top, so it takes Escape and swallows the arrows
  if (docViewer.classList.contains("open")) {
    if (e.key === "Escape") closeDoc();
    return;
  }
  if (e.key === "Escape") closeOverlay();
  if (!overlay.classList.contains("open")) return; // arrows only steer the overlay while it's open
  if (e.key === "ArrowLeft") openCategory(current - 1);
  if (e.key === "ArrowRight") openCategory(current + 1);
});

const nav = document.getElementById("nav");
window.addEventListener("scroll", function () {
  nav.classList.toggle("scrolled", window.scrollY > 40);
});

const observer = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add("in");
      observer.unobserve(entry.target); // reveal once, don't re-animate on scroll back
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach(function (el) { observer.observe(el); });

// runs last so overlay/openCategory already exist when a redraw is needed
if (isLocalPreview) refreshFromFolders();
