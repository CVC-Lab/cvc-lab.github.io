import * as React from 'react'
import { FaBookOpen, FaCopy, FaCubes, FaDownload, FaRoute } from 'react-icons/fa'
import Layout from '../../components/layout'
import Seo from '../../components/seo'
import './computer-algebra-hamiltonian-geometry.css'
import heroFigure from '../../images/projects/Computer Algebra Meets Hamiltonian /Computer Algebra Meets Hamiltonian Geometry_1.png'
import phaseFigure from '../../images/projects/Computer Algebra Meets Hamiltonian /Computer Algebra Meets Hamiltonian Geometry_2.png'
import pipelineFigure from '../../images/projects/Computer Algebra Meets Hamiltonian /Computer Algebra Meets Hamiltonian Geometry_3.png'
import casimirFigure from '../../images/projects/Computer Algebra Meets Hamiltonian /Computer Algebra Meets Hamiltonian Geometry_4.png'
import metriplecticFigure from '../../images/projects/Computer Algebra Meets Hamiltonian /Computer Algebra Meets Hamiltonian Geometry_5.png'
import geometryFigure from '../../images/projects/Computer Algebra Meets Hamiltonian /Computer Algebra Meets Hamiltonian Geometry_7.png'

const paperUrl = 'https://mapletransactions.org/index.php/maple/article/view/24248/18704'

const featureCards = [
  {
    title: 'Symbolic Dynamics',
    body: 'Derive equations of motion directly from assumptions, Hamiltonians, brackets, and coordinate choices.',
    formula: 'ẋ = {x, H}',
  },
  {
    title: 'Geometric Structure',
    body: 'Expose conserved quantities, degeneracies, symmetries, and dissipative extensions before plotting.',
    formula: '{C, f} = 0',
  },
  {
    title: 'Automated Visualization',
    body: 'Turn symbolic reductions into phase portraits, equilibrium diagrams, and geometric level sets.',
    formula: '∇H · XH = 0',
  },
]

const systems = [
  {
    name: 'Spring',
    phase: 'T*ℝ',
    hamiltonian: 'H = ½(p² + ω²q²)',
    dynamics: 'q̇ = p, ṗ = −ω²q',
    casimir: 'Conservative energy contours',
    image: phaseFigure,
  },
  {
    name: 'Damped Spring',
    phase: 'ℝ² with metric term',
    hamiltonian: 'H = ½(p² + ω²q²)',
    dynamics: 'ṗ = −kq − γp',
    casimir: 'Energy decay toward sink',
    image: metriplecticFigure,
  },
  {
    name: 'Pendulum',
    phase: 'T*S¹',
    hamiltonian: 'H = p²/(2ml²) + mgl(1 − cos θ)',
    dynamics: 'θ̇ = ∂H/∂p',
    casimir: 'Separatrix structure',
    image: phaseFigure,
  },
  {
    name: 'Windy Pendulum',
    phase: 'Forced T*S¹',
    hamiltonian: 'H(θ, p, t)',
    dynamics: 'ṗ = −∂V/∂θ + Fwind',
    casimir: 'Broken conservative foliation',
    image: phaseFigure,
  },
  {
    name: '3D Rotating Body',
    phase: 'so(3)∗',
    hamiltonian: 'H = ½M · I⁻¹M',
    dynamics: 'Ṁ = M × ω',
    casimir: '||M||² sphere',
    image: casimirFigure,
  },
  {
    name: '3D Rigid Body Motion',
    phase: 'SE(3)∗',
    hamiltonian: 'H = Tᵣₒₜ + Tₜᵣₐₙₛ',
    dynamics: 'Lie-Poisson evolution',
    casimir: 'Momentum invariants',
    image: geometryFigure,
  },
]

const pipeline = [
  ['System Assumptions', 'coordinates, parameters'],
  ['Hamiltonian', 'H(q, p)'],
  ['Poisson Bracket', '{f, g}'],
  ['Dynamics', 'X_H'],
  ['Casimirs', 'C_i'],
  ['Equilibria', '∇H = 0'],
  ['Phase Portraits', 'flow + leaves'],
]

