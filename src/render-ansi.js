import {
    isIntInRange,
    validateBackground,
    validateShape,
} from './validate-args.js';
import {
    sdfCircle,
    sdfSquare,
    sdfTriangle,
    aabbCircle,
    aabbSquare,
    aabbTriangle,
} from './sdf-and-aabb.js';

// Feature flag to toggle bounding-box culling. When enabled, the renderer 
// will skip expensive SDF calculations for shapes whose world-space axis-
// aligned bounding box doesn't contain the pixel being shaded. This is a
// conservative optimization: bounding boxes are chosen to never exclude a
// pixel that the shape could affect (they may be slightly larger than the
// true shape), so correctness is preserved.
const ENABLE_BOX_CULLING = true;

/**
 * @typedef {import('./types.js').Color} Color
 * @typedef {import('./types.js').ColorDepth} ColorDepth
 */

/** #### Renders an array of shapes as ANSI art
 * @param {number} canvasWidth The width of the canvas
 * @param {number} canvasHeight The height of the canvas
 * @param {import('./types.js').Background} background How to render the background
 * @param {import('./types.js').Shape[]} shapes An array of shapes to render
 * @param {ColorDepth} [colorDepth='truecolor']
 *   Whether to downgrade color rendering for terminals that do not support true color (24-bit color)
 * @returns {string} The rendered ANSI art
 */
