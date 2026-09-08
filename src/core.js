(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.CurveCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const EPSILON = 1e-9;

  function cross(a, b) {
    return a.x * b.y - a.y * b.x;
  }

  function subtract(a, b) {
    return { x: a.x - b.x, y: a.y - b.y };
  }

  function add(a, b) {
    return { x: a.x + b.x, y: a.y + b.y };
  }

  function scale(a, amount) {
    return { x: a.x * amount, y: a.y * amount };
  }

  function clamp(value, low, high) {
    return Math.max(low, Math.min(high, value));
  }

  function interpolateValue(first, second, amount, mode) {
    if (mode === "log") {
      if (!(first > 0) || !(second > 0)) return NaN;
      return Math.exp(Math.log(first) + amount * (Math.log(second) - Math.log(first)));
    }
    return first + amount * (second - first);
  }

  function normalizeValue(value, first, second, mode) {
    if (mode === "log") {
      if (!(value > 0) || !(first > 0) || !(second > 0) || first === second) return NaN;
      return (Math.log(value) - Math.log(first)) / (Math.log(second) - Math.log(first));
    }
    if (first === second) return NaN;
    return (value - first) / (second - first);
  }

  function validateCalibration(calibration) {
    if (!calibration || !calibration.points || !calibration.values) {
      return { valid: false, reason: "Calibration information is incomplete." };
    }
    const keys = ["x1", "x2", "y1", "y2"];
    for (const key of keys) {
      const point = calibration.points[key];
      if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
        return { valid: false, reason: `Place the ${key.toUpperCase()} calibration node.` };
      }
      const rawValue = calibration.values[key];
      if (rawValue === null || rawValue === "" || !Number.isFinite(Number(rawValue))) {
        return { valid: false, reason: `Enter a valid value for ${key.toUpperCase()}.` };
      }
    }
    const x1 = Number(calibration.values.x1);
    const x2 = Number(calibration.values.x2);
    const y1 = Number(calibration.values.y1);
    const y2 = Number(calibration.values.y2);
    if (x1 === x2) return { valid: false, reason: "X1 and X2 values must be different." };
    if (y1 === y2) return { valid: false, reason: "Y1 and Y2 values must be different." };
    if (calibration.xScale === "log" && (!(x1 > 0) || !(x2 > 0))) {
      return { valid: false, reason: "Logarithmic X values must be greater than zero." };
    }
    if (calibration.yScale === "log" && (!(y1 > 0) || !(y2 > 0))) {
      return { valid: false, reason: "Logarithmic Y values must be greater than zero." };
    }

    const dx = subtract(calibration.points.x2, calibration.points.x1);
    const dy = subtract(calibration.points.y2, calibration.points.y1);
    const determinant = cross(dx, dy);
    const lengthProduct = Math.hypot(dx.x, dx.y) * Math.hypot(dy.x, dy.y);
    if (lengthProduct < EPSILON) {
      return { valid: false, reason: "Move each pair of calibration nodes farther apart." };
    }
    if (Math.abs(determinant) / lengthProduct < 0.015) {
      return { valid: false, reason: "The X and Y calibration directions are almost parallel." };
    }
    return { valid: true, reason: "Calibration is ready." };
  }

  function createTransform(calibration) {
    const validity = validateCalibration(calibration);
    if (!validity.valid) return { ...validity };

    const px1 = calibration.points.x1;
    const py1 = calibration.points.y1;
    const dx = subtract(calibration.points.x2, px1);
    const dy = subtract(calibration.points.y2, py1);
    const determinant = cross(dx, dy);
    const baselineB = cross(dx, subtract(px1, py1)) / determinant;
    const origin = add(px1, scale(dy, -baselineB));

    function toNormalized(point) {
      return {
        a: cross(subtract(point, px1), dy) / determinant,
        b: cross(dx, subtract(point, py1)) / determinant,
      };
    }

    function fromNormalized(a, b) {
      return add(origin, add(scale(dx, a), scale(dy, b)));
    }

    function toData(point) {
      const normalized = toNormalized(point);
      return {
        x: interpolateValue(
          Number(calibration.values.x1),
          Number(calibration.values.x2),
          normalized.a,
          calibration.xScale
        ),
        y: interpolateValue(
          Number(calibration.values.y1),
          Number(calibration.values.y2),
          normalized.b,
          calibration.yScale
        ),
      };
    }

    function fromData(x, y) {
      const a = normalizeValue(
        x,
        Number(calibration.values.x1),
        Number(calibration.values.x2),
        calibration.xScale
      );
      const b = normalizeValue(
        y,
        Number(calibration.values.y1),
        Number(calibration.values.y2),
        calibration.yScale
      );
      return fromNormalized(a, b);
    }

    return {
      valid: true,
      reason: validity.reason,
      dx,
      dy,
      determinant,
      origin,
      toNormalized,
      fromNormalized,
      toData,
      fromData,
    };
  }

  function closestPointOnSegment(point, start, end) {
    const segment = subtract(end, start);
    const lengthSquared = segment.x * segment.x + segment.y * segment.y;
    if (lengthSquared < EPSILON) {
      const distance = Math.hypot(point.x - start.x, point.y - start.y);
      return { point: { ...start }, amount: 0, distance };
    }
    const offset = subtract(point, start);
    const amount = clamp((offset.x * segment.x + offset.y * segment.y) / lengthSquared, 0, 1);
    const projected = add(start, scale(segment, amount));
    return {
      point: projected,
      amount,
      distance: Math.hypot(point.x - projected.x, point.y - projected.y),
    };
  }

  function formatNumber(value, significantDigits) {
    if (!Number.isFinite(value)) return "";
    const digits = clamp(Number(significantDigits) || 10, 3, 15);
    if (value === 0) return "0";
    const absolute = Math.abs(value);
    if (absolute >= 1e7 || absolute < 1e-5) {
      return value.toExponential(Math.max(1, digits - 1)).replace(/\.0+(?=e)/, "");
    }
    const decimals = clamp(digits - Math.floor(Math.log10(absolute)) - 1, 0, 14);
    return value.toFixed(decimals).replace(/\.?0+$/, "");
  }

  function escapeCsv(value) {
    const text = String(value == null ? "" : value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function safeFilename(value, fallback) {
    const cleaned = String(value || "")
      .trim()
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
      .replace(/[. ]+$/, "")
      .slice(0, 90);
    return cleaned || fallback;
  }

  return {
    EPSILON,
    add,
    clamp,
    closestPointOnSegment,
    createTransform,
    cross,
    escapeCsv,
    formatNumber,
    interpolateValue,
    normalizeValue,
    safeFilename,
    scale,
    subtract,
    validateCalibration,
  };
});
