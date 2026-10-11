---
title: "Invariance-based Multi-Clustering of Latent Space Embeddings for Equivariant Learning"
slug: "projects/mce_vae"
date: "2021-11-15"
---

### [Computational Visualization Center Wordpress Link](https://cvcweb.oden.utexas.edu/cvcwp/projects/invariance-based-multi-clustering-of-latent-space-embeddings-for-equivariant-learning/)

## Project Description

Variational Autoencoders (VAEs) have been shown to be remarkably effective in recovering model latent spaces for several computer vision tasks. However, currently trained VAEs, for a number of reasons, seem to fall short in learning invariant and equivariant clusters in latent space. Our work focuses on providing solutions to this problem and presents an approach to disentangle equivariance feature maps in a Lie group manifold by enforcing deep, group-invariant learning. Simultaneously implementing a novel separation of semantic and equivariant variables of the latent space representation, we formulate a modified Evidence Lower Bound (ELBO) by using a mixture model pdf like Gaussian mixtures for invariant cluster embeddings that allows superior unsupervised variational clustering. Our experiments show that this model effectively learns to disentangle the invariant and equivariant representations with significant improvements in the learning rate and an observably superior image recognition and canonical state reconstruction compared to the currently best deep learning models.

## Main Motivation

In multi-category visual data, a main problem of interest is object classification while simultaneously learning any invariant information that is present. Our data is often an ensemble of images where multiple members of the dataset are related with one another by simple geometric transformations. Such transformations are often modeled by coordinate transformation matrices on a Lie manifold. We are interested in fleshing out a canonical reconstruction that is invariant under such group transformations while independently learning the transformation that faithfully rederives the equivariant reconstruction of image data. For these tasks, unsupervised or semi-supervised learning methods like variational auto-encoders (VAE) have shown superior potential for learning meaningful latent representation of the image.

We consider the information in the data as a combination of embeddings in multi-category finite invariant and equivariant spaces. In images of multi-category objects with varied spatial transformations, for example, the simplest partition can be the separation of categorical, variational, and transformational feature spaces. While the categorical distribution learns to distinguish different object categories(types), the variational distribution encodes the shape and shading variants within a category. As explained in the previous section, when the spatial transformations are confined on a Lie (differentiable) manifold, transformational distributions disentangle themselves from the categorical and variational ones by learning the Lie algebra of the transformation group under some canonical choice of the Lie group generators. In the VAE perspective, we learn the corresponding latent subspace embedding for each of the factored distributions of the partitioned variables.

## Results

<p><img src="https://hackmd.io/_uploads/BkDMW81_F.png" alt="" width="1166" height="826">
<img src="https://hackmd.io/_uploads/BJ_QbIJOK.png" alt="" width="1100" height="704"></p>

## Links to Code and Paper

Link to full code rep: [here](https://github.com/yorkiva/MCE-VAE).

Link to arXiv paper: [here](https://arxiv.org/abs/2107.11717).

## Appendix: Full Paper

<iframe src="https://arxiv.org/pdf/2107.11717.pdf"
height=500 width=100%></iframe>
