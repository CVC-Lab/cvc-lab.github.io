import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Tabs, { tabPanelProps } from '../src/components/ui/Tabs'

const items = [
  { value: 'all', label: 'All', count: 41 },
  { value: 'world-models', label: 'World Models' },
  { value: 'healthcare-ai', label: 'Healthcare AI' },
]

const Example = ({ initial = 'all', onChange = () => {} }) => {
  const [value, setValue] = React.useState(initial)
  return (
    <>
      <Tabs
        label="Filter projects by theme"
        idBase="project-theme"
        value={value}
        items={items}
        onChange={next => {
          onChange(next)
          setValue(next)
        }}
      />
      <div {...tabPanelProps('project-theme', value)}>panel</div>
    </>
  )
}

describe('Tabs (contract D11)', () => {
  test('renders a named tablist with one selected tab and a labelled panel', () => {
    render(<Example />)
    const list = screen.getByRole('tablist', { name: 'Filter projects by theme' })
    const tabs = within(list).getAllByRole('tab')
    expect(tabs).toHaveLength(3)
    expect(tabs.filter(tab => tab.getAttribute('aria-selected') === 'true')).toHaveLength(1)
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', tabs[0].id)
  })

  test('uses a roving tabindex', () => {
    render(<Example initial="world-models" />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map(tab => tab.tabIndex)).toEqual([-1, 0, -1])
  })

  test('click and arrow keys change the selection', async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    render(<Example onChange={onChange} />)
    await user.click(screen.getByRole('tab', { name: 'World Models' }))
    expect(onChange).toHaveBeenLastCalledWith('world-models')
    await user.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenLastCalledWith('healthcare-ai')
    expect(screen.getByRole('tab', { name: 'Healthcare AI' })).toHaveFocus()
    await user.keyboard('{Home}')
    expect(screen.getByRole('tab', { name: /^All/ })).toHaveFocus()
  })
})