const galleryItems = [
  [phaseFigure, 'Phase portrait comparisons', 'Conservative, damped, pendulum, and forced pendulum portraits derived from symbolic dynamics.'],
  [pipelineFigure, 'Symbolic-to-geometric workflow', 'Computer algebra carries assumptions through Hamiltonians, brackets, Casimirs, topology, and visualization.'],
  [casimirFigure, 'Rotating body Casimir sphere', 'Rigid-body flow constrained to invariant angular momentum leaves.'],
  [metriplecticFigure, 'Hamiltonian vs. metriplectic behavior', 'Side-by-side comparison of conservative flow and dissipative bracket structure.'],
  [geometryFigure, 'Hamiltonian geometry workspace', 'Background mathematical structures used across derivations and visualizations.'],
]

const mathIdeas = [
  {
    title: 'Hamiltonian Systems',
    body: 'A Hamiltonian packages energy and constraints into a scalar generator whose derivatives define motion.',
    snippet: 'XH = J∇H',
  },
  {
    title: 'Poisson Brackets',
    body: 'The bracket expresses how observables evolve and makes the geometric structure explicit.',
    snippet: 'ḟ = {f, H}',
  },
  {
    title: 'Metriplectic Dynamics',
    body: 'A symmetric metric term can model dissipation while preserving selected invariants.',
    snippet: 'ẋ = XH + G∇S',
  },
  {
    title: 'Casimirs',
    body: 'Casimirs are functions that commute with every observable, defining invariant leaves of motion.',
    snippet: '{C, f} = 0',
  },
  {
    title: 'Lie-Poisson Structure',
    body: 'Lie algebra duals encode mechanical systems such as rotating bodies through brackets induced by symmetry.',
    snippet: '{F, G}(μ) = ⟨μ, [dF, dG]⟩',
  },
  {
    title: 'Vector Field Topology',
    body: 'Equilibria, separatrices, sinks, sources, and invariant sets give a qualitative map of dynamics.',
    snippet: 'X(x*) = 0',
  },
]

const citation = `@article{bajaj2026computer_algebra_hamiltonian,
  title   = {Computer Algebra Meets Hamiltonian Geometry},
  author  = {Bajaj, Chandrajit},
  journal = {Maple Transactions},
  year    = {2026}
}`

