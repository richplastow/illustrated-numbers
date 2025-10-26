/**
 * Signed distance functions (SDFs) for basic shapes.
 * Exported as named constants so they can be imported where needed.
 */

/** #### SDF for a circle
 * @param {number} px
 * @param {number} py
 * @param {number} radius
 * @returns {number}
 */
export const sdfCircle = (px, py, radius) => Math.sqrt(px * px + py * py) - radius;

/** #### Axis-aligned bounding box for a circle
 * @param {{position:{x:number,y:number},size:number}} shape
 * @param {number} expand Amount to expand the box (world units), e.g. aaRegion
 * @returns {{minX:number,maxX:number,minY:number,maxY:number}}
 */
export const aabbCircle = (shape, expand) => {
    const cx = shape.position.x;
    const cy = shape.position.y;
    const r = Math.abs(shape.size) + expand;
    return { minX: cx - r, maxX: cx + r, minY: cy - r, maxY: cy + r };
};


/** #### SDF for an axis-aligned square
 * @param {number} px
 * @param {number} py
 * @param {number} halfSize
 * @returns {number}
 */
export const sdfSquare = (px, py, halfSize) => {
    const dx = Math.abs(px) - halfSize;
    const dy = Math.abs(py) - halfSize;
    const ax = Math.max(dx, 0);
    const ay = Math.max(dy, 0);
    const outsideDist = Math.sqrt(ax * ax + ay * ay);
    const insideDist = Math.min(Math.max(dx, dy), 0);
    return outsideDist + insideDist;
};

/** #### Axis-aligned bounding box for a square
 * @param {{position:{x:number,y:number},size:number}} shape
 * @param {number} expand Amount to expand the box (world units), e.g. aaRegion
 * @returns {{minX:number,maxX:number,minY:number,maxY:number}}
 */
export const aabbSquare = (shape, expand) => {
    const cx = shape.position.x;
    const cy = shape.position.y;
    const hx = Math.abs(shape.size) + expand;
    const hy = Math.abs(shape.size) + expand;
    return { minX: cx - hx, maxX: cx + hx, minY: cy - hy, maxY: cy + hy };
};


/** #### SDF for an equilateral triangle (pointing up)
 * The triangle SDF expects Y to be positive-up. If the renderer uses a
 * different Y orientation (e.g. positive-down), callers should pass the
 * inverted Y or the SDF can invert internally. To keep behavior identical
 * to previous implementation we invert Y internally here.
 * @param {number} px
 * @param {number} py
 * @param {number} r
 * @returns {number}
 */
export const sdfTriangle = (px, py, r) => {
    // Invert py to convert renderer world-space (positive-down) into the
    // positive-up coordinates expected by this SDF implementation.
    py = -py;
    const k = Math.sqrt(3.0);
    let x = Math.abs(px) - r;
    let y = py + r / k;
    if (x + k * y > 0.0) {
        const nx = (x - k * y) / 2.0;
        const ny = (-k * x - y) / 2.0;
        x = nx;
        y = ny;
    }
    const clamped = Math.min(Math.max(x, -2.0 * r), 0.0);
    x -= clamped;
    const dist = Math.sqrt(x * x + y * y);
    return -dist * Math.sign(y);
};

/** #### Axis-aligned bounding box for an equilateral triangle
 * Conservative AABB for an equilateral triangle centred at the origin.
 * @param {{position:{x:number,y:number},size:number}} shape
 * @param {number} expand Amount to expand the box (world units), e.g. aaRegion
 * @returns {{minX:number,maxX:number,minY:number,maxY:number}}
 */
export const aabbTriangle = (shape, expand) => {
    const cx = shape.position.x;
    const cy = shape.position.y;
    const hx = Math.abs(shape.size) + expand;
    const hy = Math.abs(shape.size) * 1.2 + expand; // slightly conservative
    return { minX: cx - hx, maxX: cx + hx, minY: cy - hy, maxY: cy + hy };
};
