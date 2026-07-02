/**
 * LAYOUT ENGINE — compatibility bridge.
 *
 * The Kellogg-Reed engine lives in ./kr/ (see ./kr/README.md for the module
 * map and data flow); this file preserves the long-standing public import
 * path. `layoutForMode` and `layout/index.ts` re-export from here.
 */
export { layoutDocument, mirrorLayout, type LayoutOptions } from './kr/document';
