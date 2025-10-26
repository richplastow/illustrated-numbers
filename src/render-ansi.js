import {
    isIntInRange,
    validateBackground,
    validateShape,
} from './validate-args.js';

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
    if (['truecolor', '256'].indexOf(colorDepth) === -1) throw RangeError(
        `${xpx} colorDepth must be one of 'truecolor' or '256'`);

    // Create a black canvas of pixels with the specified dimensions.
    const pixelCanvas = Array.from({ length: canvasHeight }, () =>
        Array.from({ length: canvasWidth }, () => ({ red: 0, green: 0, blue: 0 }))
    );

    // Create a canvas of the unicode U+2580 'Upper Half Block' character.
    // Each character cell represents two pixels: the upper half and the lower
    // half. They are drawn using ANSI escape codes to set the foreground and
    // background colors accordingly.
    const charCanvas = Array.from({ length: canvasHeight / 2 }, () =>
        Array.from({ length: canvasWidth }, () => '▀')
    );

    // Draw the background.
    switch (background.pattern) {
        case 'breton':
            drawBackgroundBreton(pixelCanvas, background.ink, background.paper);
            break;
        case 'pinstripe':
            drawBackgroundPinstripe(pixelCanvas, background.ink, background.paper);
            break;
    }

    // If the color depth is 256 colors, render the character canvas with 256-color ANSI escape codes.

    // Render the character canvas, with Truecolor ANSI escape codes.
    const isTruecolor = colorDepth === 'truecolor';
    return charCanvas.map(
        (row, y) => row.map((char, x) => {
            const upper = pixelCanvas[y * 2][x];
            const lower = pixelCanvas[y * 2 + 1][x];
            const ansi = isTruecolor ? getAnsiTruecolor(upper, lower) : getAnsi256Color(upper, lower);
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

// Example usage:

console.log(
    renderAnsi(
        16, // will be 16 pixels = 16 characters wide
        16, // will be 16 pixels = 8 characters tall
        {
            ink: { red: 128, green: 0, blue: 255 },
            paper: { red: 255, green: 128, blue: 0 },
            pattern: 'breton', // vertical stripes
        },
        [], // no shapes yet
        typeof process === 'object' &&
            typeof process.env === 'object' &&
            process.env.COLORTERM
                ? 'truecolor'
                : '256', // detect truecolor support
    )
);
