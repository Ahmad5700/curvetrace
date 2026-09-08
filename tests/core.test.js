"use strict";

const assert = require("assert");
const Core = require("../src/core.js");

function near(actual, expected, tolerance = 1e-8) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} should be close to ${expected}`);
}

function calibration(points, values = { x1: 0, x2: 10, y1: -1, y2: 1 }, xScale = "linear", yScale = "linear") {
  return { points, values, xScale, yScale };
}

{
  const transform = Core.createTransform(calibration({
    x1: { x: 100, y: 500 },
    x2: { x: 500, y: 500 },
    y1: { x: 100, y: 500 },
    y2: { x: 100, y: 100 },
  }));
  assert.equal(transform.valid, true);
  const data = transform.toData({ x: 300, y: 300 });
  near(data.x, 5);
  near(data.y, 0);
}

{
  const origin = { x: 120, y: 500 };
  const dx = { x: 400, y: 100 };
  const dy = { x: -80, y: -300 };
  const transform = Core.createTransform(calibration({
    x1: origin,
    x2: Core.add(origin, dx),
    y1: origin,
    y2: Core.add(origin, dy),
  }));
  const point = Core.add(origin, Core.add(Core.scale(dx, 0.25), Core.scale(dy, 0.75)));
  const data = transform.toData(point);
  near(data.x, 2.5);
  near(data.y, 0.5);
}

{
  const origin = { x: 80, y: 420 };
  const dx = { x: 500, y: 50 };
  const dy = { x: -60, y: -310 };
  const px1 = Core.add(origin, Core.scale(dy, 0.2));
  const py1 = Core.add(origin, Core.scale(dx, 0.3));
  const transform = Core.createTransform(calibration({
    x1: px1,
    x2: Core.add(px1, dx),
    y1: py1,
    y2: Core.add(py1, dy),
  }));
  const point = Core.add(origin, Core.add(Core.scale(dx, 0.5), Core.scale(dy, 0.5)));
  const data = transform.toData(point);
  near(data.x, 5);
  near(data.y, 0);
  const restored = transform.fromData(data.x, data.y);
  near(restored.x, point.x);
  near(restored.y, point.y);
}

{
  const transform = Core.createTransform(calibration({
    x1: { x: 0, y: 100 }, x2: { x: 300, y: 100 },
    y1: { x: 0, y: 100 }, y2: { x: 0, y: 0 },
  }, { x1: 1, x2: 1000, y1: 0.1, y2: 10 }, "log", "log"));
  const data = transform.toData({ x: 100, y: 50 });
  near(data.x, 10);
  near(data.y, 1);
}

{
  const hit = Core.closestPointOnSegment({ x: 5, y: 2 }, { x: 0, y: 0 }, { x: 10, y: 0 });
  near(hit.point.x, 5);
  near(hit.point.y, 0);
  near(hit.distance, 2);
  near(hit.amount, 0.5);
}

{
  const invalid = calibration({
    x1: { x: 0, y: 100 }, x2: { x: 100, y: 100 },
    y1: { x: 0, y: 100 }, y2: { x: 0, y: 0 },
  }, { x1: null, x2: 1, y1: 0, y2: 1 });
  assert.equal(Core.validateCalibration(invalid).valid, false);
}

{
  assert.equal(Core.safeFilename('Dataset: 1/2?', "fallback"), "Dataset_ 1_2_");
  assert.equal(Core.escapeCsv('a,"b"'), '"a,""b"""');
  assert.equal(Core.formatNumber(0.00000123, 6), "1.23000e-6");
}

console.log("CurveTrace core tests passed.");
