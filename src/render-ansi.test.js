import { throws, deepStrictEqual as eq } from 'node:assert/strict';
import { renderAnsi } from './render-ansi.js';

const xpx = 'renderAnsi()';

/**
 * @typedef {import('./types.js').Background} Background
 * @typedef {import('./types.js').Shape} Shape
 */

/** @type {Background} */
const validBg = { ink: 'black', paper: 'white', pattern: 'breton' };

/** @type {Shape} */
const validShape = { kind: 'circle', size: 10, ink: 'black', paper: 'white', pattern: 'breton' };


// Invalid canvasWidth and canvasHeight.

// @ts-expect-error
throws(() => renderAnsi(), { message: /canvasWidth is type 'undefined' not 'number'/});
// @ts-expect-error
throws(() => renderAnsi(true), { message: /canvasWidth is type 'boolean' not 'number'/});
// @ts-expect-error
throws(() => renderAnsi(10.1), { message: /canvasWidth must be an integer between 1 and 120/});

// @ts-expect-error
throws(() => renderAnsi(120), { message: /canvasHeight is type 'undefined' not 'number'/});
// @ts-expect-error
throws(() => renderAnsi(120, 65), { message: /canvasHeight must be an integer between 1 and 64/});


// Invalid background.

throws(() => renderAnsi(10, 10, null, []), { message: /background is 'null' not a plain object/});
// @ts-expect-error
throws(() => renderAnsi(10, 10, []), { message: /background is 'array' not a plain object/});
// @ts-expect-error
throws(() => renderAnsi(10, 10, { ink: 123 }, []), { message: /background\.ink is type 'number' not 'string'/});
// @ts-expect-error
throws(() => renderAnsi(10, 10, { ink: 'invalid' }, []), { message: /background\.ink is not a valid color/});
// @ts-expect-error
throws(() => renderAnsi(10, 10, { ink: 'black' }, []), { message: /background\.paper is type 'undefined' not 'string'/});
// @ts-expect-error
throws(() => renderAnsi(10, 10, { ink: 'black', paper: 'white' }, []), { message: /background\.pattern is type 'undefined' not 'string'/});
// @ts-expect-error
throws(() => renderAnsi(10, 10, { ink: 'black', paper: 'white', pattern: 'invalid' }, []), { message: /background\.pattern is not a valid pattern/});


// Invalid shapes.

throws(() => renderAnsi(10, 10, validBg, null), { message: /shapes is null not an array/});
throws(() => renderAnsi(10, 10, validBg, /** @type {import('./types.js').Shape[]} */ ({})), { message: /shapes is type 'object' not 'array'/});
throws(() => renderAnsi(10, 10, validBg, [null]), { message: /shapes\[0\] is 'null' not a plain object/});
throws(() => renderAnsi(10, 10, validBg, [/** @type {any} */ ([]) ]), { message: /shapes\[0\] is 'array' not a plain object/});
// @ts-expect-error
throws(() => renderAnsi(10, 10, validBg, [ { size: 10, ink: 'black', paper: 'white', pattern: 'breton' } ]), { message: /shapes\[0\]\.kind is type 'undefined' not 'string'/});
// @ts-expect-error
throws(() => renderAnsi(10, 10, validBg, [ { ...validShape, size: 'large' } ]), { message: /shapes\[0\]\.size is type 'string' not 'number'/});
throws(() => renderAnsi(10, 10, validBg, [ { ...validShape, size: 101 } ]), { message: /shapes\[0\]\.size must be an integer between 1 and 100/});
// @ts-expect-error
throws(() => renderAnsi(10, 10, validBg, [ { ...validShape, ink: 123 } ]), { message: /shapes\[0\]\.ink is type 'number' not 'string'/});
// @ts-expect-error
throws(() => renderAnsi(10, 10, validBg, [ { ...validShape, ink: 'invalid' } ]), { message: /shapes\[0\]\.ink is not a valid color/});
// @ts-expect-error
throws(() => renderAnsi(10, 10, validBg, [ { ...validShape, paper: true } ]), { message: /shapes\[0\]\.paper is type 'boolean' not 'string'/});
// @ts-expect-error
throws(() => renderAnsi(10, 10, validBg, [ { ...validShape, paper: 'invalid' } ]), { message: /shapes\[0\]\.paper is not a valid color/});
// @ts-expect-error
throws(() => renderAnsi(10, 10, validBg, [ { ...validShape, pattern: [] } ]), { message: /shapes\[0\]\.pattern is type 'object' not 'string'/});
// @ts-expect-error
throws(() => renderAnsi(10, 10, validBg, [ validShape, { ...validShape, pattern: 'invalid' } ]), { message: /shapes\[1\]\.pattern is not a valid pattern/});


// Valid inputs.

eq(renderAnsi(10, 5, validBg, []), `
xxxxxxxxxx
xxxxxxxxxx
xxxxxxxxxx
xxxxxxxxxx
xxxxxxxxxx
`.trim());

console.log(`All ${xpx} tests passed!`);
