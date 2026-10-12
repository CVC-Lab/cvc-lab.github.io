import * as React from 'react'
import { graphql, navigate } from 'gatsby'
import DOMPurify from 'isomorphic-dompurify'
import Layout from '../components/layout'
import Seo from '../components/seo'
import BackLink from '../components/ui/BackLink'
import PageHeader from '../components/ui/PageHeader'
import { isStaticPath, withTrailingSlash } from '../components/ui/SmartLink'
// KaTeX's stylesheet before the AI4PD layout (and its scroll-strip CSS): the tri-modal pages
// load KaTeX before the Tabs primitive, and both pages must agree on that order.
import 'katex/dist/katex.min.css'
import katexMain from 'katex/dist/fonts/KaTeX_Main-Regular.woff2'
import katexMath from 'katex/dist/fonts/KaTeX_Math-Italic.woff2'
import Ai4pdMarkdownPage from '../components/ai4pd/Ai4pdMarkdownPage'
import { prefersReducedMotion } from '../hooks/motion'
import '../components/project_page.css'
import '../components/sponsors.css'

// The HTML is generated at build time from the repo's own markdown, so the sanitiser is
// defence in depth, not a trust boundary. Its defaults strip <iframe> (every YouTube embed),
// the KaTeX <semantics>/<annotation> pair and several MathML/iframe attributes.
const SANITIZE_OPTIONS = {
  ADD_TAGS: ['iframe', 'semantics', 'annotation'],
  ADD_ATTR: [
    'allow',
    'allowfullscreen',
    'frameborder',
    'scrolling',
    'target',
    'loading',
    'referrerpolicy',
    'sandbox',
    'encoding',
    'columnalign',
    'columnspacing',
    'rowspacing',
    'linebreak',
  ],
}

const escapeAttr = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

const toText = fragment =>
  fragment
    .replace(/<annotation[\s\S]*?<\/annotation>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;|&#x26;|&#38;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const normalise = s =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const slugify = text =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

// An attribute run that tolerates '>' inside quoted values: jsdom (SSR) does not escape it,
// Chromium does, and one image alt contains "->".
const ATTRS = '(?:[^>"]|"[^"]*")*'
const tagRe = name => new RegExp(`<${name}\\b${ATTRS}>`, 'g')
const LEADING_H1 = new RegExp(`^\\s*<h1${ATTRS}>([\\s\\S]*?)<\\/h1>\\s*`)
const HEADING = new RegExp(`<h([2-6])(${ATTRS})>([\\s\\S]*?)<\\/h\\1>`, 'g')
const IMG = new RegExp(`<img${ATTRS}>`, 'g')
const HREF = /\shref="([^"]*)"/
const IFRAME = new RegExp(`(<iframe\\b${ATTRS}>)([\\s\\S]*?)<\\/iframe>`, 'g')
const AUTOPLAY = /\sautoplay(?:="[^"]*")?(?=[\s/>])/

