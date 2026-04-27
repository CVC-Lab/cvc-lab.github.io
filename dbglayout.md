# Dynamic Belief Games Microsite Layout

## Purpose

This document lays out a proposed `Dynamic Belief Games` project microsite inside the lab website.

The goal is **not** to turn the internal slide deck into HTML. The goal is to use the slide deck as source material and build a cleaner, layered web experience:

1. A strong public-facing overview
2. A compact team/resources layer
3. Optional deeper technical workstreams for internal collaborators

This structure lets the main project page stay readable while still making room for deeper technical material later.

## Audience Priority

The public microsite should be written primarily for:

1. external technical collaborators
2. sponsor-adjacent reviewers
3. prospective students and research hires

It should **not** be optimized first for internal project members. Internal project details can live in later technical workstream pages or linked documents.

## Recommended Site Shape

### Public entry point

- `/projects/dynamic-belief-games`

This should be the main public landing page. It explains:

- what DBG is
- what problem it solves
- how it works at a high level
- what has been built and validated
- who is involved

### Phase 2: protected technical workstream pages

These should be treated as a **later phase**, not a v1 requirement.

If they are built, they should live under the main DBG route and be linked from a small `Technical Workstreams` section near the bottom of the public page.

Working structure:

- `/projects/dynamic-belief-games/workstreams`
- `/projects/dynamic-belief-games/workstreams/phy-mac`
- `/projects/dynamic-belief-games/workstreams/3d-gym`
- `/projects/dynamic-belief-games/workstreams/unreal-barrage-relay`

Working ownership assumptions:

- `phy-mac` -> Andrew
- `3d-gym` -> Brian
- `unreal-barrage-relay` -> Logan

These names are placeholders until the team confirms the final grouping.

### Scope recommendation

Versioning recommendation:

- **Version 1:** one excellent public landing page
- **Version 1.5:** one internal workstream-page template, if needed
- **Version 2:** actual protected workstream area, only after hosting/auth and ownership are settled

## Important Implementation Note

If this remains a static Gatsby/GitHub Pages site, **client-side password protection is not real protection**. It only hides content superficially.

If the protected technical-workstream pages need actual access control, use one of:

- UT-authenticated hosting
- a private/internal deployment
- a backend-protected route
- shared-doc links outside the public site

If the immediate goal is just lightweight gating for internal review, a client-side password wall can be used temporarily, but it should be treated as convenience, not security.

## Public Release Checkpoint

Before building the microsite, decide:

- which images are approved for public web use
- whether the real-world RF validation figures are cleared for public display
- whether the platoon coverage / route-comparison demo is cleared for public display
- whether any sponsor-sensitive material must stay out of the public page

This should be an explicit checkpoint, not an assumption.

## Public Landing Page Layout

## 1. Hero

### Goal

Explain the project in one pass.

### Content

**Title**

`Dynamic Belief Games`

**Subtitle**

`Training predictive intelligent networking agents for contested mobile ad hoc networks.`

**Short paragraph**

Draft direction:

`DBG trains Predictive Intelligent Networking (PIN) agents to help mobile ad hoc networks adapt proactively to mobility, terrain, and interference. It combines adversarial scenario generation, a 3D digital twin, and RF-grounded validation to test and improve decisions before deployment.`

**Primary actions**

- `View DBG Gym`
- `See Validation and Demos`
- optional third link: `Meet the Team`

**Proof chips**

- `Application-layer overlay`
- `Digital twin + RF validation`
- `Mission-aware adaptation`
- `No waveform firmware changes`

### Hero writing rule

The hero should answer only three questions:

- what DBG is
- what it helps networks do
- one concrete differentiator

**Hero visual options**

Use one of:

- a polished Control Tower / Soldier View still
- a short silent loop from the 3D Gym
- a clean composite visual derived from the strongest gym slides

Avoid:

- repeated title-slide graphics
- placeholder media
- dense architecture screenshots

## 2. Early Proof Strip

### Goal

Show very early that the project is already built beyond the concept stage.

### Suggested proof items

- `3D digital twin for training and testing`
- `RF-grounded calibration from physical measurements`
- `Mission-constrained route and uptime demo`

This should stay compact. It is a confidence layer, not a full section with long explanations.

## 3. The Challenge

### Goal

Tell the visitor why this matters before the technical explanation.

### Suggested structure

Use 3 short cards:

**Terrain and mobility**

- mobile, contested, terrain-constrained missions
- blocked links
- rapidly shifting topology

**Adversarial pressure**

- jamming
- spoofing
- spectral contention
- uncertain operational state

