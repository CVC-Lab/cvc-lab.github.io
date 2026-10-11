import katex from 'katex'

const MATH = /\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)/g

// Typesets \[...\] and \(...\) inside an HTML string. Pages call this at module scope,
// so the server render and hydration produce identical markup. A formula KaTeX cannot
// parse throws, which fails the build instead of publishing an error box.
export const renderMath = html =>
  html.replace(MATH, (match, display, inline) =>
    katex.renderToString(display === undefined ? inline : display, {
      displayMode: display !== undefined,
      throwOnError: true,
    })
  )
