# CurveTrace

**A lightweight, offline Windows app for extracting numerical data from images of 2D plots.**

[![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-0078D4)](#requirements)
[![Works offline](https://img.shields.io/badge/works-offline-2E7D32)](#privacy)
[![License: MIT](https://img.shields.io/badge/license-MIT-6F42C1)](LICENSE)

![CurveTrace interface — replace this placeholder with the real screenshot before publishing](docs/curvetrace-screenshot.png)

> The included image is a clearly marked placeholder. Before publishing, replace
> `docs/curvetrace-screenshot.png` with a real screenshot by following
> [the screenshot guide](docs/SCREENSHOT_GUIDE.md).

CurveTrace turns a plot image into reusable numerical data. Calibrate the axes
with four reference points, trace one or more curves, adjust the points visually,
and export the result as CSV. Everything runs locally, and saved project files
embed the original image so the work can be reopened later.

## Highlights

- Four-point X/Y calibration with a guide grid
- Linear or logarithmic scale on each axis
- Support for rotated and slightly skewed plots
- Multiple independently named and colored datasets
- Connected points that can be added, inserted, dragged, nudged, or deleted
- Cursor magnifier for precise placement at high zoom
- Per-dataset and combined CSV export
- Portable `.curvetrace` project files with the source image embedded
- Offline, dependency-free browser interface
- Tiny portable Windows launcher; no installer required

## Download

For most users, download `CurveTrace_Windows_Portable_v1.0.zip` from the
[latest GitHub Release](../../releases/latest), extract it, and double-click
`CurveTrace.exe`.

The Windows executable is currently unsigned. Windows may therefore identify it
as an unrecognized app. You can verify the supplied SHA-256 checksums or inspect
and build the source before running it. `CurveTrace.html` is also included as a
transparent browser-based fallback.

## Requirements

- 64-bit Windows 10 or Windows 11
- Microsoft Edge or Google Chrome installed
- No internet connection, installer, administrator access, or runtime package

CurveTrace uses the installed Edge or Chrome rendering engine in an app-only
window. If neither executable can be found by name, the HTML app opens in the
default browser.

## Quick start

1. Open `CurveTrace.exe`.
2. Open, paste, or drag a plot image into the app.
3. Enter the known values for **X1**, **X2**, **Y1**, and **Y2**.
4. Drag the four calibration nodes to the corresponding locations on the image.
5. Choose linear or logarithmic scaling independently for X and Y.
6. Select **Finish calibration**. The calibration nodes and grid are hidden.
7. Click along a curve to create connected points in the active dataset.
8. Export a dataset as CSV, export all datasets together, or save the project.

## Editing controls

| Action | Control |
|---|---|
| Add a point | Click the plot in dataset mode |
| Move a point | Drag it |
| Select a point | Click it |
| Delete a point | Select it, then press `Delete` or `Backspace` |
| Insert between two points | Click their connecting line |
| Fine adjustment | Arrow keys |
| Larger adjustment | `Shift` + arrow key |
| Zoom around cursor | Mouse wheel |
| Pan | Hold `Space` and drag |
| Show calibration nodes and grid | Select **Calibration** |
| Return to tracing | Select **Finish calibration** |

## Calibration model

CurveTrace maps image positions into plot coordinates using the four reference
nodes. This handles translation, rotation, independent axis lengths, and mild
axis skew. It does not currently correct perspective distortion from a photo
taken at an angle; for best results, use a scan or a straight-on photograph.

## Files and exports

### Dataset CSV

An individual dataset contains:

```text
point,x,y,image_pixel_x,image_pixel_y
```

The combined CSV adds a leading `dataset` column. CSV files are UTF-8 with a byte
order mark for reliable display in spreadsheet software and import cleanly into
tools such as Excel, MATLAB, Python, and R.

### Project file

A `.curvetrace` project stores:

- The source image
- Calibration points and values
- Linear/log scale settings
- Grid settings
- Dataset names, colors, point coordinates, and point order

Because the image is embedded, no separate image file is required when a project
is reopened.

## Privacy

CurveTrace performs its work locally and contains no analytics, ads, user
accounts, or network requests. Plot images and extracted data remain on your
computer unless you share the exported files yourself.

## Build from source

The browser app is plain HTML, CSS, and JavaScript. The small native launcher
embeds that HTML and opens it in app mode.

The provided build script requires Node.js plus a GNU C++/binutils toolchain
capable of producing a 64-bit Windows PE executable:

```bash
chmod +x build.sh
./build.sh
```

Run the automated tests independently with:

```bash
node tools_bundle.js
node tests/core.test.js
node tests/structure.test.js
```

## Current limitations

- Manual tracing only; there is no automatic curve detection yet.
- Perspective correction is not implemented.
- The initial release imports raster images, not PDF pages directly.
- The executable is not code-signed.

## Development provenance

CurveTrace began with the project author's concept, workflow, and acceptance
decisions. The first functional prototype—including the interface,
rotation-aware calibration, portable launcher, tests, and documentation—was
implemented in approximately **one hour** during a single collaborative session
with [OpenAI Codex in ChatGPT Work](https://learn.chatgpt.com/docs/developers).

The coding agent was GPT-5-based, but the exact deployed model variant was not
exposed to the session. This wording is intentionally more accurate than
claiming an unverified model version.

AI-generated code can contain mistakes. The release includes automated checks,
but Windows behavior should still be independently tested before relying on the
software for critical scientific or engineering work.

## Contributing and support

Bug reports and focused improvements are welcome. Read
[CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. For security
issues, follow [SECURITY.md](SECURITY.md) rather than posting sensitive details
in a public issue.

## License

CurveTrace is available under the [MIT License](LICENSE).