**Operational constraints**

- relay budgets
- limited power
- mission-constrained routing
- no waveform changes

### Source material from the deck

Pull from the slide content that emphasizes:

- modern MANET missions are contested, mobile, terrain-constrained
- reactive link discovery is too slow for short-lived / rapid links
- urban blockage and spectral contention break connectivity faster than standard routing can recover
- PIN agents adapt queueing/topology decisions without changing waveform firmware

## 4. What DBG Is

### Goal

Separate the framework from the agents and the platform.

### Core distinctions to explain once, clearly

**DBG**

- the training and decision framework
- a risk-sensitive belief-space stochastic game

**PIN agents**

- the learned/adaptive networking agents operating under mission and network constraints

**DBG Gym**

- the 3D digital twin and simulation/training environment

### Web-friendly explanation

Structure this as 3 steps:

**Sense**

- heterogeneous observations
- latent-state inference
- uncertainty-aware beliefs

**Train**

- adversarial scenario generation
- digital-twin simulation
- controlled environmental variation

**Adapt**

- topology decisions
- routing and queueing priorities
- operator support
- resource-aware policy selection

### Source material from the deck

From the extracted slide content:

- unified problem as a risk-sensitive belief-space stochastic game
- infer latent operational state from heterogeneous observations
- select actions that reconfigure network resources, routing, queueing, compute placement, and task sensors
- explicitly manage downside risk using calibrated uncertainty and coherent risk measures

## 5. DBG Gym

### Goal

Show the strongest differentiator after the main concept.

### Section framing

`DBG Gym is a 3D digital twin for training and testing predictive networking agents under realistic terrain, materials, mobility, traffic, and adversarial conditions.`

### What to show

- scene gallery
- Control Tower view
- Soldier view
- Observer / fly-through view
- terrain/material variation
- generated scenario diversity

### What to explain

- realistic terrain, materials, mobility, and traffic
- multiple views and scenario control
- training and testing environment for agents
- scalable experimentation infrastructure

### Slide-deck assets to pull from

- DBG Gym architecture slide
- 3D gym gallery slides
- scene-generation slides
- terrain/material-control slides

### Do not do

- do not paste a dense PowerPoint screenshot as the main figure
- rebuild the architecture as a cleaner web diagram if possible

Implementation-stack details such as Blender, Unreal, Flask bridge, or local/server orchestration should be moved into technical notes or later workstream pages unless they are necessary for the public narrative.

## 6. Validation With Real-World RF Data

### Goal

Make the project credible beyond simulation.

### Section framing

`DBG is grounded in field measurements and testbed data, not only synthetic environments.`

### Key items to feature

- real world vs virtual world comparison
- physical RF testbed
- pathloss calibration
- short explanation of how measurements inform the digital twin

### Why this matters

This is one of the strongest trust-building parts of the project. It shows the system is not just a simulated demo pipeline.

## 7. Results / Demonstrated Capability

### Goal

Show one or two concrete stories, not vague claims.

### Recommended lead result

**Platoon coverage / uptime comparison**

This appears to be one of the best website-friendly result narratives because it shows:

- same mission envelope
- different route behavior
- different communication outcome

### Suggested layout

- main figure
- uptime or link-quality comparison
- 2-3 sentence explanation

### Optional metric cards

Only if the numbers are stable and externally publishable:

- throughput
- latency
- uptime
- calibration fidelity
- scenario scale

## 8. Resources

### Goal

Give technical visitors a clear next step without forcing all detail into the main page.

### Recommended content

- executive summary PDF
- selected figures / approved slide deck excerpt if appropriate
- technical note or whitepaper
- related publications
- public software/code links, if available
- contact information

This section should be compact and practical.

## 9. Team and Contact

### Goal

Keep this compact and stable.

### Recommended content

**Leadership**

- Chandrajit Bajaj
- Ryan Farell

**Contributors**

- Andrew Farell
- Logan Kronfrost
- Brian Kim
- Luke McLennan
- other current contributors as confirmed

**Funding**

- Army funding acknowledgment in one compact line

**Opportunities**

- only current, active roles
- one compact contact block

### Do not keep from the current page

- large generic hiring section
- generic role listings that are not clearly current
- temporary/announcement-style blocks

## 10. Phase 2: Technical Workstreams

### Goal

Provide a later internal decomposition of the project without overloading the public page.

### Public teaser block

On the public landing page, add a section like:

`Technical Workstreams`

`DBG spans three active technical tracks. Internal team members can enter the protected workstream pages below.`

Cards:

- `PHY / MAC Layer`
- `3D Gym`
- `Unreal + Barrage Relay`

