import {
    isIntInRange,
    validateBackground,
    validateShape,
} from './validate-args.js';

/** #### Renders an array of shapes as ANSI art
 * @param {number} canvasWidth The width of the canvas
 * @param {number} canvasHeight The height of the canvas
 * @param {import('./types.js').Background} background How to render the background
 * @param {import('./types.js').Shape[]} shapes An array of shapes to render
 * @returns {string} The rendered ANSI art
 */
export const renderAnsi = (
    canvasWidth,
    canvasHeight,
    background,
    shapes,
) => {
    const xpx = 'renderAnsi()';

    // Validate the arguments.
    if (typeof canvasWidth !== 'number') throw TypeError(
        `${xpx} canvasWidth is type '${typeof canvasWidth}' not 'number'`);
    if (!isIntInRange(canvasWidth, 1, 120)) throw RangeError(
        `${xpx} canvasWidth must be an integer between 1 and 120`);
    if (typeof canvasHeight !== 'number') throw TypeError(
        `${xpx} canvasHeight is type '${typeof canvasHeight}' not 'number'`);
    if (!isIntInRange(canvasHeight, 1, 64)) throw RangeError(
        `${xpx} canvasHeight must be an integer between 1 and 64`);
    validateBackground(background, xpx);
    if (shapes === null) throw TypeError(
        `${xpx} shapes is null not an array`);
    if (!Array.isArray(shapes)) throw TypeError(
        `${xpx} shapes is type '${typeof shapes}' not 'array'`);
    shapes.forEach((shape, i) => validateShape(shape, xpx, i));

    // Create a canvas with the specified dimensions.
    const canvas = Array.from({ length: canvasHeight }, () =>
        Array.from({ length: canvasWidth }, () => 'x')
    );

    /*
    // Draw the background.
    switch (background.pattern) {
        case 'breton':
            /// TODO NEXT
            break;
        case 'pinstripe':
            /// TODO NEXT
            break;
    }
    */

    // Render the canvas as a string.
    return canvas.map(row => row.join('')).join('\n');
}
