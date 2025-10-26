# Converting world-space AABBs to pixel-space ranges

A possible future optimization for the renderer is to convert world-space axis-aligned bounding boxes (AABBs) of shapes into pixel-space integer ranges (minCol, maxCol, minRow, maxRow). This allows for cheaper per-pixel checks and enables shape-first rasterization.

- Converting boxes to pixel-space ranges (integer column/row ranges) reduces per-pixel cost and branches and enables two faster rendering strategies:
  1. Cheap integer range checks inside the existing pixel-first loop.
  2. Shape-first rasterization (iterate only the pixels inside each shape's pixel-box), which is usually the fastest when shapes are smaller than the canvas.

Why it helps (concrete benefits)

- Fewer floating ops per pixel: you avoid computing world-space comparisons or repeated float math per pixel — you compare integers (x >= minCol && x <= maxCol).
- Fewer branches/memory loads: integer comparisons are cheaper and more predictable for the CPU/branch predictor.
- Smaller iteration domain: with shape-first rasterization you only touch pixels inside a shape's pixel box (O(sum area_of_shapes) instead of O(canvas area * shapes)).
- Better cache locality: shape-first touches contiguous pixel rows/columns, improving memory locality when writing pixelCanvas.
- Simpler early culling: you can skip whole columns/rows quickly rather than repeating world-box checks.
- Easier to build spatial indices later: pixel ranges let you build column- or tile-based indices for faster lookups.

Trade-offs / things to watch

- Conversion rounding: you must map world coordinates to pixel indices correctly (choose ceil/floor carefully) and clamp to [0, canvasWidth-1]/[0, canvasHeight-1] to avoid out-of-range access.
- AA expansion: include aaRegion (converted to world units) when computing boxes so you don't incorrectly cull edge pixels.
- Aspect ratio / world mapping: use the same worldWidth/worldHeight and mapping used elsewhere to compute ranges; keep math centralized.
- When many shapes cover the whole canvas, shape-first may not help (it may even be slower than pixel-first), so implementing both (with a feature flag) is ideal.
- Slightly more code complexity if you keep both pixel-first and shape-first code paths.

How to convert a world-space box to pixel ranges (exact formula)

Use the same mapping used elsewhere in the renderer:

- worldX_of_pixel_center(i) = ((i + 0.5) / canvasWidth - 0.5) * worldWidth

Solve for i given worldX:

- i >= canvasWidth * ((worldX / worldWidth) + 0.5) - 0.5

Therefore:

```js
minCol = Math.ceil(canvasWidth * ((box.minX / worldWidth) + 0.5) - 0.5);
maxCol = Math.floor(canvasWidth * ((box.maxX / worldWidth) + 0.5) - 0.5);

minRow = Math.ceil(canvasHeight * ((box.minY / worldHeight) + 0.5) - 0.5);
maxRow = Math.floor(canvasHeight * ((box.maxY / worldHeight) + 0.5) - 0.5);

// clamp to canvas bounds
minCol = Math.max(0, Math.min(canvasWidth - 1, minCol));
maxCol = Math.max(0, Math.min(canvasWidth - 1, maxCol));
minRow = Math.max(0, Math.min(canvasHeight - 1, minRow));
maxRow = Math.max(0, Math.min(canvasHeight - 1, maxRow));
```

Notes on rounding

- Using `ceil` for min and `floor` for max is conservative: it includes any pixel whose center lies within the box. This guarantees we won't accidentally cull a pixel the shape could affect.
- If you want even tighter ranges you can adjust (for example subtract an epsilon before ceiling), but conservative ranges are safer for AA correctness.

Recommended implementations

1) Minimal change (low risk, good wins)

- After computing world-space `shapeBoxes`, also compute `shapePixelRanges` using the formulas above.
- Replace the per-pixel world-space box check with an integer range check:

```js
if (x < minCol || x > maxCol || y < minRow || y > maxRow) continue;
```

- This reduces floating-point ops per pixel and is easy to add to the current renderer.

2) Shape-first rasterization (bigger change, larger win for many small shapes)

- For each shape in painter order:
  - compute minCol..maxCol and minRow..maxRow
  - iterate y from minRow..maxRow and x from minCol..maxCol
  - compute worldX/worldY (or look up from precomputed arrays) and run SDF/AA/blend
- This touches only pixels shapes can affect and is fast when the total area of shapes is much smaller than the canvas.
- Preserves painter order if you iterate shapes in the supplied order.

When to do which

- Many small shapes or sparse scenes → shape-first rasterization.
- Few large shapes or minimal code churn desired → implement pixel-range integer checks in the pixel-first loop.
- Implement both behind feature flags and benchmark with real scenes.

Suggested next step

- Implement the simple pixel-range optimization (convert boxes to pixel ranges and use integer checks). Add a small micro-benchmark (timing on a larger canvas with many shapes) and show the difference with the `ENABLE_BOX_CULLING` flag on/off.
