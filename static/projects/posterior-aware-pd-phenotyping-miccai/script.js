const STATES = [
  { id: 'M0', label: 'Mod-Trem', color: '#bf5700' },
  { id: 'M1', label: 'Sev-Trem', color: '#d89a2b' },
  { id: 'M2', label: 'Mild-Ax', color: '#087f83' },
  { id: 'M3', label: 'Sev-Ax', color: '#5f8d3e' },
  { id: 'M4', label: 'Mod-Mix', color: '#8a8175' },
]

const PRESETS = {
  textbook: [4, 2, 90, 3, 1],
  chimera: [2, 4, 55, 36, 3],
  mixed: [23, 19, 22, 20, 16],
}

const sliders = Array.from(document.querySelectorAll('[data-state]'))
const barStack = document.querySelector('#barStack')
const tierLabel = document.querySelector('#tierLabel')
const dominantState = document.querySelector('#dominantState')
const gapValue = document.querySelector('#gapValue')
const entropyValue = document.querySelector('#entropyValue')
const canvas = document.querySelector('#posteriorCanvas')
const ctx = canvas.getContext('2d')
const configCanvas = document.querySelector('#configCanvas')
const configCtx = configCanvas.getContext('2d')

let normalized = [0, 0, 1, 0, 0]
let animationFrame = 0
let selectedConfig = null
let configLookup = new Map()

function normalize(values) {
  const total = values.reduce((sum, value) => sum + value, 0)
  if (total <= 0) return values.map(() => 1 / values.length)
  return values.map(value => value / total)
}

function entropy(values) {
  return values.reduce((sum, value) => {
    if (value <= 0) return sum
    return sum - value * Math.log(value)
  }, 0)
}

function classify(values) {
  const sorted = [...values].sort((a, b) => b - a)
  const max = sorted[0]
  if (max > 0.8) return 'Textbook'
  if (max > 0.5) return 'Chimera'
  return 'Ambiguous'
}

function readSliderValues() {
  return normalize(sliders.map(slider => Number(slider.value)))
}

function renderBars(values) {
  barStack.replaceChildren()

  values.forEach((value, index) => {
    const state = STATES[index]
    const row = document.createElement('div')
    row.className = 'prob-row'

    const label = document.createElement('strong')
    label.textContent = `${state.id} · ${state.label}`

    const track = document.createElement('div')
    track.className = 'prob-track'
    const fill = document.createElement('div')
    fill.className = 'prob-fill'
    fill.style.background = state.color
    fill.style.width = `${Math.round(value * 100)}%`
    track.append(fill)

    const number = document.createElement('span')
    number.textContent = value.toFixed(2)

    row.append(label, track, number)
    barStack.append(row)
  })
}

function updateExplorer() {
  normalized = readSliderValues()
  const sorted = [...normalized].sort((a, b) => b - a)
  const max = sorted[0]
  const gap = sorted[0] - sorted[1]
  const maxIndex = normalized.indexOf(max)

  tierLabel.textContent = classify(normalized)
  dominantState.textContent = `${STATES[maxIndex].id} · ${STATES[maxIndex].label}`
  gapValue.textContent = gap.toFixed(2)
  entropyValue.textContent = entropy(normalized).toFixed(2)
  renderBars(normalized)
}

function applyPreset(name) {
  const values = PRESETS[name]
  if (!values) return
  sliders.forEach((slider, index) => {
    slider.value = values[index]
  })
  document.querySelectorAll('.preset').forEach(button => {
    button.classList.toggle('is-active', button.dataset.preset === name)
  })
  updateExplorer()
}

function sizeCanvas() {
  const ratio = window.devicePixelRatio || 1
  let rect = canvas.getBoundingClientRect()
  canvas.width = Math.max(1, Math.floor(rect.width * ratio))
  canvas.height = Math.max(1, Math.floor(rect.height * ratio))
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)

  rect = configCanvas.getBoundingClientRect()
  configCanvas.width = Math.max(1, Math.floor(rect.width * ratio))
  configCanvas.height = Math.max(1, Math.floor(rect.height * ratio))
  configCtx.setTransform(ratio, 0, 0, ratio, 0, 0)
}

