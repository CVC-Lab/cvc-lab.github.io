---
title: 'Subsurface Flow Modeling'
slug: '/projects/subsurface-modeling'
date: '2024-10-20'
---

## What are we trying to do?

We are developing advanced computational methods for modeling and visualizing subsurface flow dynamics, with applications to groundwater management, environmental remediation, and hydrocarbon reservoir simulation. Our research combines high-performance computing, machine learning, and innovative visualization techniques to provide accurate predictions of fluid behavior in complex geological formations.

<video width="100%" controls autoplay muted loop style="border-radius: 8px; margin: 1.5rem 0;">
  <source src="./hydro6A80.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

## What is the problem?

Subsurface flow modeling presents unique challenges due to the heterogeneous nature of geological media, the multi-scale physics involved, and the uncertainty in subsurface properties. Traditional numerical methods often struggle with:

- Computational efficiency when dealing with large-scale, high-resolution models
- Incorporating uncertainty quantification in predictions
- Handling complex multi-phase flow phenomena
- Visualizing and interpreting 3D/4D subsurface data effectively

## What we're doing

Our approach integrates several cutting-edge techniques:

1. **Physics-Informed Neural Networks (PINNs)**: We embed physical constraints directly into neural network architectures to ensure physically consistent predictions while leveraging the flexibility of deep learning.

2. **Multi-scale Modeling**: We develop hierarchical methods that capture flow phenomena across different spatial and temporal scales, from pore-scale to reservoir-scale.

3. **Advanced Visualization**: We create interactive visualization tools that enable geoscientists to explore complex subsurface data intuitively, including flow patterns, pressure distributions, and saturation fields.

4. **Uncertainty Quantification**: We employ Bayesian methods and ensemble techniques to quantify uncertainty in subsurface properties and propagate it through flow predictions.

## Progress

Our recent achievements include:

- Development of a GPU-accelerated subsurface flow simulator that achieves 100x speedup compared to traditional CPU-based methods
- Implementation of a novel neural network architecture that preserves mass conservation in heterogeneous media
- Creation of an immersive VR visualization system for exploring 3D subsurface flow patterns
- Successful application to real-world groundwater contamination scenarios with improved prediction accuracy

## Collaborators

- Department of Petroleum and Geosystems Engineering, UT Austin
- Environmental Science Institute
- Texas Advanced Computing Center (TACC)

## Publications

1. R. Farell, J. Eric Bickel, C. Bajaj. "Bayesian Port–Hamiltonian Surrogate for Three-Phase Reservoir Flow Simulation." _SPE Middle East Oil and Gas Show and Conference_, D021S043R002, 2025.

2. L. McLennan, Y. Wang, R. Farell, M. Nguyen, C. Bajaj. "Learning Generalized Hamiltonian Dynamics with Stability from Noisy Trajectory Data." _arXiv preprint arXiv:2509.07280_, 2025.

3. R. Farell, J.E. Bickel, C. Bajaj. "Field-Scale Bayesian Production Forecasting via Spectral Gaussian-Process Mixtures." _SPE/AAPG/SEG Unconventional Resources Technology Conference_, D021S035R003, 2025.
