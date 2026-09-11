;(() => {
  'use strict'
  const data = window.PD_PATIENT_EVIDENCE
  if (!data) return
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]))
  const fmt = (value, digits = 2) => value === null ? 'Not observed' : Number(value).toFixed(digits)
  const signed = (value, digits = 2) => (value > 0 ? '+' : '') + fmt(value, digits)
  const age = value => value === null ? '' : value === 0 ? 'Same month' : value + (value === 1 ? ' month old' : ' months old')
  const labels = ['Measured state', 'Frozen forecasts', 'Observed follow-up']
  const caseLabels = ['A / Right-body', 'B / Left-body', 'C / Near-symmetric', 'D / Disagreement']
  const caseNotes = {
    A: 'Lower left putamen binding accompanies greater right-body motor burden. The imaging and examination agree about direction at this visit.',
    B: 'Lower right putamen binding accompanies greater left-body motor burden. This is the opposite directional state to A, not a severity-matched comparison.',
    C: 'Putamen binding is almost symmetric (0.58 versus 0.57), but the paired motor sums are 1 versus 11. A scalar imaging burden cannot explain away this mismatch.',
    D: 'Lower left putamen binding would be compatible with greater right-body burden; the examination instead has greater left-body burden. The disagreement remains visible rather than being forced into a confident label.'
  }
  const futureNotes = {
    A: 'At follow-up the paired motor burden was balanced. Adding signed imaging moved the forecast farther from the observed zero. Clear anatomy at baseline did not guarantee a better forecast.',
    B: 'The observed side balance remained -0.500. The signed forecast was closer than the clinical-only forecast in this record. This is a concrete favorable example, not evidence of clinical utility on its own.',
    C: 'The observed side balance became zero. Signed imaging reduced the point error, but all four point forecasts still favored greater right-body burden. The separate interval spanned the entire scale.',
    D: 'The observed balance became positive. Signed imaging anticipated that direction, but the magnitude-only model had a smaller absolute error. Correct direction and more accurate continuous prediction are different claims.'
  }

  function sourceTable(record) {
    return '<table class="evidence-source-table"><caption class="sr-only">Measurements available at cutoff</caption><tbody>' +
      record.sources.map(s => '<tr><th scope="row">' + escape(s.name) + '</th><td><strong>' +
        escape(s.value === null ? 'Not observed' : s.value) + '</strong><small>' +
        escape([age(s.age), s.role].filter(Boolean).join(' / ')) + '</small></td></tr>').join('') + '</tbody></table>'
  }

  function axes(record) {
    return '<div class="evidence-axes"><h3>Evidence score and reliability</h3>' +
      '<div class="evidence-axis-head"><span>Evidence family</span><span>Score (-1 to 1)</span><span>Weight</span></div>' +
      record.axes.map(a => '<div class="evidence-axis"><span>' + escape(a.name) + '</span>' +
        (a.score === null ? '<span class="evidence-missing">Not scored</span>' :
          '<span><span class="evidence-track" aria-hidden="true" style="display:block"><i class="evidence-dot" style="left:' + ((a.score + 1) * 50) +
          '%"></i></span><span class="evidence-score-text" style="display:block">' + signed(a.score) + '</span></span>') +
        '<b>' + fmt(a.reliability) + '</b></div>').join('') +
      '<p class="evidence-footnote">Relative evidence, not a probability. Weight reflects availability and freshness, not diagnostic confidence.</p></div>'
  }

  function header(record, paper) {
    return '<div class="evidence-record-title"><h3>' + (paper === 'paper1' ? record.id : 'Case ' + record.id) +
      '</h3><span class="evidence-motor">Motor total <strong>' + fmt(record.motor, 0) + '</strong></span></div>' +
      (paper === 'paper1' ? '<p class="evidence-record-note">Prior slope ' + signed(record.slope, 1) +
        ' points/year / ' + record.visits + ' visits over ' + record.span + ' months</p>' : '')
  }

  function trace(record, paper, stage) {
    return '<figure class="evidence-chart" data-history="' + record.id + '" data-paper="' + paper + '" data-stage="' + stage + '">' +
      '<div class="evidence-chart-title">' + (paper === 'paper1' ? 'Measured motor history' : 'Measured side-balance history') + '</div>' +
      '<div class="evidence-plot"></div><figcaption>Month 0 is the cutoff. Dots are actual examinations; lines only connect observations.' +
      (stage < 2 ? ' Follow-up is hidden.' : ' Follow-up is shown at its actual month.') + '</figcaption></figure>'
  }

  function forecasts(record, paper, stage) {
    const digits = paper === 'paper1' ? 1 : 3
    const min = paper === 'paper1' ? -10 : -1
    const max = paper === 'paper1' ? 25 : 1
    const pct = value => Math.max(0, Math.min(100, (value - min) / (max - min) * 100))
    const rows = record.forecasts.map((m, i) =>
      '<tr' + (i === 3 ? ' class="evidence-highlight"' : '') + '><th scope="row">' + escape(m.name) +
      (m.separate ? '*' : '') + '</th><td><div class="evidence-range" aria-hidden="true"><i class="evidence-dot" style="left:' +
      pct(m.value) + '%"></i></div></td><td>' + signed(m.value, digits) + '</td></tr>').join('')
    return '<table class="evidence-forecast"><caption>Held-out forecasts / ' +
      (paper === 'paper1' ? 'motor change, points/year' : 'future signed motor laterality') +
      '</caption><tbody>' + rows + '</tbody></table>' +
      (paper === 'paper1' ? '<p class="evidence-footnote">*Separate representation comparison; these are not additional steps in the main model.</p>' : '') +
      '<div class="evidence-uq"><b>' + escape(record.uq.name) + ': ' + signed(record.uq.center, digits) +
      '</b><br>90% interval [' + signed(record.uq.low, digits) + ', ' + signed(record.uq.high, digits) +
      ']<p class="evidence-footnote">This interval is from a separate model, not a bound around the point forecasts above.</p></div>' +
      (stage === 2 ? '<div class="evidence-future" data-observed>Observed at +' + record.gap +
        ' months: <strong>' + signed(record.observed, digits) + '</strong>' +
        (paper === 'paper1' ? ' points/year<br>Motor total ' + fmt(record.motor, 0) + ' to ' + fmt(record.futureMotor, 0) :
          ' laterality units') + '</div>' : '')
  }

  function bilateral(record) {
    return '<div class="evidence-signs"><div>Signed imaging<strong>' + signed(record.imaging, 3) +
      '</strong></div><div>Signed motor laterality<strong>' + signed(record.baseline, 3) + '</strong></div></div>' +
      '<img class="evidence-anatomy" src="../assets/images/reference_putamen.png" width="1116" height="540" ' +
      'alt="Neutral left and right putamen reference-atlas outlines, not a participant scan">' +
      '<table class="evidence-bilateral"><caption class="sr-only">Actual bilateral measurements</caption>' +
      '<thead><tr><th>Measured at cutoff</th><th>Patient left</th><th>Patient right</th></tr></thead><tbody>' +
      '<tr><th scope="row">Putamen SBR</th><td>' + fmt(record.leftSbr) + '</td><td>' + fmt(record.rightSbr) + '</td></tr>' +
      '<tr><th scope="row">Paired motor sum</th><td>' + fmt(record.leftMotor, 0) + '</td><td>' + fmt(record.rightMotor, 0) +
      '</td></tr></tbody></table><p class="evidence-footnote">Reference geometry, not patient imaging or tracer intensity. ' +
      'The numbers are the actual bilateral measurements. Paired motor sums are not the full MDS-UPDRS III total.</p>'
  }

  function p1(records, stage) {
    const explanation = stage === 0
      ? 'Similar motor totals do not imply the same measured biological state. P1-A has fresh dopaminergic evidence; P1-B has no eligible imaging value and an older lysosomal source. Treatment context also differs, so these records cannot isolate a biological cause.'
      : stage === 1
        ? 'The forecast changes when source values, their timing and the observation process are retained. The evidence coordinates help describe that support, but the study found no extra predictive value from them beyond raw source history.'
        : 'P1-A worsened by 12 motor points over 9 months; P1-B by 8 points over 12 months. All four main point models underestimated both changes. Full source-time history reduced error in these two examples, but the cohort-level increment remained small and failed later-calendar and external transport gates. Neither record warrants clinical deployment.'
    return '<div class="evidence-pair">' + records.map(r => '<article class="evidence-record">' + header(r, 'paper1') +
      (stage === 0 ? sourceTable(r) + axes(r) : '') + trace(r, 'paper1', stage) +
      (stage > 0 ? forecasts(r, 'paper1', stage) : '') + '</article>').join('') + '</div>' +
      '<div class="evidence-explanation"><p>' + explanation + '</p></div>' +
      '<aside class="evidence-verdict" aria-label="Research validity of these forecasts"><h3>Evidence available does not mean forecast trusted</h3>' +
      '<dl><div><dt>Selective uncertainty</dt><dd>ABSTAIN</dd></div>' +
      '<div><dt>Later-calendar added value</dt><dd>Not established</dd></div>' +
      '<div><dt>External transport</dt><dd>Failed promotion</dd></div></dl>' +
      '<p>These are cohort-level tests of the forecasting method, not diagnoses or pass/fail labels for P1-A and P1-B. ' +
      'Neither case is promoted to a clinical decision. <a href="#gate-summary">All seven validity gates</a>.</p></aside>'
  }

  function p2(record, stage) {
    return '<article class="evidence-record">' + header(record, 'paper2') +
      '<p class="evidence-record-note">' + caseNotes[record.id] + '</p><div class="evidence-detail-grid">' +
      (stage === 0 ? '<div>' + bilateral(record) + '</div><div><h3>Source evidence at the cutoff</h3>' + sourceTable(record) +
        '<p class="evidence-footnote">SAA, MoCA and CSF annotate the record; they did not enter these focused forecasts.</p></div>' :
        '<div>' + trace(record, 'paper2', stage) + '<p class="evidence-footnote">The target is continuous motor side-balance, not total disease severity.</p></div><div>' +
        forecasts(record, 'paper2', stage) + '</div>') + '</div>' +
      (stage === 0 ? trace(record, 'paper2', stage) : '') +
      '<div class="evidence-explanation"><p>' + (stage === 2 ? futureNotes[record.id] :
        stage === 1 ? 'All forecasts are held out at participant level. Imaging adds a small amount of cohort-level information; it does not establish why this person will change, or which treatment would help.' :
        'The contribution is a direction-preserving description of biological evidence. Agreement, near-symmetry and conflict remain distinct states; none is a calibrated diagnosis.') + '</p></div></article>'
  }

  function drawHistory(holder, record, paper, stage) {
    const width = Math.max(260, Math.floor(holder.getBoundingClientRect().width))
    const height = 236, left = 44, right = width - 18, top = 23, bottom = 189
    const x = value => left + (value + 24) / 40 * (right - left)
    const max = paper === 'paper1' ? 30 : 1
    const min = paper === 'paper1' ? 0 : -1
    const y = value => bottom - (value - min) / (max - min) * (bottom - top)
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height)
    svg.setAttribute('role', 'img')
    const described = record.history.map(p => 'month ' + p.month + ': ' + p.value).join('; ')
    svg.setAttribute('aria-label', 'Measured history for ' + record.id + '. ' + described +
      (stage === 2 ? '; follow-up at month ' + record.gap + ': ' + (paper === 'paper1' ? record.futureMotor : record.observed) : '. Future hidden.'))
    const el = (tag, attrs, text) => {
      const node = document.createElementNS(svg.namespaceURI, tag)
      Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value))
      if (text !== undefined) node.textContent = text
      svg.append(node)
    }
    el('rect', {x: x(0), y: top, width: right - x(0), height: bottom - top, fill: '#f1f4f4'})
    const yticks = paper === 'paper1' ? [0, 10, 20, 30] : [-1, 0, 1]
    yticks.forEach(t => {
      el('line', {x1: left, x2: right, y1: y(t), y2: y(t), stroke: '#dce2e4'})
      el('text', {x: left - 10, y: y(t) + 4, 'text-anchor': 'end', fill: '#5e6a72', 'font-size': 13}, t)
    })
    ;[-24, -12, 0, 12].forEach(t => el('text', {x: x(t), y: bottom + 23, 'text-anchor': 'middle', fill: '#5e6a72', 'font-size': 13}, t > 0 ? '+' + t : t))
    el('text', {x: left, y: 13, fill: '#5e6a72', 'font-size': 12}, paper === 'paper1' ? 'MDS-UPDRS III total' : 'Signed motor laterality')
    el('text', {x: (left + right) / 2, y: height - 3, fill: '#5e6a72', 'font-size': 12, 'text-anchor': 'middle'}, 'Months from cutoff')
    el('line', {x1: x(0), x2: x(0), y1: top, y2: bottom, stroke: '#637078', 'stroke-dasharray': '4 4'})
    el('polyline', {points: record.history.map(p => x(p.month) + ',' + y(p.value)).join(' '), fill: 'none', stroke: '#346d70', 'stroke-width': 2})
    record.history.forEach(p => el('circle', {cx: x(p.month), cy: y(p.value), r: 4, fill: '#fff', stroke: '#346d70', 'stroke-width': 2}))
    if (stage === 2) {
      const value = paper === 'paper1' ? record.futureMotor : record.observed
      el('circle', {cx: x(record.gap), cy: y(value), r: 5, fill: '#984a43', stroke: '#fff', 'stroke-width': 1})
      el('text', {x: x(record.gap) - 7, y: y(value) - 12, 'text-anchor': 'end', fill: '#784239', 'font-size': 13}, fmt(value, paper === 'paper1' ? 0 : 2))
    } else {
      el('text', {x: x(0) + 9, y: top + 18, fill: '#6a777e', 'font-size': 12}, 'Future hidden')
    }
    holder.replaceChildren(svg)
  }

  document.querySelectorAll('[data-patient-explorer]').forEach(root => {
    const paper = root.dataset.patientExplorer
    const records = data[paper]
    let stage = 0, selected = 0, timer = null
    root.innerHTML = (paper === 'paper2' ? '<div class="evidence-cases" role="tablist" aria-label="Patient record">' +
      records.map((r, i) => '<button class="evidence-tab" role="tab" id="record-' + r.id + '" aria-controls="patient-record-panel" data-record="' + i +
        '" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '">' + caseLabels[i] + '</button>').join('') + '</div>' : '') +
      '<div class="evidence-controls"><div class="evidence-stages" role="tablist" aria-label="Evidence stage">' +
      labels.map((l, i) => '<button class="evidence-tab" role="tab" id="stage-' + i + '" aria-controls="evidence-stage-panel" data-stage-index="' + i +
        '" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '">' + l + '</button>').join('') +
      '</div><div class="evidence-icon-tools"><button class="evidence-icon" data-replay aria-label="Replay evidence sequence" title="Replay evidence sequence" aria-pressed="false">' +
      '<img src="../assets/icons/play.svg" alt=""></button><button class="evidence-icon" data-reset aria-label="Reset to measured state" title="Reset to measured state">' +
      '<img src="../assets/icons/rotate-ccw.svg" alt=""></button></div></div>' +
      '<p class="evidence-stage-summary" role="status" aria-live="polite"></p>' +
      (paper === 'paper2' ? '<div id="patient-record-panel" role="tabpanel" aria-labelledby="record-A">' : '') +
      '<div id="evidence-stage-panel" role="tabpanel" aria-labelledby="stage-0" tabindex="0"></div>' +
      (paper === 'paper2' ? '</div>' : '')
    const panel = root.querySelector('#evidence-stage-panel')
    const play = root.querySelector('[data-replay]')
    function stop() {
      clearTimeout(timer)
      timer = null
      play.setAttribute('aria-pressed', 'false')
      play.setAttribute('aria-label', 'Replay evidence sequence')
      play.title = 'Replay evidence sequence'
      play.querySelector('img').src = '../assets/icons/play.svg'
    }
    function charts() {
      panel.querySelectorAll('[data-history]').forEach(figure => {
        const record = records.find(r => r.id === figure.dataset.history)
        drawHistory(figure.querySelector('.evidence-plot'), record, paper, stage)
      })
    }
    function render() {
      root.querySelectorAll('[data-stage-index]').forEach((button, i) => {
        button.setAttribute('aria-selected', String(stage === i))
        button.tabIndex = stage === i ? 0 : -1
      })
      root.querySelectorAll('[data-record]').forEach((button, i) => {
        button.setAttribute('aria-selected', String(selected === i))
        button.tabIndex = selected === i ? 0 : -1
      })
      panel.setAttribute('aria-labelledby', 'stage-' + stage)
      if (paper === 'paper2') root.querySelector('#patient-record-panel').setAttribute('aria-labelledby', 'record-' + records[selected].id)
      root.querySelector('[role="status"]').textContent = [
        'At the cutoff: only measurements already available. No future examination is shown.',
        'Predictions made without this participant in training. Follow-up remains hidden.',
        'Retrospective evaluation: the later examination is now visible. It was not a model input.'
      ][stage]
      panel.innerHTML = paper === 'paper1' ? p1(records, stage) : p2(records[selected], stage)
      charts()
    }
    function wireTabs(selector, choose) {
      const tabs = [...root.querySelectorAll(selector)]
      tabs.forEach((button, i) => {
        button.addEventListener('click', () => { stop(); choose(i); render() })
        button.addEventListener('keydown', event => {
          let next
          if (event.key === 'ArrowRight') next = (i + 1) % tabs.length
          if (event.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length
          if (event.key === 'Home') next = 0
          if (event.key === 'End') next = tabs.length - 1
          if (next === undefined) return
          event.preventDefault()
          tabs[next].focus()
          tabs[next].click()
        })
      })
    }
    wireTabs('[data-stage-index]', i => { stage = i })
    wireTabs('[data-record]', i => { selected = i; stage = 0 })
    root.querySelector('[data-reset]').addEventListener('click', () => { stop(); stage = 0; render() })
    play.addEventListener('click', () => {
      if (timer !== null) { stop(); return }
      if (stage === 2) stage = 0
      render()
      play.setAttribute('aria-pressed', 'true')
      play.setAttribute('aria-label', 'Pause evidence sequence')
      play.title = 'Pause evidence sequence'
      play.querySelector('img').src = '../assets/icons/pause.svg'
      const advance = () => {
        stage += 1
        render()
        if (stage === 2) stop()
        else timer = setTimeout(advance, 4000)
      }
      timer = setTimeout(advance, 4000)
    })
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop() })
    window.addEventListener('pagehide', stop)
    new ResizeObserver(charts).observe(root)
    render()
  })
})()