// A relative page link ("download", "../texmol") gets the trailing slash of the route it
// resolves to, so a new tab, a crawler or a visit without JavaScript skips the redirect.
function slashRelativeHref(href) {
  if (/^(?:[a-z][a-z0-9+.-]*:|[/#?])/i.test(href)) return href
  const cut = href.search(/[?#]/)
  const path = cut < 0 ? href : href.slice(0, cut)
  const last = path.slice(path.lastIndexOf('/') + 1)
  if (!last || last.includes('.')) return href
  return `${path}/${cut < 0 ? '' : href.slice(cut)}`
}

// heading: what the page <h1> shows. eyebrow: the frontmatter title when it adds context.
function resolveTitle(title, h1Html) {
  if (!h1Html) return { headingHtml: null, heading: title, eyebrow: null }
  const h1Text = toText(h1Html)
  const t = normalise(title)
  const h = normalise(h1Text)
  if (!h || t.includes(h)) return { headingHtml: null, heading: title, eyebrow: null }
  if (h.includes(t)) return { headingHtml: h1Html, heading: h1Text, eyebrow: null }
  return { headingHtml: h1Html, heading: h1Text, eyebrow: title }
}

// An image from another site with no width/height (legacy pages hot-link hosts that may only
// answer on campus) is held behind a note from the first paint, so the note's box never appears
// later: MarkdownBody shows the image when it loads or marks the note unavailable
// (flagMissingImages). An image-only link to the same host is held with it, as it would be an
// empty tab stop, and images side by side share one note. Without JavaScript the notes are hidden
// and the images shown (project_page.css).
const HELD = 'data-media-held'
const NOTE = 'data-media-note'
const HOLDABLE = new RegExp(`<a\\b(${ATTRS})>\\s*(<img${ATTRS}>)\\s*<\\/a>|<img${ATTRS}>`, 'g')
const attrOf = (tag, name) => (tag.match(new RegExp(`\\s${name}="([^"]*)"`)) || [])[1]
const hostOf = url => (/^https?:\/\/([^/?#]+)/i.exec(url || '') || [])[1]
const isSized = img => Number(attrOf(img, 'width')) > 0 && Number(attrOf(img, 'height')) > 0

const noteLabel = (count, unavailable) => {
  if (unavailable) return count > 1 ? `${count} images unavailable` : 'Image unavailable'
  return count > 1 ? `Loading ${count} images…` : 'Loading image…'
}

const noteHtml = (count, alts) => {
  const detail = alts.length ? `<span class="visually-hidden">: ${alts.join('; ')}</span>` : ''
  return `<span class="media-unavailable" ${NOTE}="">${noteLabel(count, false)}${detail}</span>`
}

function holdUnsizedImages(html) {
  let out = ''
  let last = 0
  let run = null
  const flush = () => {
    if (run) out += noteHtml(run.count, run.alts) + run.html
    run = null
  }
  for (const match of html.matchAll(HOLDABLE)) {
    const [unit, linkAttrs, linkedImg] = match
    const img = linkedImg || unit
    const host = hostOf(attrOf(img, 'src'))
    if (!host || isSized(img)) continue
    const alts = attrOf(img, 'alt') ? [attrOf(img, 'alt')] : []
    const heldImg = img.replace(/^<img/, `<img ${HELD}=""`)
    const between = html.slice(last, match.index)
    last = match.index + unit.length
    if (linkedImg && hostOf(attrOf(linkAttrs, 'href')) !== host) {
      // A link to somewhere else stays; the note takes the image's place inside it.
      flush()
      out += between + unit.replace(linkedImg, noteHtml(1, alts) + heldImg)
    } else {
      const element = linkedImg ? unit.replace(/^<a/, `<a ${HELD}=""`) : heldImg
      if (run && !between.trim()) {
        run.html += between + element
        run.count += 1
        run.alts.push(...alts)
      } else {
        flush()
        out += between
        run = { html: element, count: 1, alts }
      }
    }
  }
  flush()
  return out + html.slice(last)
}

// Ids are added after sanitising: DOMPurify's clobbering guard would drop ids such as "method".
function enhanceBody(html, pageTitle) {
  const used = new Set(['main-content'])
  const iframeTotal = (html.match(/<iframe\b/g) || []).length
  let iframeIndex = 0

  const body = html
    .replace(/<(\/?)h1(?=[\s>])/g, '<$1h2')
    .replace(HEADING, (match, level, attrs, inner) => {
      if (/\sid=/.test(attrs)) return match
      const base = slugify(toText(inner)) || 'section'
      let id = base
      for (let n = 2; used.has(id); n += 1) id = `${base}-${n}`
      used.add(id)
      return `<h${level} id="${id}"${attrs}>${inner}</h${level}>`
    })
    .replace(/<table\b[\s\S]*?<\/table>/g, table => `<div class="table-scroll">${table}</div>`)
    .replace(/<p>([\s\S]*?)<\/p>/g, (paragraph, inner) => {
      // A paragraph of images only (a gallery row) is centred like a lone image.
      const images = inner.match(IMG) || []
      const rest = inner.replace(IMG, '').replace(/<br\s*\/?>/g, '')
      if (images.length < 2 || rest.trim()) return paragraph
      return `<p class="md-image-row">${inner}</p>`
    })
    .replace(tagRe('img'), tag => {
      let out = tag
      if (!/\sloading=/.test(out)) out = out.replace(/^<img/, '<img loading="lazy"')
      if (!/\sdecoding=/.test(out)) out = out.replace(/^<img/, '<img decoding="async"')
      return out
    })
    .replace(tagRe('a'), tag => {
      // gatsby-remark-images links the full-size file, which opens in the same tab (D10).
      if (/\sclass="[^"]*\bgatsby-resp-image-link\b/.test(tag)) {
        return tag.replace(/\starget="[^"]*"/, '').replace(/\srel="[^"]*"/, '')
      }
      const out = tag.replace(HREF, (attr, href) => ` href="${slashRelativeHref(href)}"`)
      if (!/\starget="_blank"/.test(out)) return out
      return out.replace(/\srel="[^"]*"/, '').replace(/^<a/, '<a rel="noopener noreferrer"')
    })
    .replace(tagRe('video'), tag => {
      // Looping clips are started by MarkdownBody (in view, motion allowed), not by the
      // autoplay attribute, which plays before hydration whatever the motion preference and
      // downloads every clip at once. Without JavaScript a clip shows its poster and controls.
      if (!AUTOPLAY.test(tag)) return tag
      const preload = /\sposter=/.test(tag) ? 'none' : 'metadata'
      let out = tag.replace(AUTOPLAY, '').replace(/\spreload="[^"]*"/, '')
      if (!/\scontrols(?=[\s=/>])/.test(out)) out = out.replace(/^<video/, '<video controls=""')
      return out.replace(/^<video/, `<video data-autoplay="" preload="${preload}"`)
    })
    .replace(IFRAME, (element, open, inner) => {
      iframeIndex += 1
      let tag = open.replace(/\stitle=""/, '')
      if (!/\stitle=/.test(tag)) {
        const kind = /youtube|youtu\.be|vimeo/.test(tag)
          ? 'Embedded video'
          : /\.pdf\b/.test(tag)
            ? 'Embedded PDF'
            : 'Embedded content'
        const count = iframeTotal > 1 ? ` (${iframeIndex} of ${iframeTotal})` : ''
        const title = escapeAttr(`${kind}: ${pageTitle}${count}`)
        tag = tag.replace(/^<iframe/, `<iframe title="${title}"`)
      }
      if (!/\sloading=/.test(tag)) tag = tag.replace(/^<iframe/, '<iframe loading="lazy"')
      if (!/\ssrc="/.test(tag)) return `${tag}${inner}</iframe>`
      // Browsers fetch a lazy iframe far ahead of the viewport (a 1.2 MB PDF, a YouTube
      // player just below a phone's first screen), so MarkdownBody sets the src once the
      // frame scrolls into view. The sandbox waits too: on the empty same-origin document a
      // frame starts with, "allow-scripts allow-same-origin" makes Chromium warn.
      const deferred = tag
        .replace(/\ssrc="/, ' data-src="')
        .replace(/\ssandbox="/, ' data-sandbox="')
      return `${deferred}${inner}</iframe><noscript>${tag}${inner}</iframe></noscript>`
    })
  return holdUnsizedImages(body)
}

// The meta description: the first paragraph that reads as prose (at least a dozen words with a
// sentence end, not a navigation line, a formula or a fragment that continues a list item), cut on
// a word boundary. A paragraph without formulas or superscripts is preferred. Failing that, a
// formula counts as its visible text and a superscript (a footnote marker) is dropped; a line that
// starts with a superscript or is all bold (affiliations, footnotes, the author line) still is not
// prose. Empty when no paragraph qualifies: Seo then uses the site's description.
const PARAGRAPH = /<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/g
const MARKED = /<sup\b|class="katex/
const NOT_PROSE = /^(?:<sup\b|<strong>(?:(?!<\/?strong>)[\s\S])*<\/strong>$)/
const KATEX_MATHML = /<span class="katex-mathml">[\s\S]*?<\/math><\/span>/g
const SUPERSCRIPT = /<sup\b[\s\S]*?<\/sup>/g
const DESCRIPTION_LENGTH = 155

const isProse = text =>
  text.length >= 60 &&
  text.split(' ').length >= 12 &&
  /^[A-Z0-9"“(]/.test(text) &&
  /[.!?]["”)]?(?:\s|$)/.test(text)

const visibleText = paragraph =>
  toText(paragraph.replace(KATEX_MATHML, '').replace(SUPERSCRIPT, '')).replace(/\u200b/g, '')

function describe(html) {
  const paragraphs = Array.from(html.matchAll(PARAGRAPH), match => match[1].trim())
  const text =
    paragraphs
      .filter(paragraph => !MARKED.test(paragraph))
      .map(toText)
      .find(isProse) ||
    paragraphs
      .filter(paragraph => !NOT_PROSE.test(paragraph))
      .map(visibleText)
      .find(isProse)
  if (!text) return ''
  if (text.length <= DESCRIPTION_LENGTH) return text
  const cut = text.slice(0, DESCRIPTION_LENGTH)
  const end = cut.lastIndexOf(' ')
  return `${(end > 80 ? cut.slice(0, end) : cut).replace(/[\s,;:.(-]+$/, '')}…`
}

// Same output on the server (jsdom) and in the browser: string transforms over sanitised HTML.
function prepareMarkdown(html, title) {
  const clean = DOMPurify.sanitize(html, SANITIZE_OPTIONS)
  const lead = clean.match(LEADING_H1)
  const resolved = resolveTitle(title, lead ? lead[1] : null)
  const rest = lead ? clean.slice(lead[0].length) : clean
  return { ...resolved, body: enhanceBody(rest, resolved.heading) }
}

const SECTION_BACK = {
  projects: { to: '/projects/', label: 'Projects' },
  software: { to: '/software/', label: 'Software' },
  news: { to: '/news/', label: 'News' },
  seminars: { to: '/news/', label: 'News' },
}
const HOME = { to: '/', label: 'Home' }

// The section comes from the source directory: news slugs are root-level and there is
// no /seminars/ or /guides/ index to go back to. A software sub-page returns to the page
// of its own directory (softwareParents in the page query).
function backTarget(dir, pathname, softwarePages) {
  if (dir.startsWith('projects/dynamic_belief_games')) {
    return { to: '/projects/dynamic-belief-games/', label: 'Dynamic Belief Games' }
  }
  const section = dir.split('/')[0]
  if (section === 'software') {
    const parentPath = pathname.replace(/[^/]+\/?$/, '')
    const parentPage = softwarePages.find(
      node => `${node.frontmatter.slug.replace(/\/+$/, '')}/` === parentPath
    )
    if (parentPage) return { to: parentPath, label: parentPage.frontmatter.title }
  }
  return SECTION_BACK[section] || HOME
}

const SCROLLERS = '.table-scroll, pre, .katex-display'

// A box that scrolls sideways becomes a tab stop, so keyboard users can scroll it (Safari does
// not do this on its own), and a wide table fades out at the edge that hides more of it.
// Re-checked when the box or its content resizes, after a late web font and on scroll.
function watchScrollers(root) {
  const scrollers = Array.from(root.querySelectorAll(SCROLLERS))
  if (!scrollers.length) return () => {}
  const update = el => {
    const max = el.scrollWidth - el.clientWidth
    if (max > 1) el.setAttribute('tabindex', '0')
    else el.removeAttribute('tabindex')
    if (!el.classList.contains('table-scroll')) return
    const start = max > 1 && el.scrollLeft > 1
    const end = max > 1 && el.scrollLeft < max - 1
    if (start || end) el.setAttribute('data-fade', start && end ? 'both' : start ? 'start' : 'end')
    else el.removeAttribute('data-fade')
  }
  const updateAll = () => scrollers.forEach(update)
  const onScroll = event => update(event.currentTarget)
  const tables = scrollers.filter(el => el.classList.contains('table-scroll'))
  tables.forEach(el => el.addEventListener('scroll', onScroll, { passive: true }))

  let observer = null
  if (window.ResizeObserver) {
    observer = new window.ResizeObserver(updateAll)
    scrollers.forEach(el => {
      observer.observe(el)
      if (el.firstElementChild) observer.observe(el.firstElementChild)
    })
  } else {
    updateAll()
  }
  let active = true
  if (document.fonts) document.fonts.ready.then(() => active && updateAll())
  return () => {
    active = false
    if (observer) observer.disconnect()
    tables.forEach(el => el.removeEventListener('scroll', onScroll))
  }
}

// Looping clips (data-autoplay, see enhanceBody) play while a quarter of them is in view, unless
// the visitor prefers reduced motion. A clip the visitor pauses is left alone from then on.
function playClipsInView(root) {
  const clips = Array.from(root.querySelectorAll('video[data-autoplay]'))
  if (!clips.length || !window.IntersectionObserver || prefersReducedMotion()) return () => {}
  const inView = new Set()
  const observer = new window.IntersectionObserver(
    entries =>
      entries.forEach(({ target, isIntersecting, intersectionRatio }) => {
        if (isIntersecting && intersectionRatio >= 0.25) {
          inView.add(target)
          const playing = target.play()
          if (playing) playing.catch(() => {})
        } else {
          inView.delete(target)
          target.pause()
        }
      }),
    { threshold: 0.25 }
  )
  const onPause = event => {
    if (inView.has(event.target)) observer.unobserve(event.target)
  }
  clips.forEach(clip => {
    clip.addEventListener('pause', onPause)
    observer.observe(clip)
  })
  return () => {
    observer.disconnect()
    clips.forEach(clip => clip.removeEventListener('pause', onPause))
  }
}

// Body iframes get their sandbox and src (data-sandbox, data-src, see enhanceBody) when they
// scroll into view; the sandbox first, so it applies to the page the src loads.
function loadFramesInView(root) {
  const frames = Array.from(root.querySelectorAll('iframe[data-src]'))
  const load = frame => {
    if (frame.hasAttribute('data-sandbox')) {
      frame.setAttribute('sandbox', frame.getAttribute('data-sandbox'))
      frame.removeAttribute('data-sandbox')
    }
    frame.setAttribute('src', frame.getAttribute('data-src'))
    frame.removeAttribute('data-src')
  }
  if (!frames.length) return () => {}
  if (!window.IntersectionObserver) {
    frames.forEach(load)
    return () => {}
  }
  const observer = new window.IntersectionObserver(entries =>
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return
      observer.unobserve(target)
      load(target)
    })
  )
  frames.forEach(frame => observer.observe(frame))
  return () => observer.disconnect()
}

const MISSING_AFTER_MS = 10000

const urlOf = value => {
  try {
    return new window.URL(value, window.location.href)
  } catch {
    return null
  }
}

// An image from another host that fails, or still has no size 10 s after it came into view, is
// replaced by a short note. Unsized ones are already held behind a "Loading image…" note
// (holdUnsizedImages), so a failure only changes its text and a load swaps the image back in; an
// image with width/height gets a note of its own box when it fails. Held images (or image-only
// links) are hidden, not removed. The notes and what they hold live in the markup, so a later run
// of this effect picks them up again.
function flagMissingImages(root) {
  const isExternal = img => {
    const url = urlOf(img.getAttribute('src'))
    return Boolean(url && /^https?:$/.test(url.protocol) && url.origin !== window.location.origin)
  }
  const images = Array.from(root.querySelectorAll('img[src]')).filter(isExternal)

  const targetFor = new Map()
  const heldTargets = new Set()
  const noteFor = new Map()
  const members = new Map()
  const failed = new Set()
  const watched = new Map()
  const timers = new Set()

  const render = note => {
    const imgs = members.get(note)
    const alts = imgs.map(img => img.getAttribute('alt')).filter(Boolean)
    note.textContent = noteLabel(
      imgs.length,
      imgs.every(img => failed.has(img))
    )
    if (alts.length) {
      const detail = document.createElement('span')
      detail.className = 'visually-hidden'
      detail.textContent = `: ${alts.join('; ')}`
      note.append(detail)
    }
  }

  const hold = (note, target, img) => {
    target.setAttribute(HELD, '')
    heldTargets.add(target)
    targetFor.set(img, target)
    noteFor.set(img, note)
    members.get(note).push(img)
  }

  root.querySelectorAll(`[${NOTE}]`).forEach(note => {
    members.set(note, [])
    for (
      let el = note.nextElementSibling;
      el && el.hasAttribute(HELD);
      el = el.nextElementSibling
    ) {
      const img = el.matches('img') ? el : el.querySelector('img')
      if (img && isExternal(img)) hold(note, el, img)
      else el.removeAttribute(HELD)
    }
    if (members.get(note).length) render(note)
    else {
      members.delete(note)
      note.remove()
    }
  })
  if (!images.length) return () => {}

  // Puts a failed image behind a new note, or the neighbouring one if it is unsized.
  const hide = img => {
    const link = img.parentElement
    const src = urlOf(img.getAttribute('src'))
    const href = link && link.tagName === 'A' ? urlOf(link.getAttribute('href') || '') : null
    const target =
      href && href.host === src.host && link.children.length === 1 && !link.textContent.trim()
        ? link
        : img
    const sized = Number(img.getAttribute('width')) > 0 && Number(img.getAttribute('height')) > 0
    let previous = target.previousSibling
    while (
      previous &&
      (heldTargets.has(previous) || (previous.nodeType === 3 && !previous.textContent.trim()))
    ) {
      previous = previous.previousSibling
    }
    let note = !sized && members.has(previous) && !previous.style.width ? previous : null
    if (!note) {
      note = document.createElement('span')
      note.className = 'media-unavailable'
      note.setAttribute(NOTE, '')
      if (sized) {
        // Takes over the box the image had reserved, so nothing around it moves.
        note.classList.add('media-unavailable--sized')
        note.style.width = `${img.getAttribute('width')}px`
        note.style.aspectRatio = `${img.getAttribute('width')} / ${img.getAttribute('height')}`
      }
      members.set(note, [])
      target.before(note)
    }
    hold(note, target, img)
    return note
  }

  const fail = img => {
    failed.add(img)
    render(noteFor.get(img) || hide(img))
  }

  const show = img => {
    const note = noteFor.get(img)
    if (!note || !img.naturalWidth) return
    const target = targetFor.get(img)
    target.removeAttribute(HELD)
    heldTargets.delete(target)
    targetFor.delete(img)
    noteFor.delete(img)
    failed.delete(img)
    const imgs = members.get(note)
    imgs.splice(imgs.indexOf(img), 1)
    if (imgs.length) render(note)
    else {
      members.delete(note)
      note.remove()
    }
  }

  const onError = event => fail(event.currentTarget)
  const onLoad = event => show(event.currentTarget)
  const observer = window.IntersectionObserver
    ? new window.IntersectionObserver(entries =>
        entries.forEach(({ target, isIntersecting }) => {
          if (!isIntersecting) return
          observer.unobserve(target)
          const imgs = watched.get(target)
          const timer = window.setTimeout(() => {
            timers.delete(timer)
            imgs.forEach(img => {
              if (!img.naturalWidth) fail(img)
            })
          }, MISSING_AFTER_MS)
          timers.add(timer)
        })
      )
    : null
  // A hidden image never starts a lazy load, so it switches to eager loading once its note is
  // within a screen of the viewport, about where the browser would have started it.
  const nearby = window.IntersectionObserver
    ? new window.IntersectionObserver(
        entries =>
          entries.forEach(({ target, isIntersecting }) => {
            if (!isIntersecting) return
            nearby.unobserve(target)
            watched.get(target).forEach(img => {
              img.loading = 'eager'
            })
          }),
        { rootMargin: '100% 0px' }
      )
    : null
  // The 10 s start when the image, or the note standing in for it, comes into view.
  const watch = (element, img) => {
    if (!watched.has(element)) watched.set(element, [])
    watched.get(element).push(img)
    if (observer) observer.observe(element)
  }

  images.forEach(img => {
    img.addEventListener('error', onError)
    img.addEventListener('load', onLoad)
    const note = noteFor.get(img)
    // A deferred lazy image is not complete; a complete one without a size failed before hydration.
    if (img.complete && img.naturalWidth) show(img)
    else if (img.complete) fail(img)
    else if (!note) watch(img, img)
    else {
      watch(note, img)
      if (nearby) nearby.observe(note)
      else img.loading = 'eager'
    }
  })
  return () => {
    if (observer) observer.disconnect()
    if (nearby) nearby.disconnect()
    timers.forEach(timer => window.clearTimeout(timer))
    images.forEach(img => {
      img.removeEventListener('error', onError)
      img.removeEventListener('load', onLoad)
    })
  }
}

// Routes a same-origin page link through the Gatsby router; files, static microsites,
// new-tab links and in-page anchors keep the browser's own navigation.
function routeInternalLink(event, root) {
  if (event.defaultPrevented || event.button !== 0) return
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const anchor = event.target.closest('a[href]')
  if (!anchor || !root.contains(anchor) || anchor.hasAttribute('download')) return
  const target = anchor.getAttribute('target')
  if (target && target !== '_self') return
  const href = anchor.getAttribute('href')
  if (href.startsWith('#')) return
  const url = new window.URL(href, window.location.href)
  if (url.origin !== window.location.origin || isStaticPath(url.pathname)) return
  if (url.pathname === window.location.pathname && url.hash) return
  event.preventDefault()
  navigate(withTrailingSlash(`${url.pathname}${url.search}${url.hash}`))
}

const MarkdownBody = ({ html, className }) => {
  const ref = React.useRef(null)

  React.useEffect(() => {
    const root = ref.current
    if (!root) return undefined

    const cleanups = [
      watchScrollers(root),
      playClipsInView(root),
      loadFramesInView(root),
      flagMissingImages(root),
    ]
    const onClick = event => routeInternalLink(event, root)
    root.addEventListener('click', onClick)
    return () => {
      cleanups.forEach(cleanup => cleanup())
      root.removeEventListener('click', onClick)
    }
  }, [html])

  return <div ref={ref} className={className} dangerouslySetInnerHTML={{ __html: html }} />
}

export default function MarkdownPage({ data, location }) {
  const { frontmatter, html, parent } = data.markdownRemark
  const dir = (parent && parent.relativeDirectory) || ''
  const page = React.useMemo(
    () => prepareMarkdown(html, frontmatter.title),
    [html, frontmatter.title]
  )
  const title = page.headingHtml ? (
    <span dangerouslySetInnerHTML={{ __html: page.headingHtml }} />
  ) : (
    page.heading
  )

  if (dir.startsWith('projects/ai4pd')) {
    return (
      <Ai4pdMarkdownPage title={title} eyebrow={page.eyebrow} slug={frontmatter.slug}>
        <MarkdownBody html={page.body} className="post-body" />
      </Ai4pdMarkdownPage>
    )
  }

  if (dir === 'sponsors') {
    return (
      <Layout>
        <div className="page-container sponsors-page">
          <PageHeader title={title} />
          <MarkdownBody html={page.body} className="post-body prose sponsors-body" />
        </div>
      </Layout>
    )
  }

  const slugClass = frontmatter.slug
    ? `project-page-${frontmatter.slug.replace(/^\/+/, '').replace(/[^a-zA-Z0-9]+/g, '-')}`
    : ''
  const back = backTarget(dir, location.pathname, data.softwareParents.nodes)

  return (
    <Layout>
      <article className={`page-container md-page ${slugClass}`.trim()}>
        <PageHeader
          className="md-header"
          back={<BackLink to={back.to}>Back to {back.label}</BackLink>}
          eyebrow={page.eyebrow}
          title={title}
        />
        <MarkdownBody html={page.body} className="post-body prose" />
      </article>
    </Layout>
  )
}

// The two KaTeX faces nearly every formula is set in. Arriving after the first paint, they re-wrap
// the paragraphs around inline math; the URLs are the ones the KaTeX stylesheet uses. gatsby-ssr.js
// moves the main face's preload ahead of the inlined stylesheet.
const KATEX_FONTS = [katexMain, katexMath]

export const Head = ({ data, location }) => {
  const { frontmatter, html, parent } = data.markdownRemark
  const dir = (parent && parent.relativeDirectory) || ''
  const inAi4pd = dir.startsWith('projects/ai4pd')
  const title =
    inAi4pd && !/^AI4PD\b/.test(frontmatter.title)
      ? `${frontmatter.title} | AI4PD`
      : frontmatter.title

  return (
    <>
      <Seo title={title} description={describe(html)} pathname={location.pathname} />
      {html.includes('class="katex') &&
        KATEX_FONTS.map(href => (
          <link
            key={href}
            rel="preload"
            as="font"
            type="font/woff2"
            href={href}
            crossOrigin="anonymous"
          />
        ))}
    </>
  )
}

export const pageQuery = graphql`
  query ($id: String!) {
    markdownRemark(id: { eq: $id }) {
      html
      parent {
        ... on File {
          relativeDirectory
        }
      }
      frontmatter {
        title
        slug
      }
    }
    softwareParents: allMarkdownRemark(
      filter: {
        fileAbsolutePath: { glob: "**/markdown/software/*/*.md" }
        frontmatter: { slug: { glob: "/software/*" } }
      }
      sort: { frontmatter: { slug: ASC } }
    ) {
      nodes {
        frontmatter {
          slug
          title
        }
      }
    }
  }
`
