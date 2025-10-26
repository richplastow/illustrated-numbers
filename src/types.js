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
 * }} Shape
 */
