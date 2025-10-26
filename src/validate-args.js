/**
 * @typedef {import('./types.js').Background} Background
 * @typedef {import('./types.js').Color} Color
 * @typedef {import('./types.js').Pattern} Pattern
 * @typedef {import('./types.js').Shape} Shape
 */

/** #### Checks if a number is an integer within a specified range
 * - Note that `Number.isInteger(NaN)` immediately returns false
 * @param {number} num The number to check
 * @param {number} min The minimum value (inclusive)
 * @param {number} max The maximum value (inclusive)
 * @returns {boolean} True if the number is an integer within the range, false otherwise
 */
export const isIntInRange = (num, min, max) =>
    Number.isInteger(num) && num >= min && num <= max;

/** #### Checks if a color is valid
 * @param {Color} color The color to check
 * @returns {boolean} True if the color is valid, false otherwise
 */
export const isValidColor = (color) => {
    if (typeof color !== 'object' || color === null || Array.isArray(color)) return false;
    const hasRed = Object.prototype.hasOwnProperty.call(color, 'red');
    const hasGreen = Object.prototype.hasOwnProperty.call(color, 'green');
    const hasBlue = Object.prototype.hasOwnProperty.call(color, 'blue');
    if (!hasRed || !hasGreen || !hasBlue) return false;
    if (typeof color.red !== 'number' || !isIntInRange(color.red, 0, 255)) return false;
    if (typeof color.green !== 'number' || !isIntInRange(color.green, 0, 255)) return false;
    if (typeof color.blue !== 'number' || !isIntInRange(color.blue, 0, 255)) return false;
    return true;
}

/** #### Checks if a pattern is valid
 * @param {Pattern} pattern The pattern to check
 * @returns {boolean} True if the pattern is valid, false otherwise
 */
export const isValidPattern = (pattern) => {
    return ['breton', 'pinstripe'].indexOf(pattern) !== -1;
}

/** #### Validates a background object
 * @param {import('./types.js').Background} background The background object to validate
 * @param {string} xpx The name of the function (for error messages)
 */
export const validateBackground = (background, xpx) => {
    if (background === null || Array.isArray(background)) throw TypeError(
        `${xpx} background is '${background === null ? 'null' : 'array'}' not a plain object`);
    if (typeof background !== 'object') throw TypeError(
        `${xpx} background is type '${typeof background}' not 'object'`);
    if (!isValidColor(background.ink)) throw RangeError(
        `${xpx} background.ink is not a valid color`);
    if (!isValidColor(background.paper)) throw RangeError(
        `${xpx} background.paper is not a valid color`);
    if (typeof background.pattern !== 'string') throw TypeError(
        `${xpx} background.pattern is type '${typeof background.pattern}' not 'string'`);
    if (!isValidPattern(background.pattern)) throw RangeError(
        `${xpx} background.pattern is not a valid pattern`);
}

/** #### Validates a shape object
 * @param {import('./types.js').Shape} shape The shape object to validate
 * @param {string} xpx The name of the function (for error messages)
 * @param {number} index The index of the shape in the shapes array (for error messages)
 */
export const validateShape = (shape, xpx, index) => {
    if (shape === null || Array.isArray(shape)) throw TypeError(
        `${xpx} shapes[${index}] is '${shape === null ? 'null' : 'array'}' not a plain object`);
    if (typeof shape !== 'object') throw TypeError(
        `${xpx} shapes[${index}] is type '${typeof shape}' not 'object'`);
    if (typeof shape.kind !== 'string') throw TypeError(
        `${xpx} shapes[${index}].kind is type '${typeof shape.kind}' not 'string'`);
    if (['circle', 'square', 'triangle'].indexOf(shape.kind) === -1) throw RangeError(
        `${xpx} shapes[${index}].kind must be one of 'circle', 'square', or 'triangle'`);
    if (typeof shape.size !== 'number') throw TypeError(
        `${xpx} shapes[${index}].size is type '${typeof shape.size}' not 'number'`);
    if (!isIntInRange(shape.size, 1, 100)) throw RangeError(
        `${xpx} shapes[${index}].size must be an integer between 1 and 100`);
    if (shape.ink === null || Array.isArray(shape.ink)) throw TypeError(
        `${xpx} shapes[${index}].ink is '${shape.ink === null ? 'null' : 'array'}' not a plain object`);
    if (!isValidColor(shape.ink)) throw RangeError(
        `${xpx} shapes[${index}].ink is not a valid color`);
    if (shape.paper === null || Array.isArray(shape.paper)) throw TypeError(
        `${xpx} shapes[${index}].paper is '${shape.paper === null ? 'null' : 'array'}' not a plain object`);
    if (!isValidColor(shape.paper)) throw RangeError(
        `${xpx} shapes[${index}].paper is not a valid color`);
    if (typeof shape.pattern !== 'string') throw TypeError(
        `${xpx} shapes[${index}].pattern is type '${typeof shape.pattern}' not 'string'`);
    if (!isValidPattern(shape.pattern)) throw RangeError(
        `${xpx} shapes[${index}].pattern is not a valid pattern`);
}
