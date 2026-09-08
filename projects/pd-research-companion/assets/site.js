;(() => {
  const tabs = Array.from(document.querySelectorAll('[data-case-target]'))
  const panels = Array.from(document.querySelectorAll('[data-case-panel]'))

  function activateCase(tab) {
    const target = tab.dataset.caseTarget
    tabs.forEach(item => {
      const active = item === tab
      item.setAttribute('aria-selected', String(active))
      item.tabIndex = active ? 0 : -1
    })
    panels.forEach(panel => {
      panel.hidden = panel.id !== target
    })
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateCase(tab))
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        return
      }
      event.preventDefault()
      let nextIndex = index
      if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length
      if (event.key === 'Home') nextIndex = 0
      if (event.key === 'End') nextIndex = tabs.length - 1
      tabs[nextIndex].focus()
      activateCase(tabs[nextIndex])
    })
  })

  const figureButtons = Array.from(document.querySelectorAll('[data-figure-open]'))
  if (!figureButtons.length || typeof HTMLDialogElement === 'undefined') {
    return
  }

  const dialog = document.createElement('dialog')
  dialog.className = 'figure-dialog'
  dialog.setAttribute('aria-label', 'Full-resolution scientific figure')
  dialog.innerHTML = [
    '<div class="dialog-toolbar">',
    '  <span class="dialog-title"></span>',
    '  <div class="dialog-tools">',
    '    <button class="dialog-zoom" type="button" aria-pressed="false">Actual size</button>',
    '    <button class="dialog-close" type="button" aria-label="Close full-resolution figure">&times;</button>',
    '  </div>',
    '</div>',
    '<div class="dialog-canvas"><img alt="" /></div>',
  ].join('')
  document.body.append(dialog)

  const dialogTitle = dialog.querySelector('.dialog-title')
  const dialogImage = dialog.querySelector('img')
  const dialogCanvas = dialog.querySelector('.dialog-canvas')
  const zoomButton = dialog.querySelector('.dialog-zoom')
  const closeButton = dialog.querySelector('.dialog-close')

  function closeDialog() {
    dialog.close()
  }

  figureButtons.forEach(button => {
    button.addEventListener('click', () => {
      const source = button.dataset.figureOpen
      const title = button.dataset.figureTitle || 'Scientific figure'
      dialogTitle.textContent = title
      dialogImage.src = source
      dialogImage.alt = title
      dialog.classList.remove('figure-dialog--actual')
      zoomButton.setAttribute('aria-pressed', 'false')
      zoomButton.textContent = 'Actual size'
      dialog.showModal()
      document.body.classList.add('dialog-open')
      closeButton.focus()
    })
  })

  zoomButton.addEventListener('click', () => {
    const actual = dialog.classList.toggle('figure-dialog--actual')
    zoomButton.setAttribute('aria-pressed', String(actual))
    zoomButton.textContent = actual ? 'Fit to screen' : 'Actual size'
    dialogCanvas.scrollTo({ top: 0, left: 0 })
  })

  closeButton.addEventListener('click', closeDialog)
  dialog.addEventListener('click', event => {
    if (event.target === dialog) closeDialog()
  })
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open')
    dialog.classList.remove('figure-dialog--actual')
    dialogImage.removeAttribute('src')
  })
})()