Each card should show:

- working owner
- one-sentence scope
- locked/protected badge

This should be a small, low-emphasis section in v1. It should not compete with the validation/results/resources narrative.

## Phase 2 Workstream Page Template

If a protected/internal page is built later, each page should follow the same structure:

- Overview
- Scope
- Architecture
- Current status
- Open questions
- Assets / demos
- Owner / contact

This prevents the workstream pages from becoming ad hoc internal notebooks.

## Candidate Workstream Drafts

## A. PHY / MAC Layer

**Working owner:** Andrew

### Purpose

This page should hold the networking/control/optimization side of DBG.

### Likely content blocks

- mission constraints and route structure
- PIN agent behavior
- topology / routing / queueing decisions
- MAC layer assumptions
- PHY-layer modeling notes
- interference / contention handling
- uncertainty and risk-sensitive control

### Candidate source material

From the deck / extracted content:

- belief-space stochastic game framing
- mission-constrained routing and link timing
- short-lived / rapid links
- reactive link discovery limits
- latency/connectivity/resource-exhaustion risk

### Suggested sub-sections

- Overview
- Problem setting
- State / action / observation design
- PHY assumptions
- MAC assumptions
- Learning/control pipeline
- Open questions
- Current experiments

## B. 3D Gym

**Working owner:** Brian

### Purpose

This page should hold the environment/simulation platform details.

### Likely content blocks

- DBG Gym architecture
- Blender scene pipeline
- scene database
- material assignment
- controllable terrain generation
- environment controls
- gallery views
- simulation orchestration

### Candidate source material

From the deck / extracted content:

- Blender scenes / renders / scene database
- local DBG Gym architecture
- generative controllable terrain
- radio materials, permittivity, conductivity
- environment controls
- 3D gym gallery

### Suggested sub-sections

- Platform overview
- Scene generation pipeline
- Materials and pathloss modeling
- Terrain control
- Visualization modes
- Asset management
- Validation hooks
- Current build status

## C. Unreal + Barrage Relay

**Working owner:** Logan

### Purpose

This page should hold the Unreal-facing and relay/simulation integration workstream.

### Likely content blocks

- Unreal engine integration
- Flask bridge
- local/server deployment flow
- barrage simulation coupling
- relay/network behavior demonstrations
- environment-to-agent interface

### Candidate source material

From the deck / extracted content:

- Unreal Engine
- Flask bridge
- local/server split
- sm-barrage-sim references
- deployment/training loop

### Suggested sub-sections

- Unreal integration overview
- Runtime architecture
- Barrage relay simulation
- Data exchange and orchestration
- Demo scenarios
- Performance constraints
- Open issues

## Suggested Public Navigation

For the microsite itself:

- `Overview`
- `How It Works`
- `DBG Gym`
- `Validation`
- `Results`
- `Resources`
- `Team`

If the site grows later, `Technical Notes` or `Technical Workstreams` could be added, but neither should be a major v1 emphasis.

## Suggested Protected Navigation

Inside the technical-workstream area:

- `PHY / MAC Layer`
- `3D Gym`
- `Unreal + Barrage Relay`

Optional:

- `Shared Assets`
- `Meeting Notes`
- `Roadmap`

## Content To Fill In Later

These sections still need real content to be written or confirmed:

- final one-sentence project definition
- final subtitle / hero copy
- final team roster
- final funding acknowledgment wording
- which visuals are approved for public display
- whether the platoon coverage demo is ready for public web use
- whether real-world RF validation visuals are cleared for public use
- confirmed scope splits for Andrew / Brian / Logan

## Asset Shortlist To Build Around

Start with a small set of visuals, not the entire deck.

Recommended shortlist:

- 1 hero visual from DBG Gym
- 1 simplified challenge/constraints visual
- 1 clean system/process diagram
- 1 real-vs-virtual validation visual
- 1 physical RF testbed visual
- 1 platoon coverage / uptime results visual

## Writing Rules

Use these rules when drafting the actual site copy:

- expand acronyms on first mention
- do not lead with theory terms
- keep the hero under 40 words
- keep section intros under ~80 words
- explain DBG vs PIN vs DBG Gym once, clearly
- keep contract identifiers low on the page
- avoid proposal language
- avoid long literature-review or appendix-style blocks on the public page

## First Build Recommendation

Do not build all subpages first.

Build in this order:

1. Public landing page
2. If needed, one internal workstream-page template
3. Remaining protected workstream pages only after auth, asset clearance, and ownership are settled

This keeps the core story clean before expanding the internal layers.
