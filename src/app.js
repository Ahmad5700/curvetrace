(function () {
  "use strict";

  const Core = window.CurveCore;
  const $ = (id) => document.getElementById(id);
  const COLORS = ["#e34655", "#3478e5", "#13a06f", "#9a55d6", "#ea8b2d", "#1396a5", "#5e6675", "#d34f9d"];
  const NODE_COLORS = { x1: "#1689b2", x2: "#1689b2", y1: "#e47d32", y2: "#e47d32" };
  const PROJECT_FORMAT = "CurveTrace Project";
  const PROJECT_VERSION = 1;

  const ui = {
    actualSizeButton: $("actualSizeButton"),
    addDatasetButton: $("addDatasetButton"),
    calibrationBadge: $("calibrationBadge"),
    calibrationMessage: $("calibrationMessage"),
    calibrationToggle: $("calibrationToggle"),
    calibrationToggleHint: $("calibrationToggleHint"),
    calibrationToggleTitle: $("calibrationToggleTitle"),
    canvas: $("plotCanvas"),
    canvasWrap: $("canvasWrap"),
    clearDatasetButton: $("clearDatasetButton"),
    colorSwatches: $("colorSwatches"),
    cursorPixel: $("cursorPixel"),
    cursorX: $("cursorX"),
    cursorY: $("cursorY"),
    datasetList: $("datasetList"),
    datasetNameInput: $("datasetNameInput"),
    deleteDatasetButton: $("deleteDatasetButton"),
    deletePointButton: $("deletePointButton"),
    emptyOpenButton: $("emptyOpenButton"),
    emptyState: $("emptyState"),
    exportAllButton: $("exportAllButton"),
    exportDatasetButton: $("exportDatasetButton"),
    fitButton: $("fitButton"),
    gridX: $("gridX"),
    gridY: $("gridY"),
    imageDetail: $("imageDetail"),
    imageDropZone: $("imageDropZone"),
    imageFileInput: $("imageFileInput"),
    imageName: $("imageName"),
    imageSizeText: $("imageSizeText"),
    magnifierCanvas: $("magnifierCanvas"),
    magnifierEmpty: $("magnifierEmpty"),
    magnifierFactor: $("magnifierFactor"),
    modeIndicator: $("modeIndicator"),
    openImageButton: $("openImageButton"),
    openProjectButton: $("openProjectButton"),
    placementNode: $("placementNode"),
    placementTip: $("placementTip"),
    pointCountText: $("pointCountText"),
    projectFileInput: $("projectFileInput"),
    projectState: $("projectState"),
    projectStateText: $("projectStateText"),
    saveProjectButton: $("saveProjectButton"),
    selectedHint: $("selectedHint"),
    selectedIndex: $("selectedIndex"),
    selectedTitle: $("selectedTitle"),
    selectedX: $("selectedX"),
    selectedY: $("selectedY"),
    statusText: $("statusText"),
    toastRegion: $("toastRegion"),
    x1Value: $("x1Value"),
    x2Value: $("x2Value"),
    xScale: $("xScale"),
    y1Value: $("y1Value"),
    y2Value: $("y2Value"),
    yScale: $("yScale"),
    zoomInButton: $("zoomInButton"),
    zoomOutButton: $("zoomOutButton"),
    zoomReadout: $("zoomReadout"),
  };

  const ctx = ui.canvas.getContext("2d", { alpha: true });
  const magnifierContext = ui.magnifierCanvas.getContext("2d", { alpha: false });
  let idSequence = 1;
  let spaceDown = false;
  let cursorImage = null;
  let hoverTarget = null;
  let resizeQueued = false;

  const state = {
    image: null,
    imageSource: null,
    imageName: "",
    imageType: "",
    mode: "empty",
    dirty: false,
    projectName: "Untitled",
    view: { scale: 1, offsetX: 0, offsetY: 0 },
    calibration: makeEmptyCalibration(),
    datasets: [makeDataset(1)],
    activeDatasetId: null,
    selectedPointId: null,
    selectedCalibrationNode: null,
    placingCalibrationNode: null,
    interaction: null,
  };
  state.activeDatasetId = state.datasets[0].id;

  function makeId(prefix) {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return `${prefix}-${window.crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now().toString(36)}-${(idSequence++).toString(36)}`;
  }

  function makeDataset(number) {
    return {
      id: makeId("dataset"),
      name: `Dataset ${number}`,
      color: COLORS[(number - 1) % COLORS.length],
      points: [],
    };
  }

  function makeEmptyCalibration() {
    return {
      values: { x1: 0, x2: 1, y1: 0, y2: 1 },
      points: { x1: null, x2: null, y1: null, y2: null },
      xScale: "linear",
      yScale: "linear",
      gridX: 10,
      gridY: 10,
    };
  }

  function makeDefaultCalibration(width, height) {
    const left = width * 0.14;
    const right = width * 0.86;
    const top = height * 0.16;
    const bottom = height * 0.84;
    return {
      values: { x1: 0, x2: 1, y1: 0, y2: 1 },
      points: {
        x1: { x: width * 0.22, y: bottom },
        x2: { x: right, y: bottom },
        y1: { x: left, y: height * 0.78 },
        y2: { x: left, y: top },
      },
      xScale: "linear",
      yScale: "linear",
      gridX: 10,
      gridY: 10,
    };
  }

  function activeDataset() {
    return state.datasets.find((dataset) => dataset.id === state.activeDatasetId) || state.datasets[0] || null;
  }

  function selectedPoint() {
    const dataset = activeDataset();
    if (!dataset || !state.selectedPointId) return null;
    return dataset.points.find((point) => point.id === state.selectedPointId) || null;
  }

  function calibrationTransform() {
    return Core.createTransform(state.calibration);
  }

  function setDirty(dirty) {
    state.dirty = Boolean(dirty);
    updateProjectState();
  }

  function updateProjectState() {
    ui.projectState.classList.remove("dirty", "saved");
    if (!state.image) {
      ui.projectStateText.textContent = "No project";
      return;
    }
    if (state.dirty) {
      ui.projectState.classList.add("dirty");
      ui.projectStateText.textContent = "Unsaved changes";
    } else {
      ui.projectState.classList.add("saved");
      ui.projectStateText.textContent = "Project saved";
    }
  }

  function setStatus(message) {
    ui.statusText.textContent = message;
  }

  function toast(message, type) {
    const item = document.createElement("div");
    item.className = `toast${type ? ` ${type}` : ""}`;
    item.textContent = message;
    ui.toastRegion.appendChild(item);
    window.setTimeout(() => item.remove(), 3200);
  }

  function confirmDiscard() {
    return !state.dirty || window.confirm("This project has unsaved changes. Continue and discard them?");
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("The file could not be read."));
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });
  }

  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("The file could not be read."));
      reader.onload = () => resolve(String(reader.result));
      reader.readAsText(file);
    });
  }

  function decodeImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("This image format could not be decoded."));
      image.src = source;
    });
  }

  function looksLikeImage(file) {
    return Boolean(file && (file.type.startsWith("image/") || /\.(png|jpe?g|bmp|gif|webp)$/i.test(file.name)));
  }

  async function openImageFile(file) {
    if (!looksLikeImage(file)) {
      toast("Choose a PNG, JPEG, BMP, GIF, or WebP image.", "error");
      return;
    }
    if (!confirmDiscard()) return;
    try {
      setStatus("Reading image…");
      const source = await readFileAsDataUrl(file);
      const image = await decodeImage(source);
      state.image = image;
      state.imageSource = source;
      state.imageName = file.name || "Plot image";
      state.imageType = file.type || "image/*";
      state.projectName = state.imageName.replace(/\.[^.]+$/, "") || "Untitled";
      state.mode = "calibration";
      state.calibration = makeDefaultCalibration(image.naturalWidth, image.naturalHeight);
      state.datasets = [makeDataset(1)];
      state.activeDatasetId = state.datasets[0].id;
      state.selectedPointId = null;
      state.selectedCalibrationNode = "x1";
      state.placingCalibrationNode = null;
      cursorImage = null;
      fitImage();
      syncCalibrationInputs();
      setDirty(true);
      updateAll();
      setStatus("Calibration mode: drag the four nodes onto known axis positions.");
      toast("Image loaded. Set the four calibration nodes.", "success");
    } catch (error) {
      setStatus("Could not open image.");
      toast(error.message || "Could not open image.", "error");
    }
  }

  function sanitizeProject(raw) {
    if (!raw || raw.format !== PROJECT_FORMAT || Number(raw.version) !== PROJECT_VERSION) {
      throw new Error("This is not a valid CurveTrace project file.");
    }
    if (!raw.image || typeof raw.image.dataUrl !== "string" || !raw.image.dataUrl.startsWith("data:image/")) {
      throw new Error("The project does not contain its plot image.");
    }

    const calibration = raw.calibration || {};
    const projectNumber = (value) => value !== null && value !== "" && Number.isFinite(Number(value))
      ? Number(value)
      : NaN;
    const normalizedCalibration = {
      values: {
        x1: projectNumber(calibration.values && calibration.values.x1),
        x2: projectNumber(calibration.values && calibration.values.x2),
        y1: projectNumber(calibration.values && calibration.values.y1),
        y2: projectNumber(calibration.values && calibration.values.y2),
      },
      points: {},
      xScale: calibration.xScale === "log" ? "log" : "linear",
      yScale: calibration.yScale === "log" ? "log" : "linear",
      gridX: Core.clamp(Math.round(Number(calibration.gridX) || 10), 2, 20),
      gridY: Core.clamp(Math.round(Number(calibration.gridY) || 10), 2, 20),
    };
    for (const key of ["x1", "x2", "y1", "y2"]) {
      const point = calibration.points && calibration.points[key];
      normalizedCalibration.points[key] = point && Number.isFinite(Number(point.x)) && Number.isFinite(Number(point.y))
        ? { x: Number(point.x), y: Number(point.y) }
        : null;
    }

    let datasets = Array.isArray(raw.datasets) ? raw.datasets.map((dataset, index) => ({
      id: typeof dataset.id === "string" ? dataset.id : makeId("dataset"),
      name: String(dataset.name || `Dataset ${index + 1}`).slice(0, 80),
      color: /^#[0-9a-f]{6}$/i.test(dataset.color) ? dataset.color : COLORS[index % COLORS.length],
      points: Array.isArray(dataset.points) ? dataset.points
        .filter((point) => Number.isFinite(Number(point.x)) && Number.isFinite(Number(point.y)))
        .map((point) => ({
          id: typeof point.id === "string" ? point.id : makeId("point"),
          x: Number(point.x),
          y: Number(point.y),
        })) : [],
    })) : [];
    if (!datasets.length) datasets = [makeDataset(1)];

    return {
      raw,
      calibration: normalizedCalibration,
      datasets,
      imageSource: raw.image.dataUrl,
      imageName: String(raw.image.name || "Project image"),
      imageType: String(raw.image.type || "image/*"),
      activeDatasetId: datasets.some((dataset) => dataset.id === raw.activeDatasetId)
        ? raw.activeDatasetId
        : datasets[0].id,
    };
  }

  async function openProjectFile(file) {
    try {
      setStatus("Reading project…");
      const raw = JSON.parse(await readFileAsText(file));
      const project = sanitizeProject(raw);
      const image = await decodeImage(project.imageSource);
      if (!confirmDiscard()) return;

      state.image = image;
      state.imageSource = project.imageSource;
      state.imageName = project.imageName;
      state.imageType = project.imageType;
      state.projectName = file.name.replace(/\.(curvetrace|json)$/i, "") || "Untitled";
      state.calibration = project.calibration;
      state.datasets = project.datasets;
      state.activeDatasetId = project.activeDatasetId;
      state.selectedPointId = null;
      state.selectedCalibrationNode = null;
      state.placingCalibrationNode = null;
      state.mode = project.raw.mode === "calibration" ? "calibration" : "data";
      if (!calibrationTransform().valid) state.mode = "calibration";
      cursorImage = null;
      fitImage();
      syncCalibrationInputs();
      setDirty(false);
      updateAll();
      setStatus("Project opened.");
      toast("Project and embedded image opened.", "success");
    } catch (error) {
      setStatus("Could not open project.");
      toast(error.message || "Could not open project.", "error");
    }
  }

  function projectObject() {
    return {
      format: PROJECT_FORMAT,
      version: PROJECT_VERSION,
      savedAt: new Date().toISOString(),
      mode: state.mode,
      image: {
        name: state.imageName,
        type: state.imageType,
        width: state.image.naturalWidth,
        height: state.image.naturalHeight,
        dataUrl: state.imageSource,
      },
      calibration: state.calibration,
      datasets: state.datasets,
      activeDatasetId: state.activeDatasetId,
    };
  }

  async function saveBlob(blob, suggestedName, description, extensions) {
    if (typeof window.showSaveFilePicker === "function") {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName,
          types: [{ description, accept: { [blob.type || "application/octet-stream"]: extensions } }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
      } catch (error) {
        if (error && error.name === "AbortError") return false;
      }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = suggestedName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  }

  async function saveProject() {
    if (!state.image) return;
    try {
      setStatus("Saving project…");
      const content = JSON.stringify(projectObject());
      const blob = new Blob([content], { type: "application/json" });
      const name = `${Core.safeFilename(state.projectName, "CurveTrace_Project")}.curvetrace`;
      if (await saveBlob(blob, name, "CurveTrace project", [".curvetrace"])) {
        setDirty(false);
        setStatus("Project saved with its embedded image.");
        toast("Project saved with image, calibration, and datasets.", "success");
      } else {
        setStatus("Save cancelled.");
      }
    } catch (error) {
      setStatus("Could not save project.");
      toast(error.message || "Could not save project.", "error");
    }
  }

  function datasetCsv(dataset, includeDatasetName) {
    const transform = calibrationTransform();
    if (!transform.valid) throw new Error(transform.reason);
    const rows = [];
    rows.push(includeDatasetName
      ? ["dataset", "point", "x", "y", "image_pixel_x", "image_pixel_y"]
      : ["point", "x", "y", "image_pixel_x", "image_pixel_y"]);
    dataset.points.forEach((point, index) => {
      const data = transform.toData(point);
      const values = [
        index + 1,
        Core.formatNumber(data.x, 12),
        Core.formatNumber(data.y, 12),
        point.x.toFixed(3),
        point.y.toFixed(3),
      ];
      if (includeDatasetName) values.unshift(spreadsheetSafeLabel(dataset.name));
      rows.push(values);
    });
    return "\ufeff" + rows.map((row) => row.map(Core.escapeCsv).join(",")).join("\r\n") + "\r\n";
  }

  function spreadsheetSafeLabel(value) {
    const text = String(value == null ? "" : value);
    return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  }

  async function exportDataset(dataset) {
    if (!dataset || !dataset.points.length) {
      toast("This dataset has no points to save.", "error");
      return;
    }
    try {
      const blob = new Blob([datasetCsv(dataset, false)], { type: "text/csv" });
      const name = `${Core.safeFilename(dataset.name, "Dataset")}.csv`;
      if (await saveBlob(blob, name, "CSV dataset", [".csv"])) {
        setStatus(`${dataset.name} saved as CSV.`);
        toast(`${dataset.name} saved.`, "success");
      }
    } catch (error) {
      toast(error.message || "Could not save this dataset.", "error");
    }
  }

  async function exportAllDatasets() {
    const populated = state.datasets.filter((dataset) => dataset.points.length);
    if (!populated.length) {
      toast("There are no dataset points to save.", "error");
      return;
    }
    try {
      const transform = calibrationTransform();
      if (!transform.valid) throw new Error(transform.reason);
      const rows = [["dataset", "point", "x", "y", "image_pixel_x", "image_pixel_y"]];
      for (const dataset of populated) {
        dataset.points.forEach((point, index) => {
          const data = transform.toData(point);
          rows.push([
            spreadsheetSafeLabel(dataset.name),
            index + 1,
            Core.formatNumber(data.x, 12),
            Core.formatNumber(data.y, 12),
            point.x.toFixed(3),
            point.y.toFixed(3),
          ]);
        });
      }
      const csv = "\ufeff" + rows.map((row) => row.map(Core.escapeCsv).join(",")).join("\r\n") + "\r\n";
      const blob = new Blob([csv], { type: "text/csv" });
      const name = `${Core.safeFilename(state.projectName, "CurveTrace")}_all_datasets.csv`;
      if (await saveBlob(blob, name, "Combined CSV datasets", [".csv"])) {
        setStatus("Combined datasets saved as CSV.");
        toast("Combined CSV saved.", "success");
      }
    } catch (error) {
      toast(error.message || "Could not save the combined CSV.", "error");
    }
  }

  function syncCalibrationInputs() {
    const calibration = state.calibration;
    ui.x1Value.value = Number.isFinite(calibration.values.x1) ? String(calibration.values.x1) : "";
    ui.x2Value.value = Number.isFinite(calibration.values.x2) ? String(calibration.values.x2) : "";
    ui.y1Value.value = Number.isFinite(calibration.values.y1) ? String(calibration.values.y1) : "";
    ui.y2Value.value = Number.isFinite(calibration.values.y2) ? String(calibration.values.y2) : "";
    ui.xScale.value = calibration.xScale;
    ui.yScale.value = calibration.yScale;
    ui.gridX.value = String(calibration.gridX);
    ui.gridY.value = String(calibration.gridY);
  }

  function readCalibrationInputs() {
    state.calibration.values.x1 = ui.x1Value.valueAsNumber;
    state.calibration.values.x2 = ui.x2Value.valueAsNumber;
    state.calibration.values.y1 = ui.y1Value.valueAsNumber;
    state.calibration.values.y2 = ui.y2Value.valueAsNumber;
    state.calibration.xScale = ui.xScale.value === "log" ? "log" : "linear";
    state.calibration.yScale = ui.yScale.value === "log" ? "log" : "linear";
    state.calibration.gridX = Core.clamp(Math.round(Number(ui.gridX.value) || 10), 2, 20);
    state.calibration.gridY = Core.clamp(Math.round(Number(ui.gridY.value) || 10), 2, 20);
    setDirty(true);
    updateCalibrationStatus();
    updateCursorInspector();
    updateSelectedInspector();
    render();
  }

  function updateCalibrationStatus() {
    const result = calibrationTransform();
    ui.calibrationBadge.className = "status-badge";
    ui.calibrationMessage.classList.toggle("error", !result.valid);
    if (!state.image) {
      ui.calibrationBadge.classList.add("waiting");
      ui.calibrationBadge.textContent = "Waiting";
      ui.calibrationMessage.textContent = "Open an image to begin.";
    } else if (!result.valid) {
      ui.calibrationBadge.classList.add("error");
      ui.calibrationBadge.textContent = "Check";
      ui.calibrationMessage.textContent = result.reason;
    } else if (state.mode === "calibration") {
      ui.calibrationBadge.classList.add("editing");
      ui.calibrationBadge.textContent = "Editing";
      ui.calibrationMessage.textContent = "Drag each node to its known tick. The grid follows rotation and skew.";
    } else {
      ui.calibrationBadge.classList.add("ready");
      ui.calibrationBadge.textContent = "Ready";
      ui.calibrationMessage.textContent = "Calibration is active. Reopen it at any time to adjust the nodes.";
    }
  }

  function toggleCalibrationMode() {
    if (!state.image) return;
    if (state.mode === "calibration") {
      const result = calibrationTransform();
      if (!result.valid) {
        toast(result.reason, "error");
        updateCalibrationStatus();
        return;
      }
      state.mode = "data";
      state.selectedCalibrationNode = null;
      state.placingCalibrationNode = null;
      setStatus("Dataset mode: click the active curve to add points.");
    } else {
      state.mode = "calibration";
      state.selectedPointId = null;
      state.selectedCalibrationNode = "x1";
      setStatus("Calibration mode: nodes and guide grid are visible.");
    }
    setDirty(true);
    updateAll();
  }

  function renderDatasetsList() {
    ui.datasetList.textContent = "";
    const transform = calibrationTransform();
    for (const dataset of state.datasets) {
      const row = document.createElement("div");
      row.className = `dataset-row${dataset.id === state.activeDatasetId ? " active" : ""}`;
      row.dataset.datasetId = dataset.id;
      row.tabIndex = 0;
      row.setAttribute("role", "button");
      row.setAttribute("aria-pressed", String(dataset.id === state.activeDatasetId));

      const color = document.createElement("span");
      color.className = "dataset-color";
      color.style.backgroundColor = dataset.color;

      const meta = document.createElement("span");
      meta.className = "dataset-meta";
      const name = document.createElement("span");
      name.className = "dataset-name";
      name.textContent = dataset.name;
      const count = document.createElement("span");
      count.className = "dataset-count";
      count.textContent = `${dataset.points.length} ${dataset.points.length === 1 ? "point" : "points"}`;
      meta.append(name, count);

      const active = document.createElement("span");
      active.className = "dataset-active-label";
      active.textContent = dataset.id === state.activeDatasetId ? "Active" : "";

      const exportButton = document.createElement("button");
      exportButton.className = "row-export";
      exportButton.type = "button";
      exportButton.dataset.exportDatasetId = dataset.id;
      exportButton.title = `Save ${dataset.name} as CSV`;
      exportButton.setAttribute("aria-label", `Save ${dataset.name} as CSV`);
      exportButton.textContent = "⇩";
      exportButton.disabled = !dataset.points.length || !transform.valid;

      row.append(color, meta, active, exportButton);
      ui.datasetList.appendChild(row);
    }
  }

  function renderColorSwatches() {
    ui.colorSwatches.textContent = "";
    const dataset = activeDataset();
    COLORS.forEach((color) => {
      const swatch = document.createElement("button");
      swatch.type = "button";
      swatch.className = `color-swatch${dataset && dataset.color.toLowerCase() === color.toLowerCase() ? " selected" : ""}`;
      swatch.style.backgroundColor = color;
      swatch.dataset.color = color;
      swatch.title = `Use ${color}`;
      swatch.setAttribute("aria-label", `Use color ${color}`);
      swatch.disabled = !state.image;
      ui.colorSwatches.appendChild(swatch);
    });
  }

  function updateAll() {
    const hasImage = Boolean(state.image);
    const transform = calibrationTransform();
    const dataset = activeDataset();
    const totalPoints = state.datasets.reduce((sum, item) => sum + item.points.length, 0);

    ui.emptyState.classList.toggle("hidden", hasImage);
    ui.saveProjectButton.disabled = !hasImage;
    ui.calibrationToggle.disabled = !hasImage;
    ui.addDatasetButton.disabled = !hasImage;
    ui.zoomInButton.disabled = !hasImage;
    ui.zoomOutButton.disabled = !hasImage;
    ui.actualSizeButton.disabled = !hasImage;
    ui.fitButton.disabled = !hasImage;

    for (const element of [ui.x1Value, ui.x2Value, ui.y1Value, ui.y2Value, ui.xScale, ui.yScale, ui.gridX, ui.gridY]) {
      element.disabled = !hasImage;
    }
    document.querySelectorAll(".node-picker").forEach((button) => {
      button.disabled = !hasImage || state.mode !== "calibration";
      button.classList.toggle("active", state.mode === "calibration" && state.selectedCalibrationNode === button.dataset.node);
    });

    ui.calibrationToggle.classList.toggle("active", state.mode === "calibration");
    ui.calibrationToggleTitle.textContent = state.mode === "calibration" ? "Finish calibration" : "Show calibration";
    ui.calibrationToggleHint.textContent = state.mode === "calibration"
      ? "Hide reference nodes and grid; start tracing curves"
      : "Display the four reference nodes and grid";

    ui.modeIndicator.className = "mode-indicator";
    if (!hasImage) {
      ui.modeIndicator.innerHTML = '<span class="mode-dot"></span><strong>No image</strong>';
    } else if (state.mode === "calibration") {
      ui.modeIndicator.classList.add("calibration");
      ui.modeIndicator.innerHTML = '<span class="mode-dot"></span><strong>Calibration mode</strong> — drag nodes; dataset points are locked';
    } else {
      ui.modeIndicator.classList.add("data");
      ui.modeIndicator.innerHTML = '<span class="mode-dot"></span><strong>Dataset mode</strong> — click curve to add points';
    }

    ui.imageName.textContent = hasImage ? state.imageName : "Choose or drop an image";
    ui.imageDetail.textContent = hasImage
      ? `${state.image.naturalWidth} × ${state.image.naturalHeight} px`
      : "PNG, JPEG, BMP, GIF, WebP";
    ui.imageSizeText.textContent = hasImage
      ? `${state.image.naturalWidth} × ${state.image.naturalHeight} px`
      : "No image";
    ui.pointCountText.textContent = `${totalPoints} ${totalPoints === 1 ? "point" : "points"}`;

    ui.datasetNameInput.disabled = !dataset || !hasImage;
    ui.datasetNameInput.value = dataset ? dataset.name : "";
    ui.exportDatasetButton.disabled = !dataset || !dataset.points.length || !transform.valid;
    ui.exportAllButton.disabled = !transform.valid || totalPoints === 0;
    ui.clearDatasetButton.disabled = !dataset || !dataset.points.length;
    ui.deleteDatasetButton.disabled = !dataset || !hasImage;
    ui.placementTip.classList.toggle("hidden", !state.placingCalibrationNode);
    ui.placementNode.textContent = state.placingCalibrationNode ? state.placingCalibrationNode.toUpperCase() : "";

    renderDatasetsList();
    renderColorSwatches();
    updateCalibrationStatus();
    updateProjectState();
    updateSelectedInspector();
    updateZoomReadout();
    render();
  }

  function addDataset() {
    const dataset = makeDataset(state.datasets.length + 1);
    state.datasets.push(dataset);
    state.activeDatasetId = dataset.id;
    state.selectedPointId = null;
    setDirty(true);
    updateAll();
    setStatus(`${dataset.name} added and activated.`);
  }

  function activateDataset(id) {
    if (!state.datasets.some((dataset) => dataset.id === id)) return;
    state.activeDatasetId = id;
    state.selectedPointId = null;
    updateAll();
    setStatus(`${activeDataset().name} is active.`);
  }

  function clearActiveDataset() {
    const dataset = activeDataset();
    if (!dataset || !dataset.points.length) return;
    if (!window.confirm(`Delete all points from “${dataset.name}”?`)) return;
    dataset.points = [];
    state.selectedPointId = null;
    setDirty(true);
    updateAll();
    setStatus(`${dataset.name} cleared.`);
  }

  function deleteActiveDataset() {
    const dataset = activeDataset();
    if (!dataset) return;
    const originalIndex = state.datasets.indexOf(dataset);
    if (state.datasets.length === 1) {
      if (dataset.points.length && !window.confirm(`Delete all points from “${dataset.name}” and reset it?`)) return;
      state.datasets = [makeDataset(1)];
    } else {
      if ((dataset.points.length || dataset.name !== `Dataset ${state.datasets.indexOf(dataset) + 1}`) &&
          !window.confirm(`Delete “${dataset.name}” and its ${dataset.points.length} points?`)) return;
      state.datasets.splice(originalIndex, 1);
    }
    state.activeDatasetId = state.datasets[Math.min(originalIndex, state.datasets.length - 1)].id;
    state.selectedPointId = null;
    setDirty(true);
    updateAll();
    setStatus("Dataset deleted.");
  }

  function deleteSelectedPoint() {
    const dataset = activeDataset();
    const point = selectedPoint();
    if (!dataset || !point) return;
    const index = dataset.points.indexOf(point);
    dataset.points.splice(index, 1);
    state.selectedPointId = null;
    setDirty(true);
    updateAll();
    setStatus(`Point ${index + 1} deleted.`);
  }

  function clampImagePoint(point) {
    if (!state.image) return point;
    return {
      x: Core.clamp(point.x, 0, state.image.naturalWidth),
      y: Core.clamp(point.y, 0, state.image.naturalHeight),
    };
  }

  function screenToImage(point) {
    return {
      x: (point.x - state.view.offsetX) / state.view.scale,
      y: (point.y - state.view.offsetY) / state.view.scale,
    };
  }

  function imageToScreen(point) {
    return {
      x: state.view.offsetX + point.x * state.view.scale,
      y: state.view.offsetY + point.y * state.view.scale,
    };
  }

  function isInsideImage(point) {
    return state.image && point.x >= 0 && point.y >= 0 && point.x <= state.image.naturalWidth && point.y <= state.image.naturalHeight;
  }

  function canvasPoint(event) {
    const rect = ui.canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function hitCalibrationNode(screenPoint) {
    let best = null;
    let bestDistance = 15;
    for (const key of ["x1", "x2", "y1", "y2"]) {
      const point = state.calibration.points[key];
      if (!point) continue;
      const screen = imageToScreen(point);
      const distance = Math.hypot(screenPoint.x - screen.x, screenPoint.y - screen.y);
      if (distance <= bestDistance) {
        best = key;
        bestDistance = distance;
      }
    }
    return best;
  }

  function hitDatasetPoint(screenPoint) {
    const dataset = activeDataset();
    if (!dataset) return null;
    let best = null;
    let bestDistance = 10;
    for (const point of dataset.points) {
      const screen = imageToScreen(point);
      const distance = Math.hypot(screenPoint.x - screen.x, screenPoint.y - screen.y);
      if (distance <= bestDistance) {
        best = point;
        bestDistance = distance;
      }
    }
    return best;
  }

  function hitDatasetSegment(screenPoint) {
    const dataset = activeDataset();
    if (!dataset || dataset.points.length < 2) return null;
    let best = null;
    let bestDistance = 8;
    for (let index = 0; index < dataset.points.length - 1; index += 1) {
      const start = imageToScreen(dataset.points[index]);
      const end = imageToScreen(dataset.points[index + 1]);
      const candidate = Core.closestPointOnSegment(screenPoint, start, end);
      if (candidate.distance <= bestDistance) {
        bestDistance = candidate.distance;
        best = { index, screenPoint: candidate.point };
      }
    }
    return best;
  }

  function startInteraction(event) {
    if (!state.image) return;
    ui.canvasWrap.focus({ preventScroll: true });
    const screen = canvasPoint(event);
    const imagePoint = screenToImage(screen);
    const wantsPan = event.button === 1 || event.button === 2 || (event.button === 0 && spaceDown);

    if (wantsPan) {
      state.interaction = {
        type: "pan",
        pointerId: event.pointerId,
        start: screen,
        offsetX: state.view.offsetX,
        offsetY: state.view.offsetY,
      };
      ui.canvas.setPointerCapture(event.pointerId);
      ui.canvas.style.cursor = "grabbing";
      event.preventDefault();
      return;
    }
    if (event.button !== 0 || !isInsideImage(imagePoint)) return;

    if (state.mode === "calibration") {
      let key = state.placingCalibrationNode;
      if (key) {
        state.calibration.points[key] = clampImagePoint(imagePoint);
        state.selectedCalibrationNode = key;
        state.placingCalibrationNode = null;
        setDirty(true);
        updateAll();
        setStatus(`${key.toUpperCase()} placed. Drag it for fine adjustment.`);
        return;
      }
      key = hitCalibrationNode(screen);
      if (!key) return;
      state.selectedCalibrationNode = key;
      state.interaction = { type: "calibration", pointerId: event.pointerId, key, moved: false };
      ui.canvas.setPointerCapture(event.pointerId);
      ui.canvas.style.cursor = "grabbing";
      updateAll();
      event.preventDefault();
      return;
    }

    const dataset = activeDataset();
    if (!dataset) return;
    const pointHit = hitDatasetPoint(screen);
    if (pointHit) {
      state.selectedPointId = pointHit.id;
      state.interaction = { type: "point", pointerId: event.pointerId, pointId: pointHit.id, moved: false };
      ui.canvas.setPointerCapture(event.pointerId);
      ui.canvas.style.cursor = "grabbing";
      updateSelectedInspector();
      render();
      event.preventDefault();
      return;
    }

    const segmentHit = hitDatasetSegment(screen);
    let point;
    let message;
    if (segmentHit) {
      const projected = clampImagePoint(screenToImage(segmentHit.screenPoint));
      point = { id: makeId("point"), x: projected.x, y: projected.y };
      dataset.points.splice(segmentHit.index + 1, 0, point);
      message = `Point inserted between ${segmentHit.index + 1} and ${segmentHit.index + 2}.`;
    } else {
      const position = clampImagePoint(imagePoint);
      point = { id: makeId("point"), x: position.x, y: position.y };
      dataset.points.push(point);
      message = `Point ${dataset.points.length} added to ${dataset.name}.`;
    }
    state.selectedPointId = point.id;
    state.interaction = { type: "point", pointerId: event.pointerId, pointId: point.id, moved: false, added: true };
    ui.canvas.setPointerCapture(event.pointerId);
    ui.canvas.style.cursor = "grabbing";
    setDirty(true);
    setStatus(message);
    updateAll();
    event.preventDefault();
  }

  function moveInteraction(event) {
    if (!state.image) return;
    const screen = canvasPoint(event);
    const imagePoint = screenToImage(screen);
    cursorImage = isInsideImage(imagePoint) ? imagePoint : null;

    if (state.interaction && state.interaction.pointerId === event.pointerId) {
      if (state.interaction.type === "pan") {
        state.view.offsetX = state.interaction.offsetX + screen.x - state.interaction.start.x;
        state.view.offsetY = state.interaction.offsetY + screen.y - state.interaction.start.y;
        render();
        renderMagnifier();
        updateZoomReadout();
        event.preventDefault();
        return;
      }
      if (state.interaction.type === "calibration") {
        state.calibration.points[state.interaction.key] = clampImagePoint(imagePoint);
        state.interaction.moved = true;
        setDirty(true);
        updateCalibrationStatus();
        updateCursorInspector();
        render();
        renderMagnifier();
        event.preventDefault();
        return;
      }
      if (state.interaction.type === "point") {
        const point = selectedPoint();
        if (point) {
          const position = clampImagePoint(imagePoint);
          point.x = position.x;
          point.y = position.y;
          state.interaction.moved = true;
          setDirty(true);
          updateCursorInspector();
          updateSelectedInspector();
          render();
          renderMagnifier();
        }
        event.preventDefault();
        return;
      }
    }

    if (state.mode === "calibration") {
      const node = hitCalibrationNode(screen);
      hoverTarget = node ? { type: "calibration", key: node } : null;
      ui.canvas.style.cursor = state.placingCalibrationNode ? "crosshair" : node ? "grab" : spaceDown ? "grab" : "default";
    } else {
      const point = hitDatasetPoint(screen);
      const segment = point ? null : hitDatasetSegment(screen);
      hoverTarget = point ? { type: "point", id: point.id } : segment ? { type: "segment", index: segment.index } : null;
      ui.canvas.style.cursor = point ? "grab" : segment ? "copy" : isInsideImage(imagePoint) ? "crosshair" : "default";
    }
    updateCursorInspector();
    renderMagnifier();
    render();
  }

  function endInteraction(event) {
    if (!state.interaction || state.interaction.pointerId !== event.pointerId) return;
    const interaction = state.interaction;
    state.interaction = null;
    try { ui.canvas.releasePointerCapture(event.pointerId); } catch (_) { /* no-op */ }
    if (interaction.type === "point" || interaction.type === "calibration") {
      updateAll();
      if (interaction.moved) setStatus(interaction.type === "point" ? "Point moved." : `${interaction.key.toUpperCase()} moved.`);
    } else {
      ui.canvas.style.cursor = spaceDown ? "grab" : "default";
      render();
    }
  }

  function updateCursorFromEvent(event) {
    if (!state.image) return;
    const imagePoint = screenToImage(canvasPoint(event));
    cursorImage = isInsideImage(imagePoint) ? imagePoint : null;
    updateCursorInspector();
    renderMagnifier();
  }

  function fitImage() {
    if (!state.image) return;
    const width = ui.canvasWrap.clientWidth;
    const height = ui.canvasWrap.clientHeight;
    const margin = 34;
    const scale = Math.min(
      Math.max(0.015, (width - margin * 2) / state.image.naturalWidth),
      Math.max(0.015, (height - margin * 2) / state.image.naturalHeight)
    );
    state.view.scale = Core.clamp(scale, 0.015, 64);
    state.view.offsetX = (width - state.image.naturalWidth * state.view.scale) / 2;
    state.view.offsetY = (height - state.image.naturalHeight * state.view.scale) / 2;
    updateZoomReadout();
    render();
  }

  function actualSize() {
    if (!state.image) return;
    const center = { x: ui.canvasWrap.clientWidth / 2, y: ui.canvasWrap.clientHeight / 2 };
    const imageCenter = screenToImage(center);
    state.view.scale = 1;
    state.view.offsetX = center.x - imageCenter.x;
    state.view.offsetY = center.y - imageCenter.y;
    updateZoomReadout();
    render();
    renderMagnifier();
  }

  function zoomAt(factor, center) {
    if (!state.image) return;
    const anchor = screenToImage(center);
    state.view.scale = Core.clamp(state.view.scale * factor, 0.015, 64);
    state.view.offsetX = center.x - anchor.x * state.view.scale;
    state.view.offsetY = center.y - anchor.y * state.view.scale;
    updateZoomReadout();
    render();
    renderMagnifier();
  }

  function updateZoomReadout() {
    ui.zoomReadout.textContent = `${Math.round(state.view.scale * 100)}%`;
  }

  function resizeCanvases() {
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    const width = Math.max(1, ui.canvasWrap.clientWidth);
    const height = Math.max(1, ui.canvasWrap.clientHeight);
    if (ui.canvas.width !== Math.round(width * ratio) || ui.canvas.height !== Math.round(height * ratio)) {
      ui.canvas.width = Math.round(width * ratio);
      ui.canvas.height = Math.round(height * ratio);
      ui.canvas.style.width = `${width}px`;
      ui.canvas.style.height = `${height}px`;
    }

    const magRect = ui.magnifierCanvas.parentElement.getBoundingClientRect();
    const magWidth = Math.max(1, Math.floor(magRect.width));
    const magHeight = Math.max(1, Math.floor(magRect.height));
    if (ui.magnifierCanvas.width !== Math.round(magWidth * ratio) || ui.magnifierCanvas.height !== Math.round(magHeight * ratio)) {
      ui.magnifierCanvas.width = Math.round(magWidth * ratio);
      ui.magnifierCanvas.height = Math.round(magHeight * ratio);
      ui.magnifierCanvas.style.width = `${magWidth}px`;
      ui.magnifierCanvas.style.height = `${magHeight}px`;
    }
    render();
    renderMagnifier();
  }

  function drawDatasets(context, transformPoint, lineWidthScale, alphaScale, drawInactive) {
    for (const dataset of state.datasets) {
      const isActive = dataset.id === state.activeDatasetId;
      if (!drawInactive && !isActive) continue;
      const alpha = (isActive ? 1 : 0.46) * alphaScale;
      context.save();
      context.globalAlpha = alpha;
      context.strokeStyle = dataset.color;
      context.fillStyle = dataset.color;
      context.lineJoin = "round";
      context.lineCap = "round";
      context.lineWidth = (isActive ? 2.2 : 1.35) * lineWidthScale;

      if (dataset.points.length >= 2) {
        context.beginPath();
        dataset.points.forEach((point, index) => {
          const output = transformPoint(point);
          if (index === 0) context.moveTo(output.x, output.y);
          else context.lineTo(output.x, output.y);
        });
        context.stroke();
      }

      for (const point of dataset.points) {
        const output = transformPoint(point);
        const radius = (isActive ? 4.2 : 3) * lineWidthScale;
        context.beginPath();
        context.arc(output.x, output.y, radius, 0, Math.PI * 2);
        context.fill();
        context.lineWidth = 1.5 * lineWidthScale;
        context.strokeStyle = "#ffffff";
        context.stroke();
        context.strokeStyle = dataset.color;
      }

      if (isActive && state.selectedPointId) {
        const point = dataset.points.find((item) => item.id === state.selectedPointId);
        if (point) {
          const output = transformPoint(point);
          context.beginPath();
          context.arc(output.x, output.y, 7.5 * lineWidthScale, 0, Math.PI * 2);
          context.lineWidth = 2 * lineWidthScale;
          context.strokeStyle = "#152238";
          context.stroke();
        }
      }
      context.restore();
    }
  }

  function drawCalibrationGrid(context, transformPoint, lineWidthScale) {
    const transform = calibrationTransform();
    if (!transform.valid) return;
    const gx = state.calibration.gridX;
    const gy = state.calibration.gridY;
    context.save();
    context.strokeStyle = "rgba(48, 83, 171, .40)";
    context.lineWidth = lineWidthScale;
    context.setLineDash([4 * lineWidthScale, 4 * lineWidthScale]);
    for (let index = 0; index <= gx; index += 1) {
      const a = index / gx;
      const start = transformPoint(transform.fromNormalized(a, 0));
      const end = transformPoint(transform.fromNormalized(a, 1));
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
    }
    for (let index = 0; index <= gy; index += 1) {
      const b = index / gy;
      const start = transformPoint(transform.fromNormalized(0, b));
      const end = transformPoint(transform.fromNormalized(1, b));
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
    }
    context.setLineDash([]);
    context.strokeStyle = "rgba(38, 68, 146, .80)";
    context.lineWidth = 1.8 * lineWidthScale;
    const corners = [
      transform.fromNormalized(0, 0), transform.fromNormalized(1, 0),
      transform.fromNormalized(1, 1), transform.fromNormalized(0, 1),
    ].map(transformPoint);
    context.beginPath();
    context.moveTo(corners[0].x, corners[0].y);
    corners.slice(1).forEach((point) => context.lineTo(point.x, point.y));
    context.closePath();
    context.stroke();
    context.restore();
  }

  function drawCalibrationNodes(context) {
    for (const key of ["x1", "x2", "y1", "y2"]) {
      const point = state.calibration.points[key];
      if (!point) continue;
      const screen = imageToScreen(point);
      const selected = state.selectedCalibrationNode === key;
      const hovered = hoverTarget && hoverTarget.type === "calibration" && hoverTarget.key === key;
      const color = NODE_COLORS[key];
      context.save();
      if (selected || hovered) {
        context.beginPath();
        context.arc(screen.x, screen.y, 13, 0, Math.PI * 2);
        context.fillStyle = `${color}28`;
        context.fill();
      }
      context.beginPath();
      context.arc(screen.x, screen.y, selected ? 8 : 7, 0, Math.PI * 2);
      context.fillStyle = color;
      context.fill();
      context.lineWidth = 2;
      context.strokeStyle = "#ffffff";
      context.stroke();

      const label = key.toUpperCase();
      context.font = "700 10px Segoe UI, Arial, sans-serif";
      const width = context.measureText(label).width + 10;
      const labelX = screen.x + 10;
      const labelY = screen.y - 20;
      context.fillStyle = "rgba(255,255,255,.96)";
      roundedRect(context, labelX, labelY, width, 18, 5);
      context.fill();
      context.strokeStyle = color;
      context.lineWidth = 1;
      context.stroke();
      context.fillStyle = color;
      context.fillText(label, labelX + 5, labelY + 12.5);
      context.restore();
    }
  }

  function roundedRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  function render() {
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    const width = ui.canvas.width / ratio;
    const height = ui.canvas.height / ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (!state.image) return;

    const imageX = state.view.offsetX;
    const imageY = state.view.offsetY;
    const imageWidth = state.image.naturalWidth * state.view.scale;
    const imageHeight = state.image.naturalHeight * state.view.scale;

    ctx.save();
    ctx.shadowColor = "rgba(25, 33, 45, .24)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = "#fff";
    ctx.fillRect(imageX, imageY, imageWidth, imageHeight);
    ctx.restore();

    ctx.save();
    ctx.imageSmoothingEnabled = state.view.scale < 1;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(state.image, imageX, imageY, imageWidth, imageHeight);
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.rect(imageX, imageY, imageWidth, imageHeight);
    ctx.clip();
    drawDatasets(ctx, imageToScreen, 1, state.mode === "calibration" ? 0.58 : 1, true);
    if (state.mode === "calibration") drawCalibrationGrid(ctx, imageToScreen, 1);
    ctx.restore();

    ctx.strokeStyle = "rgba(57, 67, 82, .55)";
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(imageX) + .5, Math.round(imageY) + .5, imageWidth, imageHeight);
    if (state.mode === "calibration") drawCalibrationNodes(ctx);
  }

  function renderMagnifier() {
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    const width = ui.magnifierCanvas.width / ratio;
    const height = ui.magnifierCanvas.height / ratio;
    magnifierContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    magnifierContext.clearRect(0, 0, width, height);
    magnifierContext.fillStyle = "#dce1e9";
    magnifierContext.fillRect(0, 0, width, height);

    if (!state.image || !cursorImage) {
      ui.magnifierEmpty.classList.remove("hidden");
      return;
    }
    ui.magnifierEmpty.classList.add("hidden");
    const factor = Number(ui.magnifierFactor.value) || 8;
    const zoom = Core.clamp(state.view.scale * factor, 2, 72);

    magnifierContext.save();
    magnifierContext.beginPath();
    magnifierContext.rect(0, 0, width, height);
    magnifierContext.clip();
    magnifierContext.setTransform(
      ratio * zoom, 0, 0, ratio * zoom,
      ratio * (width / 2 - cursorImage.x * zoom),
      ratio * (height / 2 - cursorImage.y * zoom)
    );
    magnifierContext.imageSmoothingEnabled = zoom < 1;
    magnifierContext.drawImage(state.image, 0, 0);
    drawDatasets(magnifierContext, (point) => point, 1 / zoom, state.mode === "calibration" ? .58 : 1, false);
    if (state.mode === "calibration") drawCalibrationGrid(magnifierContext, (point) => point, 1 / zoom);
    magnifierContext.restore();

    magnifierContext.save();
    magnifierContext.strokeStyle = "rgba(224, 50, 65, .92)";
    magnifierContext.lineWidth = 1;
    magnifierContext.beginPath();
    magnifierContext.moveTo(width / 2, 0);
    magnifierContext.lineTo(width / 2, height);
    magnifierContext.moveTo(0, height / 2);
    magnifierContext.lineTo(width, height / 2);
    magnifierContext.stroke();
    magnifierContext.beginPath();
    magnifierContext.arc(width / 2, height / 2, 5, 0, Math.PI * 2);
    magnifierContext.strokeStyle = "#fff";
    magnifierContext.lineWidth = 3;
    magnifierContext.stroke();
    magnifierContext.strokeStyle = "#e23241";
    magnifierContext.lineWidth = 1.2;
    magnifierContext.stroke();
    magnifierContext.restore();
  }

  function updateCursorInspector() {
    if (!cursorImage) {
      ui.cursorX.textContent = "—";
      ui.cursorY.textContent = "—";
      ui.cursorPixel.textContent = "—";
      return;
    }
    ui.cursorPixel.textContent = `${cursorImage.x.toFixed(1)}, ${cursorImage.y.toFixed(1)}`;
    const transform = calibrationTransform();
    if (!transform.valid) {
      ui.cursorX.textContent = "—";
      ui.cursorY.textContent = "—";
      return;
    }
    const data = transform.toData(cursorImage);
    ui.cursorX.textContent = Core.formatNumber(data.x, 10);
    ui.cursorY.textContent = Core.formatNumber(data.y, 10);
  }

  function updateSelectedInspector() {
    const dataset = activeDataset();
    const point = selectedPoint();
    const transform = calibrationTransform();
    if (!dataset || !point) {
      ui.selectedTitle.textContent = "No point selected";
      ui.selectedIndex.textContent = "—";
      ui.selectedX.value = "";
      ui.selectedY.value = "";
      ui.selectedX.disabled = true;
      ui.selectedY.disabled = true;
      ui.deletePointButton.disabled = true;
      ui.selectedHint.textContent = "Click a point to inspect or drag it.";
      return;
    }
    const index = dataset.points.indexOf(point);
    ui.selectedTitle.textContent = dataset.name;
    ui.selectedIndex.textContent = `#${index + 1}`;
    ui.deletePointButton.disabled = false;
    if (transform.valid) {
      const data = transform.toData(point);
      if (document.activeElement !== ui.selectedX) ui.selectedX.value = Core.formatNumber(data.x, 12);
      if (document.activeElement !== ui.selectedY) ui.selectedY.value = Core.formatNumber(data.y, 12);
      ui.selectedX.disabled = false;
      ui.selectedY.disabled = false;
      ui.selectedHint.textContent = "Values update automatically when this point moves.";
    } else {
      ui.selectedX.value = "";
      ui.selectedY.value = "";
      ui.selectedX.disabled = true;
      ui.selectedY.disabled = true;
      ui.selectedHint.textContent = "Complete calibration to calculate data values.";
    }
  }

  function applySelectedDataValues() {
    const point = selectedPoint();
    const transform = calibrationTransform();
    if (!point || !transform.valid) return;
    const x = Number(ui.selectedX.value);
    const y = Number(ui.selectedY.value);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      toast("Enter valid X and Y values.", "error");
      updateSelectedInspector();
      return;
    }
    const position = transform.fromData(x, y);
    if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) {
      toast("These values are not valid for the selected axis scale.", "error");
      updateSelectedInspector();
      return;
    }
    const clamped = clampImagePoint(position);
    point.x = clamped.x;
    point.y = clamped.y;
    setDirty(true);
    updateSelectedInspector();
    render();
    renderMagnifier();
    setStatus("Point moved to the entered data values.");
  }

  function nudgeSelected(dx, dy, multiplier) {
    const imageStep = (multiplier || 1) / Math.max(state.view.scale, .02);
    if (state.mode === "calibration" && state.selectedCalibrationNode) {
      const point = state.calibration.points[state.selectedCalibrationNode];
      if (!point) return;
      const moved = clampImagePoint({ x: point.x + dx * imageStep, y: point.y + dy * imageStep });
      state.calibration.points[state.selectedCalibrationNode] = moved;
      setDirty(true);
      updateCalibrationStatus();
      render();
      renderMagnifier();
      return;
    }
    if (state.mode === "data") {
      const point = selectedPoint();
      if (!point) return;
      const moved = clampImagePoint({ x: point.x + dx * imageStep, y: point.y + dy * imageStep });
      point.x = moved.x;
      point.y = moved.y;
      setDirty(true);
      updateSelectedInspector();
      render();
      renderMagnifier();
    }
  }

  function bindEvents() {
    const chooseImage = () => ui.imageFileInput.click();
    ui.openImageButton.addEventListener("click", chooseImage);
    ui.emptyOpenButton.addEventListener("click", chooseImage);
    ui.imageDropZone.addEventListener("click", chooseImage);
    ui.openProjectButton.addEventListener("click", () => ui.projectFileInput.click());
    ui.saveProjectButton.addEventListener("click", saveProject);
    ui.calibrationToggle.addEventListener("click", toggleCalibrationMode);
    ui.addDatasetButton.addEventListener("click", addDataset);
    ui.fitButton.addEventListener("click", fitImage);
    ui.actualSizeButton.addEventListener("click", actualSize);
    ui.zoomInButton.addEventListener("click", () => zoomAt(1.25, { x: ui.canvasWrap.clientWidth / 2, y: ui.canvasWrap.clientHeight / 2 }));
    ui.zoomOutButton.addEventListener("click", () => zoomAt(.8, { x: ui.canvasWrap.clientWidth / 2, y: ui.canvasWrap.clientHeight / 2 }));
    ui.exportDatasetButton.addEventListener("click", () => exportDataset(activeDataset()));
    ui.exportAllButton.addEventListener("click", exportAllDatasets);
    ui.clearDatasetButton.addEventListener("click", clearActiveDataset);
    ui.deleteDatasetButton.addEventListener("click", deleteActiveDataset);
    ui.deletePointButton.addEventListener("click", deleteSelectedPoint);
    ui.magnifierFactor.addEventListener("change", renderMagnifier);

    ui.imageFileInput.addEventListener("change", () => {
      const file = ui.imageFileInput.files && ui.imageFileInput.files[0];
      ui.imageFileInput.value = "";
      if (file) openImageFile(file);
    });
    ui.projectFileInput.addEventListener("change", () => {
      const file = ui.projectFileInput.files && ui.projectFileInput.files[0];
      ui.projectFileInput.value = "";
      if (file) openProjectFile(file);
    });

    for (const input of [ui.x1Value, ui.x2Value, ui.y1Value, ui.y2Value, ui.xScale, ui.yScale, ui.gridX, ui.gridY]) {
      input.addEventListener("input", readCalibrationInputs);
      input.addEventListener("change", () => {
        readCalibrationInputs();
        syncCalibrationInputs();
      });
    }

    document.querySelectorAll(".node-picker").forEach((button) => {
      button.addEventListener("click", () => {
        if (state.mode !== "calibration") return;
        const key = button.dataset.node;
        state.selectedCalibrationNode = key;
        state.placingCalibrationNode = key;
        setStatus(`Click the image to place ${key.toUpperCase()}, or drag its existing node.`);
        updateAll();
      });
    });

    ui.datasetList.addEventListener("click", (event) => {
      const exportButton = event.target.closest("[data-export-dataset-id]");
      if (exportButton) {
        event.stopPropagation();
        const dataset = state.datasets.find((item) => item.id === exportButton.dataset.exportDatasetId);
        exportDataset(dataset);
        return;
      }
      const row = event.target.closest("[data-dataset-id]");
      if (row) activateDataset(row.dataset.datasetId);
    });
    ui.datasetList.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const row = event.target.closest("[data-dataset-id]");
      if (row) {
        event.preventDefault();
        activateDataset(row.dataset.datasetId);
      }
    });

    ui.datasetNameInput.addEventListener("input", () => {
      const dataset = activeDataset();
      if (!dataset) return;
      dataset.name = ui.datasetNameInput.value.slice(0, 80) || "Untitled dataset";
      setDirty(true);
      renderDatasetsList();
      updateSelectedInspector();
    });
    ui.datasetNameInput.addEventListener("blur", () => {
      const dataset = activeDataset();
      if (!dataset) return;
      dataset.name = dataset.name.trim() || "Untitled dataset";
      ui.datasetNameInput.value = dataset.name;
      renderDatasetsList();
    });
    ui.colorSwatches.addEventListener("click", (event) => {
      const button = event.target.closest("[data-color]");
      const dataset = activeDataset();
      if (!button || !dataset) return;
      dataset.color = button.dataset.color;
      setDirty(true);
      renderDatasetsList();
      renderColorSwatches();
      render();
      renderMagnifier();
    });

    ui.selectedX.addEventListener("change", applySelectedDataValues);
    ui.selectedY.addEventListener("change", applySelectedDataValues);

    ui.canvas.addEventListener("pointerdown", startInteraction);
    ui.canvas.addEventListener("pointermove", moveInteraction);
    ui.canvas.addEventListener("pointerup", endInteraction);
    ui.canvas.addEventListener("pointercancel", endInteraction);
    ui.canvas.addEventListener("pointerleave", (event) => {
      if (!state.interaction) {
        cursorImage = null;
        hoverTarget = null;
        updateCursorInspector();
        renderMagnifier();
        render();
      } else {
        updateCursorFromEvent(event);
      }
    });
    ui.canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    ui.canvas.addEventListener("wheel", (event) => {
      if (!state.image) return;
      event.preventDefault();
      const factor = Math.exp(-event.deltaY * .0014);
      zoomAt(factor, canvasPoint(event));
      updateCursorFromEvent(event);
    }, { passive: false });

    const dragTargets = [ui.canvasWrap, ui.imageDropZone];
    dragTargets.forEach((target) => {
      target.addEventListener("dragover", (event) => {
        event.preventDefault();
        ui.imageDropZone.classList.add("drag-over");
      });
      target.addEventListener("dragleave", () => ui.imageDropZone.classList.remove("drag-over"));
      target.addEventListener("drop", (event) => {
        event.preventDefault();
        ui.imageDropZone.classList.remove("drag-over");
        const files = Array.from(event.dataTransfer.files || []);
        const project = files.find((file) => /\.(curvetrace|json)$/i.test(file.name));
        const image = files.find(looksLikeImage);
        if (project) openProjectFile(project);
        else if (image) openImageFile(image);
        else toast("Drop an image or CurveTrace project file.", "error");
      });
    });

    window.addEventListener("paste", (event) => {
      const item = Array.from(event.clipboardData && event.clipboardData.items || []).find((entry) => entry.type.startsWith("image/"));
      if (!item) return;
      const file = item.getAsFile();
      if (file) openImageFile(new File([file], `Pasted_plot_${Date.now()}.png`, { type: file.type || "image/png" }));
    });

    window.addEventListener("keydown", (event) => {
      const editing = /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement && document.activeElement.tagName);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveProject();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "o") {
        event.preventDefault();
        if (event.shiftKey) ui.projectFileInput.click();
        else ui.imageFileInput.click();
        return;
      }
      if (editing) return;
      if (event.code === "Space") {
        spaceDown = true;
        if (!state.interaction) ui.canvas.style.cursor = "grab";
        event.preventDefault();
      }
      if ((event.key === "Delete" || event.key === "Backspace") && state.mode === "data") {
        event.preventDefault();
        deleteSelectedPoint();
      }
      if (event.key === "Escape") {
        state.placingCalibrationNode = null;
        state.selectedPointId = null;
        updateAll();
      }
      const arrows = {
        ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
      };
      if (arrows[event.key]) {
        event.preventDefault();
        nudgeSelected(arrows[event.key][0], arrows[event.key][1], event.shiftKey ? 10 : 1);
      }
    });
    window.addEventListener("keyup", (event) => {
      if (event.code === "Space") {
        spaceDown = false;
        if (!state.interaction) ui.canvas.style.cursor = "default";
      }
    });
    window.addEventListener("blur", () => { spaceDown = false; });
    window.addEventListener("beforeunload", (event) => {
      if (!state.dirty) return;
      event.preventDefault();
      event.returnValue = "";
    });

    const observer = new ResizeObserver(() => {
      if (resizeQueued) return;
      resizeQueued = true;
      requestAnimationFrame(() => {
        resizeQueued = false;
        resizeCanvases();
      });
    });
    observer.observe(ui.canvasWrap);
    observer.observe(ui.magnifierCanvas.parentElement);
  }

  function initialize() {
    bindEvents();
    syncCalibrationInputs();
    resizeCanvases();
    updateAll();
    window.CurveTraceApp = {
      getState: () => state,
      core: Core,
      openImageFile,
      projectObject,
    };
  }

  initialize();
})();
