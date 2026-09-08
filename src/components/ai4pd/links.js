// Single place for the AI4PD program's addresses.
export const AI4PD_BASE = '/projects/ai4pd'
// The clinician-facing patient portal: motion and gait visualization app (separate repo).
export const PATIENT_PORTAL_URL = 'https://cvc-lab.github.io/parkinson-viz/'
// Static research companion for the two 2026 manuscripts (static/projects/pd-research-companion).
export const COMPANION_URL = '/projects/pd-research-companion/'
export const CONTACT_EMAIL = 'bajaj@cs.utexas.edu'

export const AI4PD_NAV = [
  { key: 'overview', label: 'Overview', to: `${AI4PD_BASE}/` },
  { key: 'approach', label: 'Approach', to: `${AI4PD_BASE}/approach/` },
  {
    key: 'clinician-workflow',
    label: 'Clinician workflow',
    to: `${AI4PD_BASE}/clinician-workflow/`,
  },
  { key: 'evidence', label: 'Evidence', to: `${AI4PD_BASE}/evidence/` },
  { key: 'partners', label: 'Partners', to: `${AI4PD_BASE}/partners/` },
  { key: 'team', label: 'Team', to: `${AI4PD_BASE}/team/` },
  { key: 'resources', label: 'Resources', to: `${AI4PD_BASE}/resources/` },
]