export const renderAnsi = (
    canvasWidth,
    canvasHeight,
    background,
    shapes,
    colorDepth = 'truecolor',
) => {
    const xpx = 'renderAnsi()';

    // Validate the arguments.
    if (typeof canvasWidth !== 'number') throw TypeError(
        `${xpx} canvasWidth is type '${typeof canvasWidth}' not 'number'`);
    if (!isIntInRange(canvasWidth, 1, 120)) throw RangeError(
        `${xpx} canvasWidth must be an integer between 1 and 120`);
    if (typeof canvasHeight !== 'number') throw TypeError(
        `${xpx} canvasHeight is type '${typeof canvasHeight}' not 'number'`);
    if (!isIntInRange(canvasHeight, 2, 64)) throw RangeError(
        `${xpx} canvasHeight must be an integer between 2 and 64`);
    if (canvasHeight % 2 !== 0) throw RangeError(
        `${xpx} canvasHeight must be an even number`);
    validateBackground(background, xpx);
    if (shapes === null) throw TypeError(
        `${xpx} shapes is null not an array`);
    if (!Array.isArray(shapes)) throw TypeError(
        `${xpx} shapes is type '${typeof shapes}' not 'array'`);
    shapes.forEach((shape, i) => validateShape(shape, xpx, i));
    if (typeof colorDepth !== 'string') throw TypeError(
        `${xpx} colorDepth is type '${typeof colorDepth}' not 'string'`);
    if (['truecolor', '256', 'monochrome'].indexOf(colorDepth) === -1) throw RangeError(
        `${xpx} colorDepth must be one of 'truecolor', '256' or 'monochrome'`);

    // Create a black canvas of pixels with the specified dimensions.
    const pixelCanvas = Array.from({ length: canvasHeight }, () =>
        Array.from({ length: canvasWidth }, () => ({ red: 0, green: 0, blue: 0 }))
    );

    // Draw the background onto the pixel canvas before rendering shapes.
    // Background must go first so shapes render on top of it.
    switch (background.pattern) {
        case 'breton':
            drawBackgroundBreton(pixelCanvas, background.ink, background.paper);
            break;
        case 'pinstripe':
            drawBackgroundPinstripe(pixelCanvas, background.ink, background.paper);
            break;
    }

    // Convert an anti-aliasing width specified in pixels to world-space
    // units. The renderer maps the smaller canvas dimension to 10.0 world
    // units, so one world unit per pixel is 10.0 / min(canvasWidth,canvasHeight).
    // Use aaRegionPixels to control how many screen pixels the AA band covers.
    const worldUnitsPerPixel = 10.0 / Math.min(canvasWidth, canvasHeight);
    const aaRegionPixels = 0.85; // anti-alias region width in pixels (1 would be a little too soft)
    const aaRegion = aaRegionPixels * worldUnitsPerPixel;

    // Precompute conservative axis-aligned bounding boxes (AABB) for each
    // shape in world-space. These boxes are expanded by the anti-aliasing
    // region so that edge pixels aren't incorrectly culled. We compute them
    // once here so the inner pixel loop can cheaply skip shapes that cannot
    // possibly affect a given pixel.
    // Use helper functions colocated with SDFs to compute conservative AABBs
    // for each shape. These helpers are in `src/sdf-and-aabb.js` and mirror
    // the previous inline logic; keeping them next to SDFs helps maintain
    // consistency when shapes change.
    const shapeBoxes = shapes.map((shape) => {
        // Base AA expansion in world units.
        // Also expand outward for strokes that lie outside or are centred on
        // the shape boundary so we don't accidentally cull stroke pixels.
        const strokePx = typeof shape.strokeWidth === 'number' ? shape.strokeWidth : 0;
        const strokeWorld = strokePx * worldUnitsPerPixel;
        // Default to 'center' semantics if strokePosition is missing.
        let outwardExtension;
        switch (shape.strokePosition) {
            case 'outside':
                outwardExtension = strokeWorld;
                break;
            case 'inside':
                outwardExtension = 0;
                break;
            case 'center':
            default:
                outwardExtension = strokeWorld / 2;
                break;
        }
        const expand = aaRegion + outwardExtension; // conservative expand
        switch (shape.kind) {
            case 'circle':
                return aabbCircle(shape, expand);
            case 'square':
                return aabbSquare(shape, expand);
            case 'triangle':
                return aabbTriangle(shape, expand);
            default:
                return { minX: -1e6, maxX: 1e6, minY: -1e6, maxY: 1e6 };
        }
    });

    // Determine each pixel's color.
    // Precompute values that are constant across pixels to avoid repeated
    // work inside the nested loops.
    const aspectRatio = canvasWidth / canvasHeight;
    const worldWidth = aspectRatio >= 1 ? 10.0 * aspectRatio : 10.0;
    const worldHeight = aspectRatio >= 1 ? 10.0 : 10.0 / aspectRatio;
    const invCanvasWidth = 1.0 / canvasWidth;
    const invCanvasHeight = 1.0 / canvasHeight;

    // Precompute the world X coordinate for every column and the world Y
    // coordinate for every row. This moves the division/multiplication out
    // of the inner pixel loop which is executed for every pixel.
    const worldXs = new Array(canvasWidth);
    for (let i = 0; i < canvasWidth; i++) {
        worldXs[i] = ((i + 0.5) * invCanvasWidth - 0.5) * worldWidth;
    }
    const worldYs = new Array(canvasHeight);
    for (let j = 0; j < canvasHeight; j++) {
        worldYs[j] = ((j + 0.5) * invCanvasHeight - 0.5) * worldHeight;
    }

    for (let y = 0; y < canvasHeight; y++) {
        for (let x = 0; x < canvasWidth; x++) {
            // Look up the precomputed world coordinates for this pixel.
            const worldX = worldXs[x];
            const worldY = worldYs[y];

            // Pick up colours from each shape if the pixel is inside it, or even
            // close to its edge (for anti-aliasing).
            let color = { red: 0, green: 0, blue: 0, alpha: 0 };

            // Step through each shape in order.
            ShapeLoop:
            for (let si = 0; si < shapes.length; si++) {
                const shape = shapes[si];
                // Quick axis-aligned bounding-box culling. If enabled and the
                // pixel's world coordinate lies outside the (conservative)
                // box for this shape, skip SDF evaluation entirely.
                if (ENABLE_BOX_CULLING) {
                    const box = shapeBoxes[si];
                    if (worldX < box.minX || worldX > box.maxX || worldY < box.minY || worldY > box.maxY) {
                        continue; // shape cannot affect this pixel
                    }
                }
                let distance;
                switch (shape.kind) {
                    case 'circle':
                        distance = sdfCircle(
                            worldX - shape.position.x,
                            worldY - shape.position.y,
                            shape.size
                        );
                        break;
                    case 'square':
                        distance = sdfSquare(
                            worldX - shape.position.x,
                            worldY - shape.position.y,
                            shape.size
                        );
                        break;
                    case 'triangle':
                        distance = sdfTriangle(
                            worldX - shape.position.x,
                            worldY - shape.position.y,
                            shape.size
                        );
                        break;
                    default:
                        throw RangeError(
                            `${xpx} shape kind '${shape.kind}' is not implemented`);
                }

                // Determine pixel color based on distance to shape edge. We
                // support both a textured fill (using sampleShapePattern) and
                // an optional stroke. The strokeWidth is specified in pixel
                // (not world units). Convert it to world units using
                // worldUnitsPerPixel so SDF checks work.

                // Fill alpha (with anti-aliasing).
                const fillSample = sampleShapePattern(shape, x, y);
                let fillAlpha = 0;
                if (distance < aaRegion / 2) {
                    // Map distance in [-aaRegion/2, aaRegion/2] to fill alpha
                    // such that at distance <= -aaRegion/2 -> 1, at >= aaRegion/2 -> 0.
                    fillAlpha = Math.max(0, Math.min(1, (-distance + aaRegion / 2) / aaRegion));
                }

                // Stroke alpha (pixel-unit strokeWidth).
                let strokeAlpha = 0;
                let strokeCol = null;
                if (typeof shape.strokeWidth === 'number' && shape.strokeWidth > 0 && shape.strokeColor) {
                    // Convert stroke width in pixels to world units so we can
                    // compare against the SDF distance. The stroke width is
                    // specified in pixels and should not scale with canvas size.
                    const strokeWidthWorld = shape.strokeWidth * worldUnitsPerPixel;

                    // Determine stroke band in world units depending on position.
                    let bandMin = 0, bandMax = 0;
                    switch (shape.strokePosition) {
                        case 'inside':
                            bandMin = -strokeWidthWorld;
                            bandMax = 0;
                            break;
                        case 'outside':
                            bandMin = 0;
                            bandMax = strokeWidthWorld;
                            break;
                        case 'center':
                        default:
                            bandMin = -strokeWidthWorld / 2;
                            bandMax = strokeWidthWorld / 2;
                            break;
                    }

                    // Distance from the band: zero if inside the band, positive
                    // if outside. We'll apply AA across aaRegion/2 at the band
                    // edges.
                    let distToBand = 0;
                    if (distance < bandMin) distToBand = bandMin - distance;
                    else if (distance > bandMax) distToBand = distance - bandMax;
                    else distToBand = 0;

                    const aaEdge = aaRegion / 2; // pixels->world AA half-band
                    if (distToBand === 0) strokeAlpha = 1;
                    else if (distToBand < aaEdge) strokeAlpha = 1 - (distToBand / aaEdge);
                    else strokeAlpha = 0;

                    strokeCol = shape.strokeColor;
                }

                // Composite stroke over fill to form this shape's color.
                if (fillAlpha === 0 && strokeAlpha === 0) {
                    // Nothing from this shape affects this pixel.
                    // Loop continues to next shape.
                    continue;
                }

                // Compute premultiplied RGB for stroke then fill.
                // premul = stroke.rgb*strokeA + fill.rgb*fillA*(1 - strokeA)
                const strokeA = strokeAlpha;
                const fillA = fillAlpha;

                const strokeR = strokeCol ? strokeCol.red : 0;
                const strokeG = strokeCol ? strokeCol.green : 0;
                const strokeB = strokeCol ? strokeCol.blue : 0;

                const premulR = (strokeR * strokeA) + (fillSample.red * fillA * (1 - strokeA));
                const premulG = (strokeG * strokeA) + (fillSample.green * fillA * (1 - strokeA));
                const premulB = (strokeB * strokeA) + (fillSample.blue * fillA * (1 - strokeA));
                const outA = strokeA + fillA * (1 - strokeA);

                // Convert premultiplied RGB to non-premultiplied for the
                // outer compositing code which expects (rgb, alpha).
                if (outA > 0) {
                    color = {
                        red: Math.round(premulR / outA),
                        green: Math.round(premulG / outA),
                        blue: Math.round(premulB / outA),
                        alpha: outA,
                    };
                } else {
                    // Shouldn't happen because we early-continued when both are 0,
                    // but be defensive.
                    color = { red: 0, green: 0, blue: 0, alpha: 0 };
                }

                // Blend the shape onto the canvas. Do NOT break the shape loop
                // when encountering a fully-opaque pixel -- later shapes in the
                // array should be allowed to paint over earlier ones.
                if (color.alpha > 0) {
                    const existing = pixelCanvas[y][x];
                    pixelCanvas[y][x] = {
                        red: Math.round(
                            (color.red * color.alpha) +
                            (existing.red * (1 - color.alpha))
                        ),
                        green: Math.round(
                            (color.green * color.alpha) +
                            (existing.green * (1 - color.alpha))
                        ),
                        blue: Math.round(
                            (color.blue * color.alpha) +
                            (existing.blue * (1 - color.alpha))
                        ),
                    };
                }
            }
        }
    }

    // Create a canvas of the unicode U+2580 'Upper Half Block' character.
    // Each character cell represents two pixels: the upper half and the lower
    // half. They are drawn using ANSI escape codes to set the foreground and
    // background colors accordingly.
    const charCanvas = Array.from({ length: canvasHeight / 2 }, () =>
        Array.from({ length: canvasWidth }, () => '▀')
    );

    // If monochrome, just render the whole thing in characters with no ANSI.
    // This is handy for unit tests.
    if (colorDepth === 'monochrome') {
        return charCanvas.map(
            (row, y) => row.map((_char, x) => { // TODO use `char` or get rid of it
                const upper = pixelCanvas[y * 2][x];
                const lower = pixelCanvas[y * 2 + 1][x];
                return getMonochrome(upper, lower);
            }).join('')
        ).join('\n');
    }

    // Render the character canvas, with Truecolor ANSI escape codes.
    const isTruecolor = colorDepth === 'truecolor';
    return charCanvas.map(
        (row, y) => row.map((char, x) => { // TODO use `char`, or don't even generate it
            const upper = pixelCanvas[y * 2][x];
            const lower = pixelCanvas[y * 2 + 1][x];
            const ansi = isTruecolor
                ? getAnsiTruecolor(upper, lower)
                : getAnsi256Color(upper, lower);
            return ansi + char;
        }).join('') + '\u001b[0m' // reset color at end of each line
    ).join('\n');
}

