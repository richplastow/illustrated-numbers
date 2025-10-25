import { throws, deepStrictEqual as eq } from 'node:assert/strict';
import { renderAnsi } from './render-ansi.js';

const xpx = 'renderAnsi()';

// @ts-expect-error
throws(() => renderAnsi(), { message: /is type 'undefined' not 'number'/});
// @ts-expect-error
throws(() => renderAnsi(true), { message: /is type 'boolean' not 'number'/});
// @ts-expect-error
throws(() => renderAnsi(10.1), { message: /an integer between 1 and 120/});

// @ts-expect-error
throws(() => renderAnsi(120), { message: /canvasHeight is type 'undefined' not 'number'/});
// @ts-expect-error
throws(() => renderAnsi(120, 65), { message: /canvasHeight must be an integer between 1 and 64/});

// @ts-expect-error
throws(() => renderAnsi(10, 10), { message: /shapes is type 'undefined' not 'array'/});

eq(renderAnsi(10, 5, []), `
xxxxxxxxxx
xxxxxxxxxx
xxxxxxxxxx
xxxxxxxxxx
xxxxxxxxxx
`.trim());

console.log(`All ${xpx} tests passed!`);
