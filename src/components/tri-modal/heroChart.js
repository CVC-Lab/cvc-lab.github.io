import { prefersReducedMotion } from '../../hooks/motion'

const ARMS = [
  {
    label: 'Natural History / FUS Only',
    color: '#ef4444',
    dash: [],
    final: 1325,
    shape: 'rise',
  },
  {
    label: 'SP2 (SRT)',
    color: '#f97316',
    dash: [6, 4],
    final: 580,
    shape: 'mild',
  },
  {
    label: 'AAV Only',
    color: '#a78bfa',
    dash: [6, 4],
    final: 470,
    shape: 'mild2',
  },
  {
    label: 'SP2 + FUS',
    color: '#fbbf24',
    dash: [4, 4],
    final: 420,
    shape: 'bi1',
  },
  {
    label: 'SP2 + AAV',
    color: '#34d399',
    dash: [4, 4],
    final: 350,
    shape: 'bi2',
  },
  {
    label: 'AAV + FUS',
    color: '#60a5fa',
    dash: [4, 4],
    final: 280,
    shape: 'bi3',
  },
  {
    label: 'Tri-Modal (SP2+AAV+FUS)',
    color: '#38bdf8',
    dash: [],
    final: 180,
    shape: 'tri',
    bold: true,
  },
]

const N_PTS = 250
const DRAW_MS = 3600
const COMPACT_BELOW = 640
const BACKGROUND = '#0d1117'
const LABEL = 'rgba(255,255,255,0.72)'
const THRESHOLD = 500

const simulate = (shape, final) => {
  const pts = []

  for (let i = 0; i < N_PTS; i += 1) {
    const t = i / (N_PTS - 1)
    const noise = (Math.random() - 0.5) * 18 * (1 - t * 0.6)
    let v

    if (shape === 'rise') v = 890 + (final - 890) * Math.pow(t, 0.55)
    else if (shape === 'mild') v = 890 - (890 - final) * (1 - Math.exp(-3.2 * t))
    else if (shape === 'mild2') v = 890 - (890 - final) * (1 - Math.exp(-3.8 * t))
    else if (shape === 'bi1') v = 890 - (890 - final) * (1 - Math.exp(-4.2 * t))
    else if (shape === 'bi2') v = 890 - (890 - final) * (1 - Math.exp(-4.5 * t))
    else if (shape === 'bi3') v = 890 - (890 - final) * (1 - Math.exp(-5.0 * t))
    else v = 890 - (890 - final) * (1 - Math.exp(-6.0 * t))

    pts.push(v + noise)
  }

  return pts
}

