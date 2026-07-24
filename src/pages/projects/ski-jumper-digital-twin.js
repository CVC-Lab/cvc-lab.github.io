import * as React from 'react'
import Seo from '../../components/seo'
import DigitalTwinPage from '../../components/project-pages/DigitalTwinPage'
import skiOverview from '../../images/projects/ski_jumper_digital_twin/ski_jumper_overview.png'
import skiPostureSchedule from '../../images/projects/ski_jumper_digital_twin/ski_posture_schedule.png'
import skiModelContract from '../../images/projects/ski_jumper_digital_twin/ski_model_contract.png'

const skiProject = {
  slug: 'ski-jumper-digital-twin',
  title: 'Ski Jumper Digital Twin',
  description:
    'A physics-aware world model that moves from ski-jump motion capture to phase-dependent trajectory optimization.',
  eyebrow: 'World Models / Sports dynamics / Trajectory optimization',
  subtitle:
    'From motion capture to physics-aware simulation, the model optimizes a full body-and-ski trajectory rather than a single pose.',
  heroImage: skiOverview,
  heroAlt:
    'Ski jumper digital twin overview showing measurement, skeleton reconstruction, simulation, optimization, and prediction',
  heroCaption:
    'The working report connects motion capture, geometry, dynamics, optimization, and prediction across the full jump.',
  sourceNote:
    'Based on the July 2026 Ski Jumper / Human Digital Twin report. This page presents the proposed model contract and claim boundary for future simulation work.',
  overviewEyebrow: 'Optimize the trajectory, not one pose',
  overviewTitle: 'A jump is a schedule through changing physics.',
  overview:
    'The same body has different objectives on the in-run, at takeoff, in early flight, during stable flight, before landing, and at contact. The twin makes the hill, skeleton, skis, forces, and phase label explicit so those objectives can be simulated and optimized together.',
  features: [
    {
      kicker: 'Measure',
      title: 'Recover motion and geometry',
      body: 'Video, IMUs, force insoles, LiDAR, wind, and hill geometry become time-indexed evidence for the digital twin.',
    },
    {
      kicker: 'Model',
      title: 'Expose the model contract',
      body: 'State, parameters, inputs, constraints, kinematics, and dynamics define what the simulator can answer and what it cannot.',
    },
    {
      kicker: 'Simulate',
      title: 'Bridge motion to forces',
      body: 'Forward kinematics produce velocities, accelerations, center-of-mass paths, contact loads, and aerodynamic moments.',
    },
    {
      kicker: 'Optimize',
      title: 'Balance distance and safety',
      body: 'The objective trades landing distance against impact, instability, rule violations, excessive effort, and unrealistic motion.',
    },
  ],
  galleryTitle: 'A visual contract for the jump',
  galleryIntro:
    'These views keep the project grounded: a full pipeline, a phase schedule, and a concrete contract for the state and dynamics.',
  gallery: [
    {
      image: skiOverview,
      title: 'Measurement to prediction',
      alt: 'Ski jumper digital twin workflow from measurement through model, simulation, optimization, and prediction',
      caption:
        'A complete pipeline from observed motion to predicted distance, forces, stability, and style.',
    },
    {
      image: skiPostureSchedule,
      title: 'Posture schedule over time',
      alt: 'Chart of ski-jump body and ski angles across in-run, takeoff, flight, landing preparation, and landing',
      caption: 'Body and ski posture are functions of jump phase, not one fixed optimal angle.',
    },
    {
      image: skiModelContract,
      title: 'The model contract',
      alt: 'Ski-jumper model contract showing state, parameters, inputs, constraints, kinematics, and dynamics',
      caption:
        'The contract separates what is represented from what is measured, simulated, or validated.',
    },
  ],
  workflowTitle: 'Six phases, six mechanical priorities',
  workflowIntro:
    'A world model becomes useful when the changing objective is visible across time. Each phase contributes a distinct constraint or target to the trajectory.',
  process: [
    {
      title: 'In-run',
      body: 'Preserve speed while reducing drag and maintaining track stability.',
    },
    {
      title: 'Takeoff',
      body: 'Create release velocity and angular momentum through contact impulse.',
    },
    {
      title: 'Early flight',
      body: 'Reach a stable V-style posture while controlling pitch, roll, and yaw.',
    },
    {
      title: 'Stable flight',
      body: 'Balance lift, drag, ski incidence, and aerodynamic efficiency.',
    },
    {
      title: 'Landing prep',
      body: 'Prepare ski attitude, center of mass, and leg posture for contact.',
    },
    {
      title: 'Landing',
      body: 'Absorb impact while preserving alignment, style, and safety.',
    },
  ],
  technicalTitle: 'From pose to physics without overclaiming',
  technicalIntro:
    'The report treats a static figure as the beginning of an inspectable object. Each stronger physical claim requires a stronger evidence layer and an explicit dynamics model.',
  details: [
    {
      title: 'State and geometry',
      body: 'The state includes root pose, joint angles and rates, center-of-mass position and velocity, ski orientations, and a phase label. Parameters include segment masses, inertias, equipment, hill shape, wind, and friction.',
    },
    {
      title: 'Kinematics to dynamics',
      body: 'Forward kinematics produce segment positions and Jacobian velocities. Adding mass, inertia, gravity, contact, and aerodynamic loads yields a bridge to inverse dynamics.',
      items: [
        'Position -> velocity -> acceleration',
        'Center-of-mass trajectory stays queryable',
        'Contact and aero loads remain separate inputs',
      ],
    },
    {
      title: 'Recoverability boundary',
      body: 'Static geometry supports visual pose. Time-indexed motion supports animation and kinematics. Forces and performance require inertias, contact and aero models, and validation data.',
      items: [
        'Visualized: geometry, pose, and phase',
        'Computed: kinematics, COM, and trajectories',
        'Estimated or validated: forces, impact, and performance',
      ],
    },
  ],
  closingTitle: 'A world model for a changing body and environment',
  closingBody:
    'The project turns ski jumping into a queryable simulation problem: expose the hill, skeleton, equipment, forces, and phase transitions, then optimize a physically meaningful trajectory under safety and rule constraints.',
}

const SkiJumperDigitalTwinPage = () => <DigitalTwinPage project={skiProject} />

export default SkiJumperDigitalTwinPage

export const Head = () => (
  <Seo
    title="Ski Jumper Digital Twin"
    description="A physics-aware world model that moves from ski-jump motion capture to phase-dependent trajectory optimization."
  />
)
