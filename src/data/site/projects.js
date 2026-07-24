/**
 * Project data for the CVC website
 * This file contains all research projects
 */

const perennialLearningTitle =
  'The Physics, Information, and Computation of Perennial Learning: Kolmogorov Complexity, Information Distance and Port-Hamiltonian Thermodynamics'
const triModalGeneTherapyTitle =
  'A Novel Tri-Modal Viral–Ultrasound Gene-Delivery Therapy Protocol for Lysosomal Neurodegeneration via Stochastic Model Optimization with Uncertainty Quantification and Generalizability'
const parkinsonsHealthcareAiTitle = "Parkinson's Disease / Healthcare AI"
const pianoDigitalTwinTitle = 'Piano Digital Twin'
const skiJumperDigitalTwinTitle = 'Ski Jumper Digital Twin'

module.exports = [
  {
    name: 'DEDRECON',
    description:
      'Real-time anomaly detection for hyperspectral video using encoder-decoder models that fuse spectral and motion cues.',
    img_name: 'projects/Projects_Deep Encoder-Decoder',
    link: '/projects/dedrecon',
    tags: ['Computer Vision', 'Scientific ML'],
    date: '2020-09-01',
  },
  {
    name: 'Video Imputation',
    description:
      'Methods for repairing missing or corrupted video frames during streaming, compression, and super-resolution.',
    img_name: 'project_tiles/video_imputation_crop',
    link: '/projects/video-imputation',
    tags: ['Computer Vision'],
    date: '2021-11-01',
  },
  {
    name: 'MCE-VAE',
    description:
      'A variational learning framework for discovering stable latent clusters in transformed data.',
    img_name: 'project_tiles/mce_vae',
    link: '/projects/mce-vae',
    tags: ['Scientific ML'],
    date: '2021-11-15',
  },
  {
    name: 'Sample Complexity',
    description:
      'Theory and algorithms for reinforcement learning that achieve better performance with fewer samples.',
    img_name: 'project_tiles/sample_complexity_2',
    link: '/projects/sample-complexity',
    tags: ['Reinforcement Learning'],
    date: '2021-09-28',
  },
  {
    name: 'Optimal Control',
    description:
      'Computational methods for solving optimal control problems through Hamiltonian system dynamics.',
    img_name: 'project_tiles/optimal_control_2',
    link: '/projects/optimal-control',
    tags: ['Scientific ML', 'Reinforcement Learning'],
    date: '2020-11-11',
  },
  {
    name: 'Adversarial Cloaking',
    description:
      'Adversarial patches for 3D human meshes that hide people from machine vision systems.',
    img_name: 'project_tiles/adversarial_cloaking_crop',
    link: '/projects/adversarial-cloaking',
    tags: ['Computer Vision', 'Scientific ML'],
    date: '2020-09-01',
  },
  {
    name: 'Camera ISP',
    description:
      'Learning-based image signal processing for removing heterogeneous artifacts in camera pipelines.',
    img_name: 'project_tiles/isp_crop',
    link: '/projects/camera-isp',
    tags: ['Computer Vision'],
    date: '2020-09-01',
  },
  // {
  //   name: "Dynamic Mode Decomposition",
  //   description:
  //     "Using compressive sensing and variational inference to side-step the traditional DMD analysis",
  //   img_name: "project_tiles/dmd",
  //   link: "/projects/dmd",
  //   tags: ["Scientific ML"],
  //   date: "2021-11-16",
  // },
  {
    name: 'Angstrom',
    description:
      'Multi-resolution geometric data structures for scientific computing and large-scale spatial analysis.',
    img_name: 'project_tiles/angstrom',
    link: '/projects/angstrom',
    tags: ['Scientific ML'],
    date: '2020-09-01',
  },
  {
    name: 'Spectre',
    description:
      'Fast spectral and geometric processing with data structures and prediction methods that come with guarantees.',
    img_name: 'project_tiles/spectre_logo',
    link: '/projects/spectre',
    tags: ['Scientific ML'],
    date: '2020-09-01',
  },
  {
    name: 'Generative Material Design',
    description: 'Generative models for designing new materials from limited labeled data.',
    img_name: 'project_tiles/generative_material_logo',
    link: '/projects/generative-material-design',
    tags: ['Scientific ML'],
    date: '2020-09-01',
  },
  // {
  //   name: "Shape Optimization",
  //   description:
  //     "Inverse generative modeling for stealth and cloaking devices using meta-materials",
  //   img_name: "project_tiles/shape_logo",
  //   link: "/projects/shape-optimization",
  //   tags: ["Scientific ML", "Computer Vision"],
  //   date: "2020-09-01",
  // },
  {
    name: 'Rank-ordered Search-and-Score',
    description:
      'Multi-agent reinforcement learning for finding important regions in gigapixel images quickly.',
    img_name: 'project_tiles/search_n_score',
    link: '/projects/search-n-score',
    tags: ['Reinforcement Learning'],
    date: '2020-09-01',
  },
  {
    name: 'Physics-informed Neural Networks',
    description:
      'Physics-informed neural networks for solving PDEs while respecting governing physical constraints.',
    img_name: 'project_tiles/robust_pinns',
    link: '/projects/robust-pinns',
    tags: ['Scientific ML'],
    date: '2021-10-26',
  },
  {
    name: 'Theoretical Bound for OCF Algorithm',
    description: 'Theory for understanding when and why optimal control flow algorithms work.',
    img_name: 'project_tiles/theoretical_bound',
    link: '/projects/theoretical-bound',
    tags: ['Reinforcement Learning'],
    date: '2023-08-07',
  },
  {
    name: 'Real Time Processing of Hyperspectral Video',
    description:
      'Real-time machine learning for analyzing hyperspectral video streams as they are captured.',
    img_name: 'project_tiles/intelligent_ml',
    link: 'https://cvc-lab.github.io/afc-website/',
    tags: ['Computer Vision'],
    date: '2023-12-01',
  },
  {
    name: 'Dueling Neural ODEs',
    description: 'Stable neural ODE methods for learning forward and adjoint dynamics together.',
    img_name: 'project_tiles/dueling_neural_odes',
    link: '/projects/neuralode',
    tags: ['Scientific ML'],
    date: '2023-11-21',
  },
  {
    name: parkinsonsHealthcareAiTitle,
    description:
      "A unified Healthcare AI directory for Parkinson's research across imaging, biomarkers, and interpretable patient phenotypes.",
    img_name: 'publications/PUB_Posterior-Aware Phenotyping',
    link: '/projects/healthcare-ai',
    tags: ['Healthcare AI'],
    themes: ['Healthcare AI'],
    date: '2026-06-12',
  },
  {
    name: 'OC Protein Side-Chain and Folding',
    description: 'Continuous reinforcement learning for protein side-chain packing and folding.',
    img_name: 'project_tiles/protein_sidechain',
    link: '/projects/protein-sidechain',
    tags: ['Reinforcement Learning'],
    themes: ['AI for Science'],
    date: '2024-09-12',
  },
  {
    name: 'Night-time Aerial Material Segmentation',
    description:
      'Night-time aerial material segmentation that combines hyperspectral sensing with RGB imagery.',
    img_name: 'projects/Project_Night-time Aerial',
    link: '/projects/aerial-material-segmentation',
    tags: ['Computer Vision'],
    date: '2024-09-12',
  },
  {
    name: 'Dynamic Belief Games',
    description:
      'Decision-making models for rapid response in dynamic and adversarial communication networks.',
    img_name: 'project_tiles/dynamic_belief_games',
    link: '/projects/dynamic-belief-games',
    tags: ['Reinforcement Learning', 'Scientific ML'],
    themes: ['World Models'],
    date: '2025-04-08',
  },
  {
    name: pianoDigitalTwinTitle,
    description:
      'A performer-instrument world model for multimodal piano skill, structured dynamics, and safe personalized training.',
    img_name: 'projects/piano_digital_twin/piano_digital_twin_hero',
    link: '/projects/piano-digital-twin',
    tags: ['Scientific ML', 'Human Motion'],
    themes: ['World Models'],
    date: '2026-07-19',
  },
  {
    name: skiJumperDigitalTwinTitle,
    description:
      'A physics-aware digital twin for phase-dependent ski-jump trajectories, aerodynamic posture, and landing safety.',
    img_name: 'projects/ski_jumper_digital_twin/ski_jumper_overview',
    link: '/projects/ski-jumper-digital-twin',
    tags: ['Scientific ML', 'Simulation'],
    themes: ['World Models'],
    date: '2026-07-13',
  },
  {
    name: 'SHASTRA',
    description:
      'Collaborative tools for geometric modeling, simulation, visualization, and design on networked systems.',
    img_name: 'project_tiles/shastra',
    link: '/projects/shastra',
    tags: ['Scientific ML', 'Computer Vision'],
    date: '2020-09-01',
  },
  {
    name: 'DiDi: Data Intensive Display Intensive Computing',
    description:
      'Archived CVC project on data-intensive, display-intensive visualization for very large scientific datasets and multi-tiled display environments.',
    img_name: 'project_tiles/angstrom',
    link: 'https://web.archive.org/web/20061118080456/http://cvcweb.ices.utexas.edu:80/cvc/projects/DiDi/index.php',
    tags: ['Scientific ML', 'Computer Vision'],
    date: '2004-01-01',
  },
  {
    name: 'VisualEyes',
    description:
      'Archived CVC project on visual environments, domain modeling, auralization, and interrogative visualization for scientific data.',
    img_name: 'project_tiles/shastra',
    link: 'https://web.archive.org/web/20061118080859/http://cvcweb.ices.utexas.edu:80/cvc/projects/VisualEyes/index.php',
    tags: ['Scientific ML', 'Computer Vision'],
    date: '2004-01-01',
  },
  {
    name: 'Subsurface Flow Modeling',
    description:
      'Computational models for simulating and visualizing subsurface flow in complex geological formations.',
    img_name: 'projects/Project_Subsurface Flow Modeling',
    link: '/projects/subsurface-modeling',
    tags: ['Reinforcement Learning', 'Scientific ML'],
    themes: ['AI for Science'],
    date: '2024-10-20',
  },
  {
    name: 'GRL-SNAM',
    description:
      'Geometric reinforcement learning for navigation and mapping in unknown environments.',
    img_name: 'projects/Project_GRL-SNAM',
    link: '/projects/grl-snam',
    tags: ['Reinforcement Learning', 'Scientific ML'],
    date: '2026-01-01',
  },
  {
    name: 'PHAST',
    description:
      'A Port-Hamiltonian neural architecture for stable long-horizon forecasting in dynamical systems.',
    img_name: 'project_tiles/phast',
    link: '/projects/phast',
    tags: ['Scientific ML'],
    date: '2026-02-19',
  },
  {
    name: perennialLearningTitle,
    description:
      'Perennial learning framework using Kolmogorov complexity, information distance, and port-Hamiltonian dynamics for safe continual adaptation.',
    img_name: 'publications/PUB_Perennial Learning',
    link: '/projects/perennial-learning-kolmogorov',
    tags: ['Scientific ML'],
    themes: ['World Models', 'AI for Science'],
    date: '2026-04-01',
  },
  {
    name: triModalGeneTherapyTitle,
    description:
      'Computationally optimized tri-modal AAV-T4, SP2, and focused ultrasound protocol for lysosomal neurodegeneration with stochastic uncertainty quantification.',
    img_name: 'project_tiles/tri_modal_gene_therapy',
    link: '/projects/tri-modal-gene-therapy',
    tags: ['Health AI/ML', 'Scientific ML'],
    themes: ['Healthcare AI', 'AI for Science'],
    date: '2026-05-19',
  },
  {
    name: 'Scalable Risk-Averse Well-Placement',
    description: 'Scalable risk-aware optimization for choosing well placements in shale fields.',
    img_name: 'publications/PUB_Scalable Risk-Averse',
    link: '/projects/scalable-risk-averse-well-placement',
    tags: ['Scientific ML'],
    themes: ['AI for Science'],
    date: '2026-01-01',
  },
  {
    name: 'Computer Algebra Meets Hamiltonian Geometry',
    description:
      'Symbolic computation for deriving, simplifying, and visualizing Hamiltonian and Lie-Poisson dynamical systems.',
    img_name: 'publications/PUB_Computer Algebra',
    link: '/projects/computer-algebra-hamiltonian-geometry',
    tags: ['Scientific ML'],
    date: '2025-11-15',
  },
  {
    name: 'Scalable Robust Bayesian Co-Clustering',
    description:
      'Variational co-clustering for discovering robust row and column structure in noisy, sparse, and high-dimensional data.',
    img_name: 'publications/PUB_Compositional ELBOs',
    link: '/projects/scalable-robust-bayesian-co-clustering',
    tags: ['Scientific ML'],
    date: '2024-09-12',
  },
  {
    name: 'Differential and Pointwise Control RL',
    description:
      'Sample-efficient reinforcement learning that combines differential control updates with pointwise trajectory corrections.',
    img_name: 'projects/Project_Differential and Pointwise Control',
    link: '/projects/differential-and-pointwise-control-rl',
    tags: ['Reinforcement Learning', 'Scientific ML'],
    date: '2025-12-01',
  },
]