/** #### Draws a breton pattern background onto a pixel canvas
 * @param {Color[][]} pixelCanvas The pixel canvas to draw on
 * @param {Color} ink The ink color
 * @param {Color} paper The paper color
 */
function drawBackgroundBreton(pixelCanvas, ink, paper) {
    for (let y = 0; y < pixelCanvas.length; y++) {
        const color = (y % 2 === 0) ? ink : paper;
        for (let x = 0; x < pixelCanvas[y].length; x++) {
            pixelCanvas[y][x] = color;
        }
    }
}

/** #### Draws a pinstripe pattern background onto a pixel canvas
 * @param {Color[][]} pixelCanvas The pixel canvas to draw on
 * @param {Color} ink The ink color
 * @param {Color} paper The paper color
 */
function drawBackgroundPinstripe(pixelCanvas, ink, paper) {
    for (let x = 0; x < pixelCanvas[0].length; x++) {
        const color = (x % 2 === 0) ? ink : paper;
        for (let y = 0; y < pixelCanvas.length; y++) {
            pixelCanvas[y][x] = color;
        }
    }
}

/** #### Gets the ANSI escape code for a pair of colors in Truecolor
 * @param {Color} upper The upper half color
 * @param {Color} lower The lower half color
 * @returns {string} The ANSI escape code
 */
