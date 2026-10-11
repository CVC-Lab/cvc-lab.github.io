/**
 * Software projects data for the CVC website
 * This file contains all software projects by category
 *
 * Optional item fields:
 * - `href`: external page, opens in a new tab
 * - `slug`: overrides the slug derived from `name` for the /software/<slug>/ page
 */

module.exports = [
  {
    category: 'Graphical User Tools',
    items: [
      {
        name: 'TexMol',
        description: 'Molecular visualization and computation',
      },
      {
        name: 'VolumeRover',
        description: 'Scalable Image Processing and Visualization Tool',
      },
      {
        name: 'VolRoverN',
        description:
          'Geometric and electrophysiological neuronal simulation and visualization package',
      },
      {
        name: 'LBIE',
        description: 'Level Set Boundary-Interior-Exterior Meshing Tool',
      },
      {
        name: 'Prism',
        description: 'Geometric modeling using algebraic patches',
        href: 'https://www.cs.utexas.edu/%7Ebajaj/cvc/software/prism.shtml',
      },
      { name: 'GANITH', description: 'Algebraic geometry toolkit' },
    ],
  },
  {
    category: 'Software Libraries and Command-Line Utilities',
    items: [
      {
        name: 'MolSurf',
        description: 'Molecular surface generation and manipulation',
      },
      {
        name: 'MolEnergy',
        description: 'Molecular energetics computation',
      },
      { name: 'DPG', description: 'Dynamic packing grids' },
      {
        name: 'SSEP',
        description: 'Secondary structure elucidation package',
      },
      {
        name: 'Pocket/Tunnel',
        description: 'Protein pocket/tunnel extractor',
        href: 'https://www.cs.utexas.edu/%7Ebajaj/cvc/software/Pocktunnel.shtml',
      },
      {
        name: 'QHM',
        description: 'Quality Quadrilateral/Hexahedral Mesh Generator',
        href: 'https://www.cs.utexas.edu/%7Ebajaj/cvc/software/QHM.shtml',
      },
      {
        name: 'QTM',
        description: 'Quality Triangular/Tetrahedral Mesh Generator',
        href: 'https://www.cs.utexas.edu/%7Ebajaj/cvc/software/QTM.shtml',
      },
      {
        name: 'QMDM',
        description: 'Quality Multi-Domain Meshing with Gap',
      },
      {
        name: 'QMDMNG',
        description: 'Quality Multi-Domain Meshing with No Gap',
      },
      {
        name: 'GPU Renderer',
        description: 'Surface/Volume Rendering Packages',
        href: 'https://www.cs.utexas.edu/%7Ebajaj/cvc/software/SurfVolRender.shtml',
      },
      { name: 'Shastra', description: 'X11 Based Scientific Toolkits' },
      {
        name: 'Tracing/Tiling/Tetra',
        description: 'Arbitrary Topology Shape Reconstruction Library from Planar Cross Sections',
      },
      { name: 'PFCorr', description: 'Polar Fourier Correlation' },
      {
        name: 'PF2Fit',
        description: 'Polar Fast Fourier Rigid-body Fitting',
      },
      {
        name: 'PF3Fit',
        description: 'Polar Fast Fourier Flexible Fitting',
      },
      { name: 'PMEOPA', description: 'Parallel Molecular Energetics' },
      { name: 'PGBFOPA', description: 'Parallel Generalized Born Force' },
      { name: 'TVCT', description: 'Time-varying Contour Trees' },
    ],
  },
  {
    category: 'Server Based Codes',
    items: [
      { name: 'F2Dock', description: 'Protein docking software' },
      {
        name: 'TRLIB',
        description: 'Texture-based Rendering Library',
        href: 'https://www.cs.utexas.edu/%7Ebajaj/cvc/software/TRLIB.shtml',
      },
      {
        name: 'ParIso',
        description: 'Fast Parallel Isosurface Rendering Library',
      },
      {
        name: 'MTD',
        description: 'Server-Client based Multi-Tiled Display Library',
      },
      { name: 'PVRC', description: 'Parallel Volume Ray Casting Library' },
    ],
  },
]
