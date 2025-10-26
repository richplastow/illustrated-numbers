/**
 * @typedef {{
 *    red: number,
 *    green: number,
 *    blue: number,
 * }} Color
 */

/**
 * @typedef {'truecolor'
 * | '256'
 * | 'monochrome'
 * } ColorDepth
 */

/**
 * @typedef {'breton'
 * | 'pinstripe'
 * } Pattern
 */

/**
 * @typedef {{
 *    ink: Color,
 *    paper: Color,
 *    pattern: Pattern,
 * }} Background
 */

/**
 * @typedef {{
 *    kind: 'circle' | 'square' | 'triangle',
 *    size: number,
 *    position: { x: number, y: number },
 *    ink: Color,
 *    paper: Color,
 *    pattern: Pattern,
 *    strokeColor: Color,
 *    strokePosition: 'inside' | 'center' | 'outside',
 *    strokeWidth: number,
 * }} Shape
 */

// A standard Color object, with red, green and blue (no alpha) between 0 and 255.
//
// A float between 0 and 10. Not in world-units — it does not scale with the canvas size. Instead this is in pixel units — it behaves similarly to the textures.