// Draws the curves once when the chart scrolls into view, then holds the finished
// frame. The canvas box is sized by CSS; this only matches the backing store to it.
export const initHeroChart = canvas => {
  const ctx = canvas.getContext('2d')
  const family = window.getComputedStyle(canvas).fontFamily
  const font = (weight = '') => `${weight} 12px ${family}`.trim()
  const curves = ARMS.map(arm => ({ ...arm, data: simulate(arm.shape, arm.final) }))
  const allValues = curves.flatMap(curve => curve.data)
  const minV = Math.min(...allValues) - 50
  const maxV = Math.max(...allValues) + 50
  const reduceMotion = prefersReducedMotion()
  let pad = { top: 32, right: 20, bottom: 48, left: 60 }
  let width = 0
  let height = 0
  let compact = false
  let endLabel = ''
  let progress = reduceMotion ? 1 : 0
  let startTs = null
  let frame = null
  let disposed = false

  const layout = () => {
    const dpr = window.devicePixelRatio || 1
    width = canvas.clientWidth
    height = canvas.clientHeight
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    compact = width < COMPACT_BELOW
    endLabel = compact ? '↓ 75.7%' : '↓ 75.7%  (180 nmol/g)'
    ctx.font = font('bold')
    const endWidth = ctx.measureText(endLabel).width
    const legendWidth = Math.max(
      ...curves.map(curve => {
        ctx.font = font(curve.bold ? 'bold' : '')
        return 28 + ctx.measureText(curve.label).width
      })
    )
    // Everything that labels the curves sits in this right-hand gutter, clear of the plot.
    const gutter = compact ? endWidth + 14 : Math.max(endWidth + 14, legendWidth + 28)
    pad = { top: 32, right: Math.ceil(gutter), bottom: 48, left: 60 }
  }

  const toX = i => pad.left + (i / (N_PTS - 1)) * (width - pad.left - pad.right)
  const toY = v => pad.top + (1 - (v - minV) / (maxV - minV)) * (height - pad.top - pad.bottom)

  const strokeCurve = pts => {
    ctx.lineJoin = 'round'
    ctx.beginPath()
    pts.forEach((value, i) => {
      if (i === 0) ctx.moveTo(toX(i), toY(value))
      else ctx.lineTo(toX(i), toY(value))
    })
    ctx.stroke()
  }

  const draw = () => {
    if (!width || !height) return
    const eased = progress < 1 ? 1 - Math.pow(1 - progress, 2.5) : 1
    const nPts = Math.max(2, Math.floor(eased * N_PTS))
    const plotRight = width - pad.right
    const plotBottom = height - pad.bottom

    ctx.globalAlpha = 1
    ctx.setLineDash([])
    ctx.fillStyle = BACKGROUND
    ctx.fillRect(0, 0, width, height)
    ctx.font = font()
    ;[200, 400, 600, 800, 1000, 1200, 1400].forEach(value => {
      const y = toY(value)
      if (y < pad.top || y > plotBottom) return
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(pad.left, y)
      ctx.lineTo(plotRight, y)
      ctx.stroke()
      ctx.fillStyle = LABEL
      ctx.textAlign = 'right'
      ctx.fillText(value, pad.left - 8, y + 4)
    })

    const thresholdY = toY(THRESHOLD)
    ctx.strokeStyle = 'rgba(251,146,60,0.6)'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(pad.left, thresholdY)
    ctx.lineTo(plotRight, thresholdY)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(pad.left, pad.top)
    ctx.lineTo(pad.left, plotBottom)
    ctx.lineTo(plotRight, plotBottom)
    ctx.stroke()

    ctx.fillStyle = LABEL
    ctx.textAlign = 'center'
    ;(compact ? [0, 180, 365] : [0, 90, 180, 270, 365]).forEach(day => {
      const x = pad.left + (day / 365) * (plotRight - pad.left)
      ctx.fillText(`Day ${day}`, x, plotBottom + 18)
    })

    ctx.save()
    ctx.translate(16, pad.top + (plotBottom - pad.top) / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('Brain GM2 burden (nmol g⁻¹)', 0, 0)
    ctx.restore()

    curves.forEach(curve => {
      if (curve.bold) return
      ctx.globalAlpha = 0.75
      ctx.strokeStyle = curve.color
      ctx.lineWidth = 1.5
      ctx.setLineDash(curve.dash)
      strokeCurve(curve.data.slice(0, nPts))
    })

    const triCurve = curves.find(curve => curve.bold)
    const triPts = triCurve.data.slice(0, nPts)
    ctx.globalAlpha = 1
    ctx.setLineDash([])
    ctx.strokeStyle = triCurve.color
    ctx.lineWidth = 3
    ctx.shadowColor = triCurve.color
    ctx.shadowBlur = 10
    strokeCurve(triPts)
    ctx.shadowBlur = 0

    if (nPts > 180) {
      ctx.globalAlpha = Math.min(1, (nPts - 180) / 40)
      ctx.fillStyle = triCurve.color
      ctx.font = font('bold')
      ctx.textAlign = 'left'
      ctx.fillText(endLabel, toX(nPts - 1) + 6, toY(triPts[triPts.length - 1]) + 4)
      ctx.globalAlpha = 1
    }

    ctx.font = font()
    ctx.textAlign = 'left'
    if (compact) {
      // No gutter room on small canvases: label the threshold inside the plot on a backing plate.
      const text = `G_th = ${THRESHOLD}`
      const x = pad.left + 6
      ctx.fillStyle = 'rgba(13,17,23,0.85)'
      ctx.fillRect(x - 3, thresholdY - 20, ctx.measureText(text).width + 6, 16)
      ctx.fillStyle = 'rgb(251,146,60)'
      ctx.fillText(text, x, thresholdY - 8)
    } else {
      const x = plotRight + 16
      ctx.fillStyle = 'rgb(251,146,60)'
      ctx.fillText(`G_th = ${THRESHOLD} nmol/g`, x, thresholdY + 4)
      ctx.fillText('(microglial activation)', x, thresholdY + 19)

      curves.forEach((curve, i) => {
        const y = pad.top + 6 + i * 18
        ctx.strokeStyle = curve.color
        ctx.lineWidth = curve.bold ? 2.5 : 1.5
        ctx.setLineDash(curve.dash)
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + 22, y)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = curve.bold ? '#ffffff' : 'rgba(255,255,255,0.8)'
        ctx.font = font(curve.bold ? 'bold' : '')
        ctx.fillText(curve.label, x + 28, y + 4)
      })
    }

    if (nPts < N_PTS) {
      ctx.fillStyle = LABEL
      ctx.font = font()
      ctx.fillText(`Day ${Math.round(eased * 365)} / 365`, pad.left, pad.top - 12)
    }
  }

  const tick = ts => {
    if (startTs === null) startTs = ts - progress * DRAW_MS
    progress = Math.min(1, (ts - startTs) / DRAW_MS)
    draw()
    frame = progress < 1 ? window.requestAnimationFrame(tick) : null
  }

  const play = () => {
    if (frame === null && progress < 1) frame = window.requestAnimationFrame(tick)
  }

  const refresh = () => {
    if (disposed) return
    layout()
    if (frame === null) draw()
  }

  refresh()
  const resizeObserver = window.ResizeObserver ? new window.ResizeObserver(refresh) : null
  if (resizeObserver) resizeObserver.observe(canvas)
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh)

  let viewObserver = null
  if (window.IntersectionObserver) {
    viewObserver = new window.IntersectionObserver(
      entries => {
        if (!entries.some(entry => entry.isIntersecting)) return
        viewObserver.disconnect()
        play()
      },
      { threshold: 0.4 }
    )
    viewObserver.observe(canvas)
  } else {
    play()
  }

  return () => {
    disposed = true
    if (frame !== null) window.cancelAnimationFrame(frame)
    if (resizeObserver) resizeObserver.disconnect()
    if (viewObserver) viewObserver.disconnect()
  }
}