function getAnsiTruecolor(upper, lower) {
    return `\u001b[38;2;${upper.red};${upper.green};${upper.blue}m\u001b[48;2;${lower.red};${lower.green};${lower.blue}m`;
}

/** #### Gets the ANSI escape code for a pair of colors in 256 colors
 * @param {Color} upper The upper half color
 * @param {Color} lower The lower half color
 * @returns {string} The ANSI escape code
 */
function getAnsi256Color(upper, lower) {
    const upperIndex = 16 + (36 * Math.round(upper.red / 51)) + (6 * Math.round(upper.green / 51)) + Math.round(upper.blue / 51);
    const lowerIndex = 16 + (36 * Math.round(lower.red / 51)) + (6 * Math.round(lower.green / 51)) + Math.round(lower.blue / 51);
    return `\u001b[38;5;${upperIndex}m\u001b[48;5;${lowerIndex}m`;
}

/** #### Gets the Unicode 'Block Elements' character for rendering in monochrome
 * @param {Color} upper The upper half color
 * @param {Color} lower The lower half color
 * @returns {string} The Unicode 'Block Elements' character
 */
function getMonochrome(upper, lower) {
    // Use an integer-only luminance approximation to be fast and portable to
    // environments like Rust or WGSL. Coefficients sum to 256 so we can shift
    // by 8 instead of dividing: (54*R + 183*G + 19*B) >> 8
    const lumUpper = (54 * upper.red + 183 * upper.green + 19 * upper.blue) >> 8;
    const lumLower = (54 * lower.red + 183 * lower.green + 19 * lower.blue) >> 8;
    return lumUpper > 128
        ? lumLower > 128
            ? '\u2588' // Full block
            : '\u2580' // Upper half block
    : lumLower > 128
            ? '\u2584' // Lower half block
            : ' ' // space - a refinement would be to use U+3000 (IDEOGRAPHIC SPACE), maybe even followed by U+2060 (WORD JOINER)
    ;
}