const ComputerAlgebraHamiltonianGeometryPage = () => {
  const [activeIdea, setActiveIdea] = React.useState(mathIdeas[0].title)
  const [copied, setCopied] = React.useState(false)
  const activeIdeaContent = mathIdeas.find(idea => idea.title === activeIdea) || mathIdeas[0]

  const copyCitation = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    await navigator.clipboard.writeText(citation)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <Layout headerVariant="compact">
      <main className="cahg-page">
        <section className="cahg-hero">
          <div className="cahg-shell cahg-hero__grid">
            <div className="cahg-hero__content">
              <p className="cahg-eyebrow">Symbolic Mechanics / Computational Geometry</p>
              <h1>Computer Algebra Meets Hamiltonian Geometry</h1>
              <p className="cahg-hero__subtitle">
                Symbolic computation for deriving, simplifying, and visualizing Hamiltonian,
                metriplectic, and Lie-Poisson dynamical systems.
              </p>
              <div className="cahg-actions">
                <a className="cahg-button cahg-button--primary" href={paperUrl}>
                  <FaBookOpen /> Read Paper
                </a>
                <a className="cahg-button" href="#systems">
                  <FaRoute /> Explore Systems
                </a>
              </div>
            </div>

            <div className="cahg-hero-art">
              <img
                src={heroFigure}
                alt="Computer Algebra Meets Hamiltonian Geometry visual summary with symbolic equations, phase portraits, and Casimir leaves"
              />
            </div>
          </div>
        </section>

        <section className="cahg-section" id="overview">
          <div className="cahg-shell">
            <div className="cahg-section-heading">
              <p className="cahg-eyebrow">Overview</p>
              <h2>From symbolic derivation to geometric understanding</h2>
              <p>
                This project connects computer algebra with Hamiltonian mechanics to make complex
                dynamical systems easier to derive, inspect, and visualize. The workflow uses
                symbolic manipulation to compute Poisson brackets, detect Casimirs, simplify vector
                fields, characterize equilibria, and prepare structured visualizations of the
                resulting phase geometry.
              </p>
            </div>
            <div className="cahg-feature-grid">
              {featureCards.map(card => (
                <article className="cahg-glass-card" key={card.title}>
                  <p className="cahg-card-formula">{card.formula}</p>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="cahg-section cahg-section--deep" id="systems">
          <div className="cahg-shell">
            <div className="cahg-section-heading">
              <p className="cahg-eyebrow">Systems Studied</p>
              <h2>Canonical examples across mechanics and geometry</h2>
            </div>
            <div className="cahg-system-grid">
              {systems.map(system => (
                <article className="cahg-system-card" key={system.name}>
                  <div className="cahg-system-thumb">
                    <img src={system.image} alt={`${system.name} visual preview`} />
                  </div>
                  <h3>{system.name}</h3>
                  <dl>
                    <div>
                      <dt>Lie group / phase space</dt>
                      <dd>{system.phase}</dd>
                    </div>
                    <div>
                      <dt>Hamiltonian preview</dt>
                      <dd>{system.hamiltonian}</dd>
                    </div>
                    <div>
                      <dt>Dynamics preview</dt>
                      <dd>{system.dynamics}</dd>
                    </div>
                    <div>
                      <dt>Casimir behavior</dt>
                      <dd>{system.casimir}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="cahg-section" id="pipeline">
          <div className="cahg-shell">
            <div className="cahg-section-heading">
              <p className="cahg-eyebrow">Method Pipeline</p>
              <h2>A symbolic-to-geometric computation path</h2>
            </div>
            <div className="cahg-pipeline">
              {pipeline.map(([label, snippet]) => (
                <article className="cahg-pipeline-step" key={label}>
                  <FaCubes />
                  <h3>{label}</h3>
                  <p>{snippet}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="cahg-section cahg-section--deep" id="results">
          <div className="cahg-shell">
            <div className="cahg-section-heading">
              <p className="cahg-eyebrow">Visual Results</p>
              <h2>Derived portraits and invariant geometry from the paper</h2>
            </div>
            <div className="cahg-gallery">
              {galleryItems.map(([image, title, caption]) => (
                <figure className="cahg-gallery-card" key={title}>
                  <img src={image} alt={title} loading="lazy" />
                  <figcaption>
                    <strong>{title}</strong>
                    <span>{caption}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="cahg-section" id="ideas">
          <div className="cahg-shell">
            <div className="cahg-section-heading">
              <p className="cahg-eyebrow">Key Mathematical Ideas</p>
              <h2>Compact reference for the structures used in the paper</h2>
            </div>
            <div className="cahg-idea-panel">
              <div className="cahg-idea-tabs" role="tablist" aria-label="Mathematical ideas">
                {mathIdeas.map(idea => (
                  <button
                    className={idea.title === activeIdea ? 'is-active' : ''}
                    key={idea.title}
                    onClick={() => setActiveIdea(idea.title)}
                    role="tab"
                    type="button"
                    aria-selected={idea.title === activeIdea}
                  >
                    {idea.title}
                  </button>
                ))}
              </div>
              <article className="cahg-idea-content">
                <p className="cahg-card-formula">{activeIdeaContent.snippet}</p>
                <h3>{activeIdeaContent.title}</h3>
                <p>{activeIdeaContent.body}</p>
              </article>
            </div>
          </div>
        </section>

        <section className="cahg-section cahg-section--deep" id="reproducibility">
          <div className="cahg-shell cahg-code-grid">
            <div className="cahg-section-heading">
              <p className="cahg-eyebrow">Code / Reproducibility</p>
              <h2>Scripts for symbolic derivation and visualization</h2>
              <p>
                The computation scripts derive dynamics, characterize equilibria, identify
                structure-preserving quantities, and generate visualization-ready phase data.
              </p>
            </div>
            <pre className="cahg-code-card">
              <code>{`spring_dynamics.mw
pendulum_dynamics.mw
rotating_body_dynamics.mw

derive_hamiltonian()
compute_poisson_bracket()
solve_equilibria()
render_phase_portrait()`}</code>
            </pre>
          </div>
        </section>

        <section className="cahg-section" id="citation">
          <div className="cahg-shell">
            <div className="cahg-citation-card">
              <div>
                <p className="cahg-eyebrow">Citation</p>
                <h2>Computer Algebra Meets Hamiltonian Geometry</h2>
              </div>
              <pre>
                <code>{citation}</code>
              </pre>
              <div className="cahg-actions">
                <button className="cahg-button cahg-button--primary" onClick={copyCitation} type="button">
                  <FaCopy /> {copied ? 'Copied' : 'Copy Citation'}
                </button>
                <a className="cahg-button" href={paperUrl}>
                  <FaDownload /> Download Paper
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  )
}

export default ComputerAlgebraHamiltonianGeometryPage

export const Head = () => (
  <Seo
    title="Computer Algebra Meets Hamiltonian Geometry"
    description="Symbolic computation for deriving, simplifying, and visualizing Hamiltonian, metriplectic, and Lie-Poisson dynamical systems."
  />
)
