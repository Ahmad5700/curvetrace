# CurveTrace v1.0.0 — Initial Release

CurveTrace is a lightweight, offline Windows plot digitizer. It converts curves
in plot images into numerical datasets through four-point calibration and manual
tracing.

## What is included

- Calibration for linear or logarithmic X and Y axes
- Support for rotated and slightly skewed plots
- Multiple datasets with connected, editable points
- Click-a-line point insertion and keyboard nudging
- Cursor magnifier plus zoom and pan
- Individual or combined CSV export
- Reopenable `.curvetrace` projects with the original image embedded
- Portable operation with no installer or internet connection

## Downloads

- `CurveTrace_Windows_Portable_v1.0.zip` — recommended package
- `CurveTrace.exe` — standalone Windows launcher
- `SHA256SUMS.txt` — checksums for release verification

## Requirements and notes

CurveTrace is designed for 64-bit Windows 10/11 and uses an installed copy of
Microsoft Edge or Google Chrome to render its local interface. The executable is
not code-signed, so Windows may identify it as an unrecognized app.

This first functional prototype was implemented in approximately one hour during
a single collaborative development session with OpenAI Codex in ChatGPT Work.
The product concept, requirements, and acceptance decisions came from the project
author. See the repository README for the full development-provenance statement.

