const healthcareAiVisual =
  require('../../images/publications/PUB_Posterior-Aware Phenotyping.png').default
const worldModelsAnimation =
  require('../../images/projects/phast/phast_monolithic_demo.gif').default
const aiForScienceVisual =
  require('../../images/projects/Project_Subsurface Flow Modeling.png').default

/**
 * The public homepage taxonomy is intentionally smaller than the internal project list.
 * Each theme is a single entry point; project-level detail lives behind the theme link.
 */
const homepageThemes = [
  {
    id: 'healthcare-ai',
    index: '01',
    title: 'Healthcare AI',
    kicker: 'Human-centered modeling',
    summary:
      'Interpretable models for multimodal health data, patient heterogeneity, and longitudinal disease monitoring.',
    tags: ['Imaging', 'Biomarkers', 'Clinical data'],
    visual: healthcareAiVisual,
    visualAlt:
      'Posterior motor states connected to clinical assessments, patient-level phenotypes, DaTSCAN, and MRI validation',
    visualCaption:
      'Posterior-aware motor states connect clinical assessments to imaging-associated validation.',
    featuredProjects: [
      {
        label: 'Posterior-aware motor phenotyping',
        href: '/projects/posterior-aware-pd-phenotyping',
      },
      {
        label: 'MICCAI 2026 accepted paper',
        href: '/projects/posterior-aware-pd-phenotyping-miccai/',
      },
      {
        label: 'Pathway-anchored PD clustering',
        href: '/projects/pathway-anchored-pd-clustering',
      },
      {
        label: 'Integrated precision stratification',
        href: '/projects/integrated-pd-precision-stratification',
      },
      {
        label: 'Actionable Intelligence',
        href: 'https://cvc-lab.github.io/parkinsons-website/',
      },
    ],
    href: '/projects/healthcare-ai',
    ctaLabel: 'Explore Healthcare AI',
  },
  {
    id: 'world-models',
    index: '02',
    title: 'World Models',
    kicker: 'Systems that evolve',
    summary:
      'Physics-informed world models learn structured dynamics for long-horizon forecasting, simulation, and decision-making under uncertainty.',
    tags: ['Structured dynamics', 'Physics-informed ML', 'Forecasting'],
    visual: worldModelsAnimation,
    visualAlt:
      'PHAST animated comparison of ground truth and learned trajectories across mechanical, electrical, and physical systems',
    visualCaption:
      'PHAST compares structured Hamiltonian dynamics against learned baselines across physical systems.',
    featuredProjects: [
      { label: 'Dynamic Belief Games', href: '/projects/dynamic-belief-games' },
      { label: 'Ski Jumper Digital Twin', href: '/projects/ski-jumper-digital-twin' },
      { label: 'Piano Digital Twin', href: '/projects/piano-digital-twin' },
    ],
    href: '/projects?theme=world-models',
    ctaLabel: 'Browse World Models',
  },
  {
    id: 'ai-for-science',
    index: '03',
    title: 'AI for Science',
    kicker: 'Scientific AI',
    summary:
      'Structure-aware learning for scientific data, simulation, sensing, and computational discovery.',
    tags: ['Scientific ML', 'Simulation', 'Visualization'],
    visual: aiForScienceVisual,
    visualAlt:
      'Subsurface flow modeling graphical abstract showing layered geology, wells, mesh resolution, and Bayesian uncertainty',
    visualCaption:
      'Scientific machine learning brings simulation, uncertainty, and visual reasoning into one workflow.',
    featuredProjects: [
      { label: 'Molecular dynamics / protein folding', href: '/projects/protein-sidechain' },
      { label: 'Subsurface Flow Modeling', href: '/projects/subsurface-modeling' },
      {
        label: 'Scalable Risk-Averse Well-Placement',
        href: '/projects/scalable-risk-averse-well-placement',
      },
    ],
    href: '/projects?theme=ai-for-science',
    ctaLabel: 'Explore AI for Science',
  },
]

const homepageThemeById = homepageThemes.reduce((themesById, theme) => {
  themesById[theme.id] = theme
  return themesById
}, {})

module.exports = {
  defaultHomepageThemeId: homepageThemes[0].id,
  homepageThemes,
  homepageThemeById,
}
