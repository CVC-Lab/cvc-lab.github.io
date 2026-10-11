---
title: Optimally Controlled Protein Side-Chain and Folding using Stochastic Pontryagin
slug: /projects/protein-sidechain
date: 2024-09-12
---

## What are we trying to do?

The goal of this project is to develop a novel reinforcement learning (RL) framework in a continuous setting and based on a stochastic parametrized Hamiltonian version of the Pontryagin maximum principle (PMP) to solve the side-chain packing and protein-folding problem. Our resulting solution follows Langevin dynamics and stochastic Hamiltonian dynamics folding pathways under various different models of molecular energetics and force fields, reflecting the expected physical properties of an optimal path.

## What is the problem?

Protein structure prediction is a fundamental problem in computational molecular biology. Both classical algorithms such as abinitio or threading and machine learning methods have been proposed to solve this challenging problem. However, most reinforcement learning methods previously considered tend to model the state-action pairs as discrete objects.

A protein consists of poly-peptide chains, where each chain is an embedded sequences of amino acids with specific 3D structure. By chemical reactions, amino acids become linked to form these poly-peptide chain. A residue is a transformed amino acid as it forms the poly-peptide chain. Each residue consists of $N-H, C_{\alpha}, C=O$, which are part of the backbone of the protein, and a side chain $R$. The side chain $R$ is different for different amino acids and quite often thought to be attached to the $C_{\alpha}$ with different rotamer orientations. The primary structure of protein is the 1-D sequence of residues. However, to be functional, protein fold into a certain metastable 3D configurations that minimizes their potential energy which is a combination of hydrogen bonding, electrostatics and the solvation terms capturing their interactions with the ionic watery environment at various PH levels. These metastable 3D configurations of the protein give the tertiary and quaternary structure of the protein.

## Why is it hard?

Atoms in a single residue are conceptualized to be linked by various bond edges (single, double covalent and even ionic). The bond angle between these bond edges, the length of these edges, and the torsion angles called dihedral angles. These angles are around each of the four consecutive atoms along the backbone
chains that specify the protein structure. Side-chain conformations (SCP) problem aims to determine the rotamer angle of the side chain residues in the protein structure. SCP is, in fact, a critical subproblem of protein prediction. The SCP problem is non-convex and equally NP-hard as is the full structure prediction problem. It cannot even be approximated in polynomial time, i.e. no PTAS (polynomial time approximation scheme) is possible.

## How is it done today, and what are the limits of current practice?

Many SCP algorithms with various techniques ranging from combinatorial algorithm to deep learning solutions have been developed and implemented in the past three decades.

### Classical methods:

Suppose we're given a fixed (low-energy) structure embedding of the protein sequence that forms a protein backbone chain in 3D, and a discretized rotamer library of feasible side chain orientations. SCP can be formulated as a combinatorial search problem for the optimal sequence of rotamer orientation selections along the backbone that optimizes the total energy function of the side chain packed backbone chain. Many of the classical methods rely on this combinatorial formulation and also the discretized rotamer libraries, obtained from a statistical clustering of observed side-chain conformations in known protein crystal structures. The overall protein potential energy function or Hamiltonian typically includes a term for the backbone conformation, one for each side chain rotamer assignment in the protein, and one term for every pair of chosen rotamer orientations.

More complex energy terms such potential energy functions combined with complex solvation free energy terms are sometimes used. The Dead End Elimination (DEE) theorem is often used to prune the number of rotamers to be considered for finding a global energy minima. Many algorithms based on this theorem can find the global minima provided they are able to converge. ON the other hand, alternative techniques, such as Markov Chain Monte-Carlo simulation, semi-definite programming, yield reasonable running times but unfortunately don't guarantee a global optima.

### Deep learning framework:

Earlier works utilizing deep learning rely heavily on rotamer libraries to handle side-chain prediction. SIDEPro, for example, uses a family of ANNs to learn energy function. The ANNs' weights are optimized based on the posterior probability of the rotamers, which is calculated by the given prior probability in the rotamer libraries. Recently, many end-toend deep learning models that rely on sequence homology rather than rotamer libraries have been proposed for protein structure prediction problem. AlQuraishi uses a RNN to encode a protein sequence and then supervised learning with ProteinNet dataset to predict the 3D protein structure. AlphaFold uses deep two-dimensional dilated convolutional residual network and trains on Protein Data Bank (PDB) to predict distances between $C_{\beta}$ atoms, and use this information to infer the 3D structure. AlphaFold2 further augments AlphaFold1 with an attention-based network to predict backbone dihedrals and
sidechain torsion angles which are used to reconstruct the atomic coordinates. Ingraham et al. instead uses a deep network model to learn a stochastic energy function. This work develops a simulator based on unrolled Langenvin dynamics together with an atomic imputation network to predict the final structure given sequence information.

Molecular reinforcement learning framework: There are not many works that use reinforcement learning for both side-chain prediction and protein folding. Most of these works rely on some discrete models with either discrete action or discrete state. For instance, Jafari et al. considered the lattice-based model called the hydrophobic-polar (HP) model. The state receives only two values: 1 (hydrophilic) or -1 (hydrophobic). Meanwhile, an action can only be either up, down, left or right.

## What we're doing.

Our main contributions in this work are:

