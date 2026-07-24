import * as React from 'react'
import Seo from '../../components/seo'
import DigitalTwinPage from '../../components/project-pages/DigitalTwinPage'
import pianoHero from '../../images/projects/piano_digital_twin/piano_digital_twin_hero.png'
import pianoMechanics from '../../images/projects/piano_digital_twin/piano_twin_mechanics.png'
import pianoCoupledSimulators from '../../images/projects/piano_digital_twin/piano_coupled_simulators.png'
import pianoThreeTwins from '../../images/projects/piano_digital_twin/piano_three_twins.png'

const pianoProject = {
  slug: 'piano-digital-twin',
  title: 'Piano Digital Twin',
  description:
    'A performer-instrument world model for seeing, hearing, and safely improving expert piano skill.',
  eyebrow: 'World Models / Human motion / Structured dynamics',
  subtitle:
    'A performer-instrument world model for seeing, hearing, and safely improving expert piano skill.',
  heroImage: pianoHero,
  heroAlt:
    'Pianist hands on a grand piano with motion trajectories, key mechanics, and acoustic visualization overlays',
  heroCaption:
    'A conceptual view of the performer, instrument, and sensor streams that form the first digital-twin build.',
  sourceNote:
    'Based on the July 2026 UT Austin - Sony CSL digital-twin formulation. The listener twin is shown in the full concept and deferred in the first implementation.',
  overviewEyebrow: 'One performance, one coupled system',
  overviewTitle: 'The piano is not just an output device.',
  overview:
    'Music performance is a chain of causes: skilled motion drives the key and action, the instrument turns touch into sound, and the performer listens and adapts. This project makes that chain queryable as a coupled performer-instrument twin with a controller layer for safe, personalized training.',
  features: [
    {
      kicker: 'Measure',
      title: 'Typed multimodal evidence',
      body: 'Key motion, audio, hand cameras, posture, inertial sensing, pressure, pedals, and gaze are mapped to a specific twin and time scale.',
    },
    {
      kicker: 'Model',
      title: 'Performer plus instrument',
      body: 'A hand and skill state meets a structured piano action: key, hammer, felt, string, soundboard, and a calibrated room response.',
    },
    {
      kicker: 'Simulate',
      title: 'Structure-preserving rollouts',
      body: 'Stochastic port-Hamiltonian dynamics provide a physics-aware world model for long-horizon prediction and counterfactual questions.',
    },
    {
      kicker: 'Improve',
      title: 'Assist as needed',
      body: 'A controller can guide a learner through a safe step in skill geometry, then fade assistance as the learner internalizes the coordination.',
    },
  ],
  galleryTitle: 'From touch to sound to skill',
  galleryIntro:
    'The visual story moves from the physical interfaces to the latent geometry that makes training interventions inspectable.',
  gallery: [
    {
      image: pianoMechanics,
      title: 'A visible instrument mechanism',
      alt: 'Piano key, hammer, string, hand, and acoustic waveform conceptual visualization',
      caption:
        'Key motion becomes a physical chain from touch to hammer, string, soundboard, and audio.',
    },
    {
      image: pianoCoupledSimulators,
      title: 'Four coupled simulators',
      alt: 'Diagram connecting exoskeleton, human, piano, listener, and controller simulators',
      caption:
        'The broader environment joins the performer, piano, exoskeleton, and listener through typed ports.',
    },
    {
      image: pianoThreeTwins,
      title: 'The first implementation boundary',
      alt: 'Diagram of performer, instrument, listener, and controller coupled digital twins',
      caption:
        'The first build focuses on the data-supported performer-instrument twin while keeping listening studies explicit.',
    },
  ],
  workflowTitle: 'A closed loop from observation to assist',
  workflowIntro:
    'The project is organized as a sequence that keeps the model useful at every stage and makes clear which claims are measured, computed, or still proposed.',
  process: [
    {
      title: 'Measure',
      body: 'Synchronize motion, touch, sound, posture, and control streams.',
    },
    {
      title: 'Model',
      body: 'Recover latent performer and instrument states with structure-aware dynamics.',
    },
    {
      title: 'Simulate',
      body: 'Roll forward under altered keys, targets, timing, or injected coordination.',
    },
    {
      title: 'Assist',
      body: 'Choose a bounded intervention and reduce support as skill becomes controllable.',
    },
  ],
  technicalTitle: 'A first build with an honest boundary',
  technicalIntro:
    'The formulation is broad enough to include a listener, room, and exoskeleton, but the implementation begins with the portion the available corpus can identify.',
  details: [
    {
      title: 'Performer and instrument',
      body: 'The performer twin carries hand pose, joint state, muscle activation, skill, and slow adaptation. The instrument twin carries the action, hammer, strings, board, per-piano parameters, and audio readout.',
    },
    {
      title: 'A geometry of skill',
      body: 'Finger individuation is represented as a low-dimensional behavioral manifold. A Fisher-Rao metric supplies a ruler for a bounded natural-gradient step instead of forcing every player toward one template.',
      items: [
        'Safe training radius',
        'Individual variation remains visible',
        'Counterfactual rollouts support intervention design',
      ],
    },
    {
      title: 'Evidence tiers',
      body: 'Passive key motion and audio support visualization and selected computation. Stronger claims require hand and skeleton data, physical structure, felt and string models, listening studies, and validation.',
      items: [
        'Visualized: streams, poses, and trajectories',
        'Computed: states, phases, and rollouts',
        'Estimated or validated: only with the relevant model and evidence',
      ],
    },
  ],
  closingTitle: 'A world model for human learning',
  closingBody:
    'The long-term target is not a replay machine. It is a coupled simulator that can explain how touch becomes sound, locate a learner in a space of coordination, and design safer paths toward expert performance.',
}

const PianoDigitalTwinPage = () => <DigitalTwinPage project={pianoProject} />

export default PianoDigitalTwinPage

export const Head = () => (
  <Seo
    title="Piano Digital Twin"
    description="A performer-instrument world model for seeing, hearing, and safely improving expert piano skill."
  />
)
