
/** #### Renders an array of shapes as ANSI art
 * @param {number} canvasWidth The width of the canvas
 * @param {number} canvasHeight The height of the canvas
 * @param {import('./types.js').Shape[]} shapes An array of shapes to render
 * @returns {string} The rendered ANSI art
 */
export const renderAnsi = (
    canvasWidth,
    canvasHeight,
    shapes,
) => {
    const xpx = 'renderAnsi()';

    if (typeof canvasWidth !== 'number') throw TypeError(
        `${xpx} canvasWidth is type '${typeof canvasWidth}' not 'number'`);
    if (!isIntInRange(canvasWidth, 1, 120)) throw TypeError(
        `${xpx} canvasWidth must be an integer between 1 and 120`);
    if (typeof canvasHeight !== 'number') throw TypeError(
        `${xpx} canvasHeight is type '${typeof canvasHeight}' not 'number'`);
    if (!isIntInRange(canvasHeight, 1, 64)) throw TypeError(
        `${xpx} canvasHeight must be an integer between 1 and 64`);
    if (!Array.isArray(shapes)) throw TypeError(
        `${xpx} shapes is type '${typeof shapes}' not 'array'`);

    const canvas = Array.from({ length: canvasHeight }, () =>
        Array.from({ length: canvasWidth }, () => 'x')
    );
    return canvas.map(row => row.join('')).join('\n');
}

/** #### Checks if a number is an integer within a specified range
 * - Note that `Number.isInteger(NaN)` immediately returns false
 * @param {number} num The number to check
 * @param {number} min The minimum value (inclusive)
 * @param {number} max The maximum value (inclusive)
 * @returns {boolean} True if the number is an integer within the range, false otherwise
 */
const isIntInRange = (num, min, max) =>
    Number.isInteger(num) && num >= min && num <= max;