function drawPosteriorCanvas(time) {
  const rect = canvas.getBoundingClientRect()
  const width = rect.width
  const height = rect.height
  ctx.clearRect(0, 0, width, height)

  const centerX = width * 0.5
  const centerY = height * 0.5
  const radius = Math.min(width, height) * 0.32

  ctx.lineWidth = 1
  ctx.strokeStyle = 'rgba(24, 33, 38, 0.12)'
  for (let i = 0; i < STATES.length; i += 1) {
    const angle = (Math.PI * 2 * i) / STATES.length - Math.PI / 2
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  for (let i = 0; i < STATES.length; i += 1) {
    const next = (i + 1) % STATES.length
    const angleA = (Math.PI * 2 * i) / STATES.length - Math.PI / 2
    const angleB = (Math.PI * 2 * next) / STATES.length - Math.PI / 2
    const weight = (normalized[i] + normalized[next]) / 2
    ctx.strokeStyle = `${STATES[i].color}${Math.round(45 + weight * 120)
      .toString(16)
      .padStart(2, '0')}`
    ctx.lineWidth = 1.5 + weight * 9
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * (0.72 + weight * 0.28), angleA, angleB)
    ctx.stroke()
  }

  STATES.forEach((state, index) => {
    const angle = (Math.PI * 2 * index) / STATES.length - Math.PI / 2
    const pulse = 1 + Math.sin(time / 520 + index) * 0.08
    const value = normalized[index]
    const nodeRadius = (10 + value * 38) * pulse
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius

    ctx.beginPath()
    ctx.fillStyle = `${state.color}1f`
    ctx.arc(x, y, nodeRadius * 1.7, 0, Math.PI * 2)
    ctx.fill()

    ctx.beginPath()
    ctx.fillStyle = state.color
    ctx.arc(x, y, nodeRadius, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.font = '700 12px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(state.id, x, y)
  })

  const dominant = normalized.indexOf(Math.max(...normalized))
  ctx.fillStyle = STATES[dominant].color
  ctx.font = '800 16px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(classify(normalized), centerX, centerY)

  drawConfigCanvas(time)
  animationFrame = requestAnimationFrame(drawPosteriorCanvas)
}

function fmt(value, digits = 3) {
  if (value === null || value === undefined || Number.isNaN(value)) return '--'
  if (typeof value === 'boolean') return value ? 'yes' : 'no'
  if (typeof value === 'number') return value.toFixed(digits).replace(/\.?0+$/, '')
  return String(value)
}

function configKey(config) {
  return [
    config.n_components,
    config.covariance_type,
    config.weight_concentration_prior_type,
    config.weight_concentration_prior,
    config.mean_precision_prior,
  ].join('|')
}

function setupConfigExplorer() {
  const data = window.BGMM_CONFIG_DATA
  if (!data || !data.configs) return

  const controls = {
    k: document.querySelector('#configK'),
    kLabel: document.querySelector('#configKLabel'),
    covariance: document.querySelector('#configCovariance'),
    priorType: document.querySelector('#configPriorType'),
    alpha: document.querySelector('#configAlpha'),
    alphaLabel: document.querySelector('#configAlphaLabel'),
    meanPrecision: document.querySelector('#configMeanPrecision'),
    meanPrecisionLabel: document.querySelector('#configMeanPrecisionLabel'),
    proceedings: document.querySelector('#configProceedings'),
    artifactBest: document.querySelector('#configArtifactBest'),
  }

  const options = data.options
  const kOptions = options.n_components
  const alphaOptions = options.weight_concentration_prior
  const precisionOptions = options.mean_precision_prior

  configLookup = new Map(data.configs.map(row => [configKey(row), row]))

  controls.k.max = String(kOptions.length - 1)
  controls.alpha.max = String(alphaOptions.length - 1)
  controls.meanPrecision.max = String(precisionOptions.length - 1)

  options.covariance_type.forEach(value => {
    const option = document.createElement('option')
    option.value = value
    option.textContent = value
    controls.covariance.append(option)
  })

  options.weight_concentration_prior_type.forEach(value => {
    const option = document.createElement('option')
    option.value = value
    option.textContent = value.replaceAll('_', ' ')
    controls.priorType.append(option)
  })

  function setControlsFromConfig(config, activeButton = null) {
    controls.k.value = String(kOptions.indexOf(config.n_components))
    controls.covariance.value = config.covariance_type
    controls.priorType.value = config.weight_concentration_prior_type
    controls.alpha.value = String(alphaOptions.indexOf(config.weight_concentration_prior))
    controls.meanPrecision.value = String(precisionOptions.indexOf(config.mean_precision_prior))
    document.querySelectorAll('.config-controls .preset').forEach(button => {
      button.classList.toggle('is-active', button === activeButton)
    })
    updateConfigFromControls()
  }

  function updateConfigFromControls() {
    const desired = {
      n_components: kOptions[Number(controls.k.value)],
      covariance_type: controls.covariance.value,
      weight_concentration_prior_type: controls.priorType.value,
      weight_concentration_prior: alphaOptions[Number(controls.alpha.value)],
      mean_precision_prior: precisionOptions[Number(controls.meanPrecision.value)],
    }
    selectedConfig = configLookup.get(configKey(desired))

    controls.kLabel.textContent = desired.n_components
    controls.alphaLabel.textContent = desired.weight_concentration_prior
    controls.meanPrecisionLabel.textContent = desired.mean_precision_prior
    renderConfigReadout(selectedConfig)
  }

  const defaultConfig = data.metadata.default_config
  const defaultRow = configLookup.get(configKey(defaultConfig)) || data.configs[0]
  const artifactRow =
    data.configs.find(row => row.config_id === data.metadata.artifact_best_config_id) ||
    data.configs[0]

  ;[
    controls.k,
    controls.covariance,
    controls.priorType,
    controls.alpha,
    controls.meanPrecision,
  ].forEach(control => {
    control.addEventListener('input', () => {
      document
        .querySelectorAll('.config-controls .preset')
        .forEach(button => button.classList.remove('is-active'))
      updateConfigFromControls()
    })
  })

  controls.proceedings.addEventListener('click', () =>
    setControlsFromConfig(defaultRow, controls.proceedings)
  )
  controls.artifactBest.addEventListener('click', () =>
    setControlsFromConfig(artifactRow, controls.artifactBest)
  )
  setControlsFromConfig(defaultRow, controls.proceedings)
}

function renderConfigReadout(row) {
  if (!row) return
  document.querySelector('#configId').textContent = row.config_id
  document.querySelector('#configStatus').textContent = row.status
  document.querySelector('#configEffectiveK').textContent = row.effective_k
  document.querySelector('#configSilhouette').textContent = fmt(row.silhouette, 3)
  document.querySelector('#configHighConfidence').textContent =
    `${fmt(row.pct_high_confidence, 2)}%`
  const mixed = (row.pct_mixed_pathology || 0) + (row.pct_ambiguous || 0)
  document.querySelector('#configMixed').textContent = `${fmt(mixed, 2)}%`

  const strip = document.querySelector('#configWeights')
  strip.replaceChildren()
  ;(row.weights_top5 || []).forEach((weight, index) => {
    const state = STATES[index % STATES.length]
    const rowNode = document.createElement('div')
    rowNode.className = 'component-row'

    const label = document.createElement('strong')
    label.textContent = `Component ${index + 1}`

    const track = document.createElement('div')
    track.className = 'component-track'
    const fill = document.createElement('div')
    fill.className = 'component-fill'
    fill.style.width = `${Math.max(1, weight * 100)}%`
    fill.style.background = state.color
    track.append(fill)

    const number = document.createElement('span')
    number.textContent = `${fmt(weight * 100, 1)}%`

    rowNode.append(label, track, number)
    strip.append(rowNode)
  })
}

function drawConfigCanvas(time) {
  if (!selectedConfig) return
  const rect = configCanvas.getBoundingClientRect()
  const width = rect.width
  const height = rect.height
  configCtx.clearRect(0, 0, width, height)

  const high = (selectedConfig.pct_high_confidence || 0) / 100
  const mixed =
    ((selectedConfig.pct_mixed_pathology || 0) + (selectedConfig.pct_ambiguous || 0)) / 100
  const entropyLevel = Math.min(1, (selectedConfig.mean_posterior_entropy || 0) / 0.45)
  const silhouetteLevel = Math.max(0, Math.min(1, (selectedConfig.silhouette || 0) / 0.28))
  const activeK = Math.max(1, selectedConfig.effective_k || 1)
  const candidateK = selectedConfig.n_components || activeK
  const stride = 0.85 + activeK * 0.08
  const phase = time / 520

  drawConfigGrid(width, height)
  drawAnimatedSkeleton(
    width * 0.26,
    height * 0.61,
    Math.min(width, height) * 0.24,
    phase,
    stride,
    mixed
  )
  drawBrainPanel(
    width * 0.69,
    height * 0.48,
    Math.min(width, height) * 0.26,
    activeK,
    candidateK,
    high,
    entropyLevel,
    silhouetteLevel,
    phase
  )
  drawDiagnosticRibbons(width, height, selectedConfig.weights_top5 || [], phase)
}

function drawConfigGrid(width, height) {
  configCtx.save()
  configCtx.strokeStyle = 'rgba(255,255,255,0.045)'
  configCtx.lineWidth = 1
  for (let x = 0; x < width; x += 34) {
    configCtx.beginPath()
    configCtx.moveTo(x, 0)
    configCtx.lineTo(x, height)
    configCtx.stroke()
  }
  for (let y = 0; y < height; y += 34) {
    configCtx.beginPath()
    configCtx.moveTo(0, y)
    configCtx.lineTo(width, y)
    configCtx.stroke()
  }
  configCtx.restore()
}

function drawAnimatedSkeleton(cx, cy, scale, phase, stride, uncertainty) {
  const sway = Math.sin(phase) * scale * 0.025 + uncertainty * scale * 0.08
  const hip = { x: cx + sway, y: cy }
  const spine = { x: cx + sway * 0.45, y: cy - scale * 0.38 }
  const neck = { x: spine.x, y: spine.y - scale * 0.14 }
  const head = { x: neck.x, y: neck.y - scale * 0.14 }
  const shoulderL = { x: spine.x - scale * 0.16, y: spine.y + scale * 0.02 }
  const shoulderR = { x: spine.x + scale * 0.16, y: spine.y + scale * 0.02 }
  const hipL = { x: hip.x - scale * 0.12, y: hip.y }
  const hipR = { x: hip.x + scale * 0.12, y: hip.y }

  const armSwing = Math.sin(phase) * scale * 0.16 * stride
  const legSwing = Math.sin(phase + Math.PI) * scale * 0.18 * stride
  const handTremor = Math.sin(phase * 9) * scale * 0.018 * (0.2 + uncertainty * 1.5)

  const elbowL = { x: shoulderL.x - scale * 0.08, y: shoulderL.y + scale * 0.26 + armSwing * 0.2 }
  const handL = { x: elbowL.x - scale * 0.06 + handTremor, y: elbowL.y + scale * 0.28 + armSwing }
  const elbowR = { x: shoulderR.x + scale * 0.08, y: shoulderR.y + scale * 0.26 - armSwing * 0.2 }
  const handR = { x: elbowR.x + scale * 0.06 - handTremor, y: elbowR.y + scale * 0.28 - armSwing }
  const kneeL = { x: hipL.x - scale * 0.08, y: hipL.y + scale * 0.32 + legSwing * 0.25 }
  const footL = { x: kneeL.x + legSwing, y: kneeL.y + scale * 0.34 }
  const kneeR = { x: hipR.x + scale * 0.08, y: hipR.y + scale * 0.32 - legSwing * 0.25 }
  const footR = { x: kneeR.x - legSwing, y: kneeR.y + scale * 0.34 }

  configCtx.save()
  configCtx.lineCap = 'round'
  configCtx.lineJoin = 'round'
  configCtx.strokeStyle = 'rgba(255,255,255,0.58)'
  configCtx.lineWidth = Math.max(2, scale * 0.02)

  ;[
    [head, neck],
    [neck, spine],
    [spine, hip],
    [shoulderL, shoulderR],
    [shoulderL, elbowL],
    [elbowL, handL],
    [shoulderR, elbowR],
    [elbowR, handR],
    [hipL, hipR],
    [hipL, kneeL],
    [kneeL, footL],
    [hipR, kneeR],
    [kneeR, footR],
  ].forEach(([a, b]) => {
    configCtx.beginPath()
    configCtx.moveTo(a.x, a.y)
    configCtx.lineTo(b.x, b.y)
    configCtx.stroke()
  })

  const joints = [
    head,
    neck,
    spine,
    hip,
    shoulderL,
    shoulderR,
    elbowL,
    elbowR,
    handL,
    handR,
    hipL,
    hipR,
    kneeL,
    kneeR,
    footL,
    footR,
  ]
  joints.forEach((joint, index) => {
    const color = index < 4 ? '#087f83' : index < 10 ? '#bf5700' : '#5f8d3e'
    configCtx.fillStyle = color
    configCtx.beginPath()
    configCtx.arc(joint.x, joint.y, Math.max(3, scale * 0.022), 0, Math.PI * 2)
    configCtx.fill()
  })

  configCtx.strokeStyle = `rgba(191,87,0,${0.2 + uncertainty * 0.6})`
  configCtx.lineWidth = 1.3
  ;[handL, handR].forEach(hand => {
    for (let i = 1; i <= 3; i += 1) {
      configCtx.beginPath()
      configCtx.arc(hand.x, hand.y, scale * (0.055 + i * 0.028), -0.8, 0.9)
      configCtx.stroke()
    }
  })

  configCtx.strokeStyle = 'rgba(8,127,131,0.55)'
  configCtx.setLineDash([6, 7])
  configCtx.beginPath()
  configCtx.moveTo(cx - scale * 0.5, cy + scale * 0.72)
  configCtx.bezierCurveTo(
    cx - scale * 0.2,
    cy + scale * 0.82,
    cx + scale * 0.18,
    cy + scale * 0.62,
    cx + scale * 0.52,
    cy + scale * 0.72
  )
  configCtx.stroke()
  configCtx.restore()
}

function drawBrainPanel(
  cx,
  cy,
  scale,
  activeK,
  candidateK,
  high,
  entropyLevel,
  silhouetteLevel,
  phase
) {
  configCtx.save()
  configCtx.translate(cx, cy)
  configCtx.lineWidth = 2
  configCtx.strokeStyle = 'rgba(255,255,255,0.42)'
  configCtx.fillStyle = 'rgba(255,255,255,0.08)'
  configCtx.beginPath()
  configCtx.ellipse(0, 0, scale * 0.86, scale * 0.58, -0.08, 0, Math.PI * 2)
  configCtx.fill()
  configCtx.stroke()

  const regionColors = ['#bf5700', '#087f83', '#5f8d3e', '#d89a2b', '#8a8175']
  const regions = [
    [-0.2, 0.03, 0.28, 0.14],
    [0.18, 0.03, 0.28, 0.14],
    [-0.05, -0.17, 0.18, 0.1],
    [0.28, -0.2, 0.16, 0.11],
    [-0.34, -0.18, 0.16, 0.11],
  ]

  regions.forEach((region, index) => {
    const [x, y, rx, ry] = region
    const active = index < activeK
    configCtx.fillStyle = active
      ? `${regionColors[index]}${Math.round(80 + high * 120)
          .toString(16)
          .padStart(2, '0')}`
      : 'rgba(255,255,255,0.08)'
    configCtx.beginPath()
    configCtx.ellipse(x * scale, y * scale, rx * scale, ry * scale, 0.15 * index, 0, Math.PI * 2)
    configCtx.fill()
  })

  for (let i = 0; i < candidateK; i += 1) {
    const angle = (Math.PI * 2 * i) / candidateK + phase * 0.08
    const r = scale * (0.74 + Math.sin(phase + i) * 0.02)
    const active = i < activeK
    configCtx.fillStyle = active ? regionColors[i % regionColors.length] : 'rgba(255,255,255,0.18)'
    configCtx.beginPath()
    configCtx.arc(Math.cos(angle) * r, Math.sin(angle) * r * 0.72, active ? 5 : 2.5, 0, Math.PI * 2)
    configCtx.fill()
  }

  configCtx.strokeStyle = `rgba(216,154,43,${0.18 + silhouetteLevel * 0.58})`
  configCtx.lineWidth = 2 + silhouetteLevel * 4
  configCtx.beginPath()
  configCtx.moveTo(-scale * 0.42, scale * 0.2)
  configCtx.bezierCurveTo(
    -scale * 0.1,
    scale * 0.46,
    scale * 0.24,
    scale * 0.42,
    scale * 0.48,
    scale * 0.18
  )
  configCtx.stroke()

  configCtx.strokeStyle = `rgba(244,186,121,${0.16 + entropyLevel * 0.54})`
  configCtx.lineWidth = 1.2
  for (let i = 0; i < 6; i += 1) {
    configCtx.beginPath()
    configCtx.ellipse(
      0,
      0,
      scale * (0.48 + i * 0.075 + entropyLevel * 0.08),
      scale * (0.34 + i * 0.04),
      0,
      0,
      Math.PI * 2
    )
    configCtx.stroke()
  }
  configCtx.restore()
}

function drawDiagnosticRibbons(width, height, weights, phase) {
  const x0 = width * 0.38
  const x1 = width * 0.56
  const y0 = height * 0.63
  const colors = ['#bf5700', '#d89a2b', '#087f83', '#5f8d3e', '#8a8175']
  weights.slice(0, 5).forEach((weight, index) => {
    configCtx.strokeStyle = `${colors[index]}aa`
    configCtx.lineWidth = 1 + weight * 16
    configCtx.beginPath()
    const y = y0 - index * height * 0.055 + Math.sin(phase + index) * 5
    configCtx.moveTo(x0, y)
    configCtx.bezierCurveTo(x0 + width * 0.07, y - 35, x1 - width * 0.08, y + 35, x1, y - 8)
    configCtx.stroke()
  })
}

function animateMetrics() {
  const metrics = document.querySelectorAll('[data-count]')
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        const node = entry.target
        const target = Number(node.dataset.count)
        const suffix = node.textContent.includes('%') ? '%' : ''
        const start = performance.now()

        function tick(now) {
          const progress = Math.min(1, (now - start) / 900)
          const eased = 1 - Math.pow(1 - progress, 3)
          const value = target * eased
          node.textContent =
            target >= 100 ? Math.round(value).toLocaleString() : `${value.toFixed(1)}${suffix}`
          if (progress < 1) requestAnimationFrame(tick)
        }

        requestAnimationFrame(tick)
        observer.unobserve(node)
      })
    },
    { threshold: 0.45 }
  )

  metrics.forEach(metric => observer.observe(metric))
}