/** #### Get ink color with alpha for AA edge pixels
 * The actual blending of this ink over whatever is beneath the pixel
 * happens later in the main loop so edges blend correctly against other
 * shapes (not just the shape's paper).
 * @param {import('./types.js').Shape} shape The shape which provides ink
 * @param {number} edgeAlpha Alpha in range 0..1 (1 == full ink)
 * @returns {{red:number,green:number,blue:number,alpha:number}}
 */


/** #### Sample a shape's pattern at pixel coordinates
 * For now we support 'breton' (horizontal stripes) and 'pinstripe'
 * (vertical stripes). This mirrors the background pattern logic so the
 * same visuals can be used for backgrounds and shape fills.
 * @param {import('./types.js').Shape} shape
 * @param {number} px Pixel column index
 * @param {number} py Pixel row index
 * @returns {{red:number,green:number,blue:number}}
 */
function sampleShapePattern(shape, px, py) {
    switch (shape.pattern) {
        case 'breton':
            return (py % 2 === 0) ? shape.ink : shape.paper;
        case 'pinstripe':
            return (px % 2 === 0) ? shape.ink : shape.paper;
        default:
            return shape.ink;
    }
}

/** #### Blend edge color using the shape's pattern at this pixel
 * Returns a color object (r,g,b,alpha) where r/g/b are the shape's
 * pattern-sampled color and alpha is the supplied edgeAlpha. The returned
 * object is intended to be composited over the existing pixel value.
 */
function blendEdgeColor(shape, edgeAlpha, px, py) {
    const fill = sampleShapePattern(shape, px, py);
    return { red: fill.red, green: fill.green, blue: fill.blue, alpha: edgeAlpha };
}

// Signed distance functions have been moved to `src/signed-distance-functions.js`.
// They are imported at the top of this file as: sdfCircle, sdfSquare, sdfTriangle.


// Example usage:

console.log(
    renderAnsi(
        64, // will be 64 pixels = 64 characters wide
        48, // will be 24 pixels = 12 characters tall
        {
            ink: { red: 40, green: 60, blue: 90 },
            paper: { red: 20, green: 30, blue: 70 },
            pattern: 'breton', // horizontal stripes
        },
        [
            {
                kind: 'circle',
                size: 4, // radius in world units
                position: { x: 0, y: 0 }, // world-origin, which will render as the center of the canvas
                ink: { red: 255, green: 50, blue: 50 },
                paper: { red: 255, green: 200, blue: 200 },
                pattern: 'pinstripe', // vertical stripes
                strokeColor: { red: 255, green: 255, blue: 80 },
                strokePosition: 'inside',
                strokeWidth: 0.125, // quite subtle
            },
            {
                kind: 'triangle',
                size: 3, // half-size in world units
                position: { x: 4, y: -2 }, // world-origin offset to bottom-right
                ink: { red: 50, green: 50, blue: 255 },
                paper: { red: 200, green: 200, blue: 0 },
                pattern: 'breton', // horizontal stripes
                strokeColor: { red: 200, green: 255, blue: 200 },
                strokePosition: 'outside',
                strokeWidth: 1,
            },
            {
                kind: 'square',
                size: 3, // half-size in world units
                position: { x: -3, y: -2 }, // world-origin offset to top-left
                ink: { red: 50, green: 10, blue: 50 },
                paper: { red: 200, green: 255, blue: 200 },
                pattern: 'pinstripe', // horizontal stripes
                strokeColor: { red: 0, green: 0, blue: 0 },
                strokePosition: 'center',
                strokeWidth: 2.5,
            },
        ],
        typeof process === 'object' &&
            typeof process.env === 'object' &&
            process.env.COLORTERM
                ? 'truecolor'
                : '256', // detect truecolor support
    )
);
