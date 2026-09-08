# Publishing CurveTrace on GitHub

This file contains copy-ready text and the exact publishing sequence.

## 1. Create the repository

Use these values on GitHub's **New repository** page:

| Field | Text to use |
|---|---|
| Repository name | `curvetrace` |
| Repository title in README | `CurveTrace — Lightweight Offline Plot Digitizer for Windows` |
| Description | `A lightweight, offline Windows app for extracting numerical data from 2D plot images with four-point calibration, multiple datasets, a magnifier, and CSV export.` |
| Visibility | `Public` |
| Initialize with README | No — this package already contains one |
| Add .gitignore | No — this package already contains one |
| Choose a license | No — this package already contains the MIT License |

Suggested first commit message:

```text
Initial release of CurveTrace v1.0.0
```

## 2. Add repository topics

Open **About → Settings** on the repository page and add:

```text
plot-digitizer
graph-digitizer
data-extraction
scientific-software
windows
offline-first
csv
javascript
data-visualization
research-tools
```

## 3. Files to upload to the code repository

Upload the contents of the prepared GitHub source package, including:

```text
.github/
docs/
launcher/
src/
tests/
.gitignore
CHANGELOG.md
CONTRIBUTING.md
GITHUB_PUBLISHING.md
LICENSE
README.md
RELEASE_NOTES_v1.0.0.md
SECURITY.md
build.sh
tools_bundle.js
```

Do not commit `build/`, `dist/`, or `release/`. Those are generated folders.
Publish user-facing binaries as GitHub Release assets instead.

## 4. Replace the screenshot placeholder

Before the first commit, replace `docs/curvetrace-screenshot.png` with a real app
screenshot using [docs/SCREENSHOT_GUIDE.md](docs/SCREENSHOT_GUIDE.md). Keep the
same filename and the README will display it automatically.

## 5. Create the first release

After uploading the source, open **Releases → Draft a new release** and use:

| Field | Text to use |
|---|---|
| Tag | `v1.0.0` |
| Target | `main` |
| Release title | `CurveTrace v1.0.0 — Initial Release` |
| Set as latest release | Yes |
| Pre-release | No |

Paste the contents of `RELEASE_NOTES_v1.0.0.md` into the release description,
then attach:

```text
CurveTrace_Windows_Portable_v1.0.zip
CurveTrace.exe
SHA256SUMS.txt
```

## 6. Add the social preview image

GitHub can show a wide image when the repository link is shared. Open
**Settings → General → Social preview** and upload a PNG or JPG. GitHub recommends
at least 640 × 320 pixels; 1280 × 640 is a good target. Keep it below 1 MB.

This is separate from the app screenshot in the README. A simple social preview
can use the CurveTrace name, the phrase “Offline plot digitizer for Windows,” and
a cropped portion of the real interface.

## 7. Optional public announcement

```text
I built CurveTrace, a lightweight offline Windows app for extracting numerical
data from images of 2D plots. It supports four-point calibration, linear and log
axes, multiple datasets, precise point editing, a cursor magnifier, CSV export,
and project files that embed the source image.

The first functional prototype was implemented in about one hour in a single
collaborative session with OpenAI Codex in ChatGPT Work. The concept, workflow,
and acceptance decisions were mine; Codex assisted with implementation, tests,
packaging, and documentation.

[PASTE YOUR GITHUB REPOSITORY LINK HERE]
```

## 8. Identity detail to customize

The repository is ready without a personal name. If you want your real name or
GitHub handle shown, add a one-line **Author** section to `README.md` and replace
“CurveTrace contributors” in `LICENSE` with your preferred public name.