function revealOnScroll() {
  const nodes = document.querySelectorAll(
    '.section, .metric-band, .gallery-card, .story-steps article'
  )
  nodes.forEach(node => node.classList.add('reveal'))

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('is-visible')
      })
    },
    { threshold: 0.12 }
  )

  nodes.forEach(node => observer.observe(node))
}

function setupDialog() {
  const dialog = document.querySelector('#figureDialog')
  const dialogImage = document.querySelector('#dialogImage')
  const dialogCaption = document.querySelector('#dialogCaption')
  const closeButton = document.querySelector('#dialogClose')

  document.querySelectorAll('.gallery-card img').forEach(image => {
    image.addEventListener('click', () => {
      dialogImage.src = image.src
      dialogImage.alt = image.alt
      dialogCaption.textContent = image.closest('figure').querySelector('figcaption').innerText
      dialog.showModal()
    })
  })

  closeButton.addEventListener('click', () => dialog.close())
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect()
    const outside =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    if (outside) dialog.close()
  })
}

sliders.forEach(slider => slider.addEventListener('input', updateExplorer))
document.querySelectorAll('[data-preset]').forEach(button => {
  button.addEventListener('click', () => applyPreset(button.dataset.preset))
})

window.addEventListener('resize', sizeCanvas)
sizeCanvas()
updateExplorer()
setupConfigExplorer()
drawPosteriorCanvas(0)
animateMetrics()
revealOnScroll()
setupDialog()

window.addEventListener('pagehide', () => cancelAnimationFrame(animationFrame))