- A reinforcement learning framework in a continuous setting and based on a new stochastic parameterized Hamiltonian version of the Pontryagin maximum principle (PMP) for the protein side-chain and folding problems.
- Optimal parameters for stochastic Hamiltonian dynamics, through the velocity adjoint variables, to capture the full Langevin dynamics of prior methods.
- Our approach allows for the use of different models of protein energetics and force-fields and provides flexible optimal trajectory assignment solutions to the rotamer angles for side-chain packing.

### State and Action Space Representation

The state $s_{t}$ in the protein folding problem is a vector consisting of all torsion angles $\left(d_{i}\right)_{i=1}^{M}$. For the side chain problems, this only includes the set of all side chain angles. Each action $a_{t}$ is represented as a torsion angle perturbation vector $\dot{d}$ of length $M$, where $M$ is the number of torsion angles that the agent can change. At each time step, the agent performs the action by multiplying $\dot{d}$ by a step size and adding it to the current torsion angle vector represented by length $M$ vector $d$. The new state at time $t+1$ can simply be updated as:

$$
\begin{equation*}
s_{t+1}=s_{t}+\epsilon a_{t} \text { for some small } \epsilon
\end{equation*}
$$

<p><img src="https://i.imgur.com/7u46ZLG.png" alt="" width="1818" height="441"></p>

Fig. 1: Snapshots from One Episode of Dialanine Folding

In the protein side-chain packing problem, we represent the protein's configuration as a molecular graph embedded in Cartesian space where each node represents an atom and each edge represents a covalent bond. Let $\mathcal{G}=(X, A)$ be the
embedded molecular graph with node feature matrix $X$ of size $N_{\text {atom }} \times N_{\text {features }}$ and bond adjacency matrix $A$ of size $N_{\text {atoms }} \times N_{\text {atoms }}$. Each atom is represented by a feature vector in $X$ consisting of its Cartesian coordinates, a one-hot encoding of its element name (i.e. C, N, O, H, or S), its van-der Waal radius, the atomic charge, a binary number indicating if the atom can be an acceptor, a binary number indicating if the atom can be a donor, and a binary number indicating if the atom is on the backbone (see Table 1). This protein's configuration is updated in each time step $t$ based on the collection of angles in state $s_{t}$. All atomic chemical features were retrieved from the protein modeling software Rosetta and all energies were calculated using Rosetta's default scoring function. Finally, we define the reward as in algorithm 1 for the soft actor-critic.

| Atomic Feature | Dimension |
| :------------: | :-------: |
|   $x, y, z$    |     3     |
|    Element     |     5     |
|   LJ Radius    |     1     |
| Atomic Charge  |     1     |
|  Is Acceptor   |     1     |
|    Is Donor    |     1     |
|  Is Backbone   |     1     |

Table 1: The feature attributes specified for each atom an their dimensions

### 4.2 Deep Learning Architecture

For our neural network, we create a Soft-Actor Critic (SAC) architecture as formulated in with automatic temperature tuning using optimization of the dual Lagrangian. Since our state space is in the form of a graph, we use a graph convolutional neural network with the same architecture as MolGan to create a valid state embedding. Actions are processed using standard trained multilayer perceptrons.

<p><img src="https://i.imgur.com/FxzoC4H.png" alt="" width="1692" height="886">
<img src="https://i.imgur.com/Uw8bzD0.png" alt="" width="1676" height="865"></p>

Fig. 2: Initial vs final Energy plotted for each evaluation episode of trialanine

### 4.3 Folding and Sidechain Packing of Dipeptides

We first trained our agent on optimizing the 4 backbone dihedral angles of dialanine to achieve the lowest energy. In each epoch we resampled the backbone dihedrals using Dunbrack Lab's Ramanchandran distributions 40. The lowest energy conformation that was found had a Rosetta energy of 1.28 using the default scoring function. Although the agent was able to achieve high cumulative reward, there is a high variance in the final energy (see Figure 2). This is due to the Brownian motion term in the final optimal Langevin dynamics. When the energy was high (more than 12), the agent generally found a conformation with lower energy. However, for low initial starting energies, it proved difficult for the agent to find the optimal configuration as it often prefers exploration more than exploitation. This is again due to the constant Brownian motion terms in the agent's dynamics.

### 4.4 Trialanine Experiments

In addition to dialanine, we also tested our agent on the finding the minimal protein conformation for trialanine (i.e. three consecutively bonded alanines). Figure 3 shows a clear improvement from the training agent in terms of keeping the energy score low.

<p><img src="https://i.imgur.com/GjbuAK0.png" alt="" width="1760" height="909">
<img src="https://i.imgur.com/crCeBKM.png" alt="" width="1752" height="914"></p>

Fig. 3: Initial vs Final Energy plotted for each evaluation episode of trialanine

## Conclusions

We learn the dihedral and/or rotamer angles of the optimal configuration of a protein structure by using a continuous dynamical approach. The resulting RL formulation is derived from the stochastic Pontryagin's maximum principle. Our final algorithm follows soft actor-critic and is guaranteed to converge to an optimal solution. The optimal solution follows a general Langevin dynamics, which is considered as the suitable optimal dynamics for protein folding and structure prediction problems. We further show a variation of our formulation and its relation with the Nesterov's accelerated gradient method. This suggests that our general framework can be utilized to derive further efficient methods for protein structure prediction and for learning dynamical systems in general.
