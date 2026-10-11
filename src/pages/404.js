import * as React from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'
import Seo from '../components/seo'
import PageHeader from '../components/ui/PageHeader'
import './404.css'

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/projects/', label: 'Projects' },
  { to: '/publications/', label: 'Publications' },
  { to: '/people/', label: 'People' },
]

const NotFoundPage = () => (
  <Layout>
    <div className="page-container not-found">
      <PageHeader
        title="404: Not Found"
        lede="You just hit a route that doesn't exist."
        align="center"
      >
        <nav aria-label="Site sections">
          <ul className="not-found__links">
            {LINKS.map(({ to, label }) => (
              <li key={to}>
                <Link to={to}>{label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </PageHeader>
    </div>
  </Layout>
)

export default NotFoundPage

export const Head = () => (
  <Seo title="Page not found" meta={[{ name: 'robots', content: 'noindex' }]} />
)
