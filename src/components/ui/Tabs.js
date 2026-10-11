import * as React from 'react'
import PropTypes from 'prop-types'
import { useScrollStrip } from './useScrollStrip'
import './Tabs.css'

const idPart = value =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const tabId = (idBase, value) => `${idBase}-tab-${idPart(value)}`

export const tabPanelId = idBase => `${idBase}-panel`

/** Props for the one panel a tablist controls: spread them on the element that holds the content. */
export const tabPanelProps = (idBase, value) => ({
  role: 'tabpanel',
  id: tabPanelId(idBase),
  'aria-labelledby': tabId(idBase, value),
  tabIndex: 0,
})

// Index an arrow/Home/End key moves to (wrapping), or -1 for any other key.
export const nextTabIndex = (key, index, count, orientation = 'horizontal') => {
  if (count < 1) return -1
  const vertical = orientation === 'vertical'
  if (key === (vertical ? 'ArrowDown' : 'ArrowRight')) return (index + 1) % count
  if (key === (vertical ? 'ArrowUp' : 'ArrowLeft')) return (index - 1 + count) % count
  if (key === 'Home') return 0
  if (key === 'End') return count - 1
  return -1
}

const Tabs = ({
  label,
  labelledBy,
  idBase,
  value,
  onChange,
  items,
  activation = 'auto',
  orientation = 'horizontal',
  wrap = false,
  className = '',
}) => {
  const wraps = wrap && orientation === 'horizontal'
  const scrolls = orientation === 'horizontal' && !wrap
  const { ref: listRef, fade } = useScrollStrip(
    scrolls ? { active: '[aria-selected="true"]', watch: value } : undefined
  )

  const selectedIndex = items.findIndex(item => item.value === value)
  const tabbableIndex =
    selectedIndex >= 0 && !items[selectedIndex].disabled
      ? selectedIndex
      : items.findIndex(item => !item.disabled)

  const handleKeyDown = (event, index) => {
    // Leave browser shortcuts such as Alt+Left (history back) alone.
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const enabled = items.map((item, i) => (item.disabled ? -1 : i)).filter(i => i >= 0)
    const target = nextTabIndex(event.key, enabled.indexOf(index), enabled.length, orientation)
    if (target < 0) return
    event.preventDefault()
    const next = enabled[target]
    listRef.current.querySelectorAll('[role="tab"]')[next].focus()
    if (activation === 'auto' && items[next].value !== value) onChange(items[next].value)
  }

  return (
    <div
      className={`ui-tabs ui-tabs--${orientation}${wraps ? ' ui-tabs--wrap' : ''} ${className}`.trim()}
    >
      <div
        ref={listRef}
        className={scrolls ? 'ui-tabs__list ui-scroll-strip' : 'ui-tabs__list'}
        data-fade={scrolls ? fade : undefined}
        role="tablist"
        aria-label={labelledBy ? undefined : label}
        aria-labelledby={labelledBy}
        aria-orientation={orientation === 'vertical' ? 'vertical' : undefined}
      >
        {items.map((item, index) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            id={tabId(idBase, item.value)}
            className="ui-tabs__tab"
            aria-selected={index === selectedIndex}
            aria-controls={tabPanelId(idBase)}
            tabIndex={index === tabbableIndex ? 0 : -1}
            disabled={item.disabled}
            onClick={() => item.value !== value && onChange(item.value)}
            onKeyDown={event => handleKeyDown(event, index)}
          >
            {item.label}
            {item.count !== undefined && item.count !== null && (
              <>
                {' '}
                <span className="ui-tabs__count">{item.count}</span>
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

Tabs.propTypes = {
  label: PropTypes.string,
  labelledBy: PropTypes.string,
  idBase: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.node.isRequired,
      count: PropTypes.number,
      disabled: PropTypes.bool,
    })
  ).isRequired,
  activation: PropTypes.oneOf(['auto', 'manual']),
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  wrap: PropTypes.bool,
  className: PropTypes.string,
}

export default Tabs
