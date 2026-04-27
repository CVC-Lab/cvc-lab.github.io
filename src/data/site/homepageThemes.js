/**
 * Curated research-theme data for the experimental homepage.
 *
 * This is intentionally separate from the existing internal project taxonomy.
 * The goal is to provide a lightweight, reversible theme-first discovery layer
 * for the temporary /research-themes route.
 */

const homepageThemes = [
  {
    id: 'healthcare-ai',
    title: 'Healthcare AI',
    summary:
      'Multimodal computational methods for diagnosis, patient stratification, and disease monitoring.',
    description:
      'We develop computational methods that combine imaging, biomarkers, wearable sensing, and clinical information to support diagnosis, subgroup discovery, and longitudinal monitoring in complex diseases.',
    useCases: ['Medical imaging', 'Biomarkers', 'Wearables', 'Clinician decision support'],
    impact:
      'Integrating imaging, biomarkers, sensors, and clinical data into models that support diagnosis and monitoring.',
    ctaLabel: 'View all Healthcare AI projects',
    ctaHref: '/projects',
    projectNames: [
      "Actionable Intelligence for Combating Parkinson's Disease",
      'Integrated PD Precision Stratification',
      'Pathway-Anchored PD Clustering',
    ],
  },
  {
    id: 'world-models',
    title: 'World Models',
    summary:
      'Structured models and simulations of evolving systems for prediction, reasoning, and decision-making.',
    description:
      'We build structured models of systems that change over time, including simulation-oriented methods for physical systems, stability, forecasting, planning, and decision-making in complex environments.',
    useCases: ['Dynamic environments', 'Temporal inference', 'Planning', 'Scientific simulation'],
    impact:
      'Developing robust models for systems that evolve over time and require prediction, planning, simulation, and decision-making.',
    ctaLabel: 'Browse World Models research',
    ctaHref: '/projects',
    projectNames: [
      'PHAST',
      'GRL-SNAM',
      'Dynamic Belief Games',
      'Subsurface Flow Modeling',
      'Scalable Risk-Averse Well-Placement',
    ],
  },
  {
    id: 'ai-for-science',
    title: 'AI for Science',
    summary:
      'Machine learning methods for scientific data, imaging, simulations, latent structure, and interpretable analysis.',
    description:
      'We apply machine learning to scientific data, imaging, sensing, and simulation pipelines to help researchers recover structure, discover latent patterns, and accelerate analysis while preserving interpretability.',
    useCases: [
      'Scientific machine learning',
      'Multimodal modeling',
      'Computational imaging',
      'Simulation-guided inference',
    ],
    impact:
      'Building structure-aware computational methods that help researchers sense, simulate, analyze, and interpret complex systems.',
    ctaLabel: 'Explore AI for Science projects',
    ctaHref: '/projects',
    projectNames: [
      'Differential and Pointwise Control RL',
      'Scalable Robust Bayesian Co-Clustering',
      'Scalable Risk-Averse Well-Placement',
      'Subsurface Flow Modeling',
      'Night-time Aerial Material Segmentation',
      'Adversarial Cloaking',
      'DEDRECON',
    ],
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
