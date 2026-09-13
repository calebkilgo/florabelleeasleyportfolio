# Adding images to the portfolio

Each folder here is one category on the Experience list. Drop files into the
matching folder and they appear in that category's gallery.

| Folder | Category |
| --- | --- |
| `student-spotlight` | Student Spotlight |
| `interviews` | Interviews |
| `alabama-living-real-estate` | Alabama Living Real Estate |
| `pete-davis-for-mayor` | Pete Davis for Mayor Campaign |
| `camp-skyline-ranch` | Camp Skyline Ranch |
| `bewell-nutrition` | BeWell Nutrition |
| `clubs` | Clubs |
| `suite-k-salon-spa` | Suite K Salon + Spa |
| `photography` | Photography |
| `backdrops` | Backdrops |
| `tech-team` | Tech Team |
| `voiceovers` | Voiceovers |
| `fort-payne-city-schools` | Fort Payne City Schools |

## After dropping files in

Nothing. Refresh the page.

While previewing on a local server, the page reads these folders directly, so
new files show up on refresh. When you push to GitHub, a workflow rebuilds
`assets/manifest.js` — which is how the published site knows what's here, since
GitHub Pages can't list folders.

If you ever want to rebuild the manifest by hand: `node .github/build-media.mjs`.

## What gets picked up

- Images: `.jpg` `.jpeg` `.png` `.webp` `.gif` `.avif`
- Video: `.mp4` `.webm` `.mov` `.m4v` — shown with playback controls
- Documents: `.pdf` — embedded in the tile, scrollable in place

Anything else in a folder is ignored, so stray files do no harm.

## Video has to be compressed first

Camera originals are far too big for a website. A 4K clip runs about 120 Mbps —
a visitor's browser would buffer endlessly and burn gigabytes of their data on
one video. GitHub also rejects any file over 100 MB outright, and Vercel
deploys from the repo, so an oversized file never reaches the site at all.

Export or convert to **1080p H.264** before dropping a video in. With ffmpeg:

```
ffmpeg -i INPUT.MP4 -vf "scale=-2:1080" -c:v libx264 -preset medium -crf 24 \
  -c:a aac -b:a 128k -movflags +faststart OUTPUT.mp4
```

`-movflags +faststart` matters: it moves the index to the front of the file so
playback can begin before the whole thing downloads.

## Cover images for video

A video with no cover sits on the page as a black box. To give one a cover,
drop in an image **named after the video**:

```
01 - Interview.mp4
01 - Interview.jpg     <- the cover for it
```

The image becomes that clip's cover and does not get a tile of its own, so
nothing shows up twice. Any image type works, and a designed title card works
just as well as a still from the clip — to replace a cover, overwrite the file
and keep the name.

The interview covers already in place are frames pulled from the clips. To grab
one from a different moment (`-ss` is how many seconds in):

```
ffmpeg -ss 30 -i "01 - Interview.mp4" -vf "thumbnail=300,scale=1280:-2" \
  -frames:v 1 -q:v 3 -y "01 - Interview.jpg"
```

Files over 100 MB are skipped by the scanner, which prints what it skipped and
why — so a too-big video shows up as a warning rather than a broken tile.

A PDF reads inside its own square: scroll through the pages without leaving the
site, or hit **Expand** for a full-size reader (Escape or the backdrop closes
it). Multi-page PDFs work — all the pages are there in the tile.

Tile-size text can be small, which is what Expand is for. On browsers with no
built-in PDF viewer (mostly phones), the tile falls back to a card that opens
the file. If a PDF really needs to read as a picture at a glance, export a JPG
and drop it in alongside.

## Ordering and captions

Files are sorted by name, so number them to control the order:

```
01 - Homecoming Reel.mp4
02 - Spring Break Recap.mp4
10 - Closing Day.mp4
```

The leading number is stripped and the rest becomes the caption, so the example
above reads "Homecoming Reel". Camera filenames like `IMG_4821.jpg` get no
caption rather than an ugly one.

## Empty folders

A category with no files falls back to placeholder images, so the site never
shows an empty gallery while it's being filled in.

## Adding a new category

1. Make a folder here.
2. Add an entry to `categories` in `script.js` with a `folder` matching the
   folder name.
