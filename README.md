# CurveTrace

**A lightweight, offline Windows application for extracting numerical data from images of 2D plots.**



CurveTrace turns plot images into reusable numerical data. Calibrate the axes using four reference points, trace one or more curves, adjust the extracted points visually, and export the results as CSV files.

Everything runs locally on your computer. No internet connection, account, or cloud upload is required.

## Highlights

* Four-point X/Y axis calibration with a visual guide grid
* Linear or logarithmic scaling for each axis
* Support for rotated and slightly skewed plot images
* Multiple independently named and colored datasets
* Connected points that can be added, inserted, dragged, nudged, or deleted
* Click a line segment to insert an additional point
* Zoom and pan controls for accurate point placement
* Cursor magnifier for detailed tracing at high zoom
* Editable dataset colors and names
* CSV export of extracted numerical data
* Project saving and reopening with the original image embedded
* Fully offline operation
* Lightweight interface designed for Windows

## Download and Installation

1. Open the **Releases** section of this repository.
2. Download the latest Windows release.
3. Extract the downloaded ZIP file if necessary.
4. Run `CurveTrace.exe`.

CurveTrace is portable and does not require a traditional installation unless otherwise stated in the release notes.

> Windows may display a security warning when opening an unsigned application downloaded from the internet. If you downloaded CurveTrace from this repository, select **More info** and then **Run anyway**.

## How to Use

### 1. Load a plot image

Open an image containing the 2D plot you want to digitize.

### 2. Calibrate the axes

Enter the known minimum and maximum values for the X and Y axes. Place the four calibration markers on their corresponding positions in the image.

Select linear or logarithmic scaling for each axis as required.

### 3. Create a dataset

Select the default dataset or add additional datasets. Each dataset can have its own name and color.

### 4. Trace the curve

Activate a dataset and click along the curve to add points. Points are connected in the order in which they are created.

You can:

* Drag a point to reposition it.
* Click a line segment to insert a new point.
* Select a point and press `Delete` to remove it.
* Use the zoom and magnifier tools for precise placement.

### 5. Export the data

Export the extracted coordinates as a CSV file for use in MATLAB, Python, Excel, Origin, or other data-analysis software.

## Supported Images

CurveTrace is intended for ordinary raster images of 2D plots, including:

* Screenshots
* Scanned figures
* Images exported from PDF documents
* Photographs of printed plots

For the best results, use a clear, high-resolution image in which the axis positions and curve are visible.

## Privacy

CurveTrace works entirely offline. Plot images, project files, and extracted datasets remain on your computer and are not uploaded to any server.

## Typical Applications

CurveTrace can be used to recover data from:

* Scientific publications
* Datasheets
* Technical reports
* Simulation results
* Measurement plots
* Legacy figures for which the original data are unavailable

Please respect copyright, licensing terms, and data-usage restrictions when extracting information from published material.

## Limitations

* Curve tracing is performed manually.
* Extraction accuracy depends on image resolution and calibration accuracy.
* Highly distorted, blurred, or perspective-skewed images may reduce accuracy.
* CurveTrace does not reconstruct hidden or overlapping data.

## Reporting Problems

If you find a bug or have a feature request, open an issue in this repository. Please include:

* A short description of the problem
* Steps to reproduce it
* Your Windows version
* A screenshot, when helpful

Do not include confidential or copyrighted plot images unless you have permission to share them.

## Development

CurveTrace was designed and developed with assistance from ChatGPT. The project demonstrates how AI-assisted software development can be used to rapidly turn a practical research need into a functional desktop application.

## License

This project is distributed under the [MIT License](LICENSE).
