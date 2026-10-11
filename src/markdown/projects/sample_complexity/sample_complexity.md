---
title: "Sample-Efficient RL for Visual Perception"
slug: "/projects/sample_complexity"
date: "2021-09-28"
---

## What are we trying to do?

In this project, we study the theoretical conditions and algorithmic developments enabling sample-efficient reinforcement learning (RL) for visual perception tasks of interest, e.g., object detection, recognition, and tracking. Recent advances in RL powered by deep neural networks promise superior performance in real-time perception and planning tasks, with improved generalization and forecasting in complex domains, e.g., autonomous vehicles and interactive robots.

## What is the problem?

Modern RL algorithms are known to require millions of data samples, which limits their applicability. In addition, the high dimensional nature of visual observations as obtained through modern sensors such as video cameras, depth sensors, event cameras, and LiDAR sensors, considerably burdens the learning pipeline. This burden manifests in terms of both the computational overhead, i.e., the efficiency of the training procedures and inference speeds of deployed systems, as well as the statistical overhead, i.e., the amount of data needed for training and fine-tuning.

## Why is it hard?

Modern RL crucially relies on deep neural networks for function approximation as needed to cope with continuous and high-dimensional observation and action spaces. A typical RL approach utilizes multiple modules each realized as a deep neural network with a large set of parameters to be trained either jointly or in stages. Those modules implement the representations and policy which the agent needs to perceive its environment and decide which actions to take next to achieve its goals. Unlike supervised machine learning, RL agents learn through interactions with the environment providing sparse rewards signals. The sparsity of the rewards on top of partial observability and uncertainty regarding the dynamics of the environment makes learning significantly harder in comparison to supervised learning scenarios.

## How is it done today, and what are the limits of current practice?

While state-of-the-art bounds on the sample complexity of supervised learning, i.e., the number of data samples required for guaranteed bounds on prediction errors, are still limited, the situation for RL is even less understood. The dominant trend in sample-efficient RL is focused on the statistical complexity of learning approximately-optimal policies, based on information-theoretic quantities. While this approach enabled polynomial bounds on sample complexity in terms of relevant problem parameters, it falls short of providing computationally-efficient algorithms applicable to practical problems of interest.

## What we’re doing

We draw inspiration from optimal control and stochastic optimization to revisit the fundamental modeling assumptions underlying modern RL for vision perception. We use a partially-observable Markov decision process to model an agent that perceives its environment through a set of sensing actions, each with an associated scope and cost, with the goal of dynamic tracking targets in its field of view. We endow our agent with an auxiliary world model which it learns separately in conjunction with a memory unit to help cope with partial observability. We pay special attention to the loss functions defining the learning objectives of each component to enable sample-complexity analysis with suitable assumptions on the environment dynamics, input data distributions, and sensor properties.

Our theoretical investigations directly inform our approach to event-based vision. We are particularly interested in low-latency object detection in event streams, where our learning approach can help with the judicious allocation of computing resources while maintaining detection accuracy.

## Progress

We implement a simplified virtual environment abstracting the essential elements of visual perception tasks faced by autonomous vehicle controllers. Using this virtual environment, we experiment with a number of RL algorithms as baselines compared to our proposed algorithm in terms of both the sample efficiency as well as the latency and accuracy of predictions. The video below demonstrates the simulation environment we implement under OpenAI Gym to facilitate the comparison of different algorithms under different settings. The left panel shows a noise-free image of a dynamic scene. The middle pannel shows a noisy image obtained by trying to capture the whole scene at once. The right pannel shows the advantage of zooming on smaller regions in the scene to help reduce the noise. An intelligent agent can learn where to direct attention to minimize tracking uncertainty.

`video: https://www.youtube.com/watch?v=sJfJQBmi_aM`

Leveraging the model presented above, we propose the following architecture for event-based object detection. The agent controls both the size of the temporal window along the event stream as well as the spatial window to process. The events within each selected window are passed through the feature extraction and recurrent layers to update the predicted detection boxes. The agent then proceeds to update its internal state and sample the next window to process.

<p><img src="https://i.imgur.com/kt3QFSy.png" alt="" width="960" height="720"></p>

The process graph below provides further details for each step of the proposed workflow.

<p><img src="https://i.imgur.com/epy9hOJ.png" alt="" width="1364" height="597"></p>

<!-- ## Codes
* GitHub repo for the OpenAI Gym environment: [microscope](https://utexas.box.com/s/88bwhaa5s020frbe5lbkwbjts9ovt49x) -->

## People

- PI: Prof. Chandrajit Bajaj
- Ahmed Abdelkader (Postdoc)
