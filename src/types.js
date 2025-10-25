/**
 * @typedef {'black'
 * | 'blue'
 * | 'cyan'
 * | 'green'
 * | 'yellow'
 * | 'red'
 * | 'magenta'
 * | 'white'
 * } Color
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
 *    ink: Color,
 *    paper: Color,
 *    pattern: Pattern,
 * }} Shape
 */
