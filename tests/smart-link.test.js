import React from 'react'
import { render, screen } from '@testing-library/react'
import SmartLink, { isStaticPath, withTrailingSlash } from '../src/components/ui/SmartLink'

describe('link helpers (contract D10)', () => {
  test('static microsites and files are not Gatsby routes', () => {
    expect(isStaticPath('/projects/pd-research-companion/')).toBe(true)
    expect(isStaticPath('/projects/posterior-aware-pd-phenotyping-miccai/')).toBe(true)
    expect(isStaticPath('/papers/2607.21995v1.pdf')).toBe(true)
    expect(isStaticPath('/media/phast_monolithic_demo.mp4')).toBe(true)
  })

  test('Gatsby routes are not static, including the two that share a static/ directory name', () => {
    expect(isStaticPath('/projects/phast/')).toBe(false)
    expect(isStaticPath('/projects/tri-modal-gene-therapy/')).toBe(false)
    expect(isStaticPath('/projects/tri-modal-sensitivity-audit/')).toBe(false)
  })

  test('withTrailingSlash keeps query and hash', () => {
    expect(withTrailingSlash('/projects/phast')).toBe('/projects/phast/')
    expect(withTrailingSlash('/projects/phast/')).toBe('/projects/phast/')
    expect(withTrailingSlash('/projects?theme=world-models')).toBe('/projects/?theme=world-models')
    expect(withTrailingSlash('/#about')).toBe('/#about')
  })
})

describe('SmartLink', () => {
  test('internal route renders a router link with a trailing slash', () => {
    render(<SmartLink to="/projects/phast">PHAST</SmartLink>)
    expect(screen.getByRole('link', { name: 'PHAST' })).toHaveAttribute('href', '/projects/phast/')
  })

  test('static microsite renders a plain anchor to the same URL', () => {
    render(<SmartLink to="/projects/pd-research-companion/">Companion</SmartLink>)
    const link = screen.getByRole('link', { name: /Companion/ })
    expect(link).toHaveAttribute('href', '/projects/pd-research-companion/')
  })

  test('new-tab links carry rel="noopener noreferrer"', () => {
    render(
      <SmartLink to="https://www.utexas.edu/" newTab>
        UT Austin
      </SmartLink>
    )
    const link = screen.getByRole('link', { name: /UT Austin/ })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.getAttribute('rel')).toEqual(expect.stringContaining('noopener'))
    expect(link.getAttribute('rel')).toEqual(expect.stringContaining('noreferrer'))
  })
})
