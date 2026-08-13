// TODO: replace titles, tags, and blurbs with real work
const categories = [
  { title: "Student Spotlight", tag: "Broadcasting", blurb: "Announcements written for real newsrooms: clear leads, tight quotes, and no fluff." },
  { title: "Interviews", tag: "Broadcasting", blurb: "Targeted pitches built around what a specific reporter actually covers." },
  { title: "Alabama Living Real Estate", tag: "Public Relations", blurb: "Multi-platform campaigns from concept and content calendar through reporting." },
  { title: "Pete Davis for Mayor Campaign", tag: "Campaign Manager", blurb: "Holding statements, response plans, and message maps built under time pressure." },
  { title: "Camp Skyline Ranch", tag: "Social Media", blurb: "Social graphics, one-pagers, and decks built in Canva and Adobe tools." },
  { title: "BeWell Nutrition", tag: "Social Media", blurb: "Press-ready kits: fact sheets, bios, boilerplate, and photography." },
  { title: "Clubs", tag: "Public Relations", blurb: "Launches and press events, from run-of-show documents to day-of logistics." },
  { title: "Suite K Salon + Spa", tag: "Social Media", blurb: "Email programs that people open on purpose. Subject lines tested, not guessed." },
  { title: "Photography", tag: "Content", blurb: "Long-form posts that earn search traffic and hold attention past the first paragraph." },
  { title: "Backdrops", tag: "Graphic Design", blurb: "Positioning, voice guidelines, and messaging frameworks for new and rebranded organizations." },
  { title: "Tech Team", tag: "Content", blurb: "Remarks written for the ear, not the page. Timed, rehearsed, delivered." },
  { title: "Voiceovers", tag: "Broadcasting", blurb: "Change announcements and leadership messages employees read to the end." },
  { title: "Yearbook Designs", tag: "Graphic Design", blurb: "Client stories with a problem, a decision, and a measurable result." },
  { title: "Fort Payne City Schools", tag: "Advertising", blurb: "Social graphics, one-pagers, and decks built in Canva and Adobe tools." },
];

const PIECES_PER_CATEGORY = 3;

// placeholder images, seeded so a category shows the same set on every open
function imgUrl(seed, w, h) {
  return "https://picsum.photos/seed/flora-" + seed + "/" + w + "/" + h;
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
let current = 0;

// wraps at both ends so prev/next never run out
function openCategory(i) {
  current = (i + categories.length) % categories.length;
  const cat = categories[current];
  overlayNum.textContent = String(current + 1).padStart(2, "0") + " / 14 — " + cat.tag;
  overlayTitle.textContent = cat.title;
  overlayDesc.textContent = cat.blurb;

  overlayGallery.innerHTML = "";
  for (let p = 0; p < PIECES_PER_CATEGORY; p++) {
    const fig = document.createElement("figure");
    const img = document.createElement("img");
    img.src = imgUrl(current + "-" + p, 640, 800);
    img.alt = cat.title + " sample " + (p + 1);
    img.loading = "lazy";
    const cap = document.createElement("figcaption");
    cap.textContent = cat.title + " — sample " + (p + 1);
    fig.appendChild(img);
    fig.appendChild(cap);
    overlayGallery.appendChild(fig);
  }

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

indexEl.addEventListener("click", function (e) {
  const btn = e.target.closest("button");
  if (btn) openCategory(Number(btn.dataset.i));
});
document.getElementById("overlayClose").addEventListener("click", closeOverlay);
document.getElementById("prevCat").addEventListener("click", function () { openCategory(current - 1); });
document.getElementById("nextCat").addEventListener("click", function () { openCategory(current + 1); });
document.addEventListener("keydown", function (e) {
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
