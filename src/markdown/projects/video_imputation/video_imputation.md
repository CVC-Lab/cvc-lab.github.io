---
title: "Learning an Optimal Policy for Video Imputation"
slug: "projects/video_imputation"
date: "2021-11-01"
---

### [Computational Visualization Center Wordpress Link](https://cvcweb.oden.utexas.edu/cvcwp/projects/video-imputation/)

Video imputation is essential for on-the fly error-recovery in adaptive streaming, compression, and super resolution. Most prior methods rely on the use of generative adversarial networks (GANs) such that given two consecutive video frames, the model attempts to generate spatial interpolatory frames to form coherent video sequences. In this work, we study the use of a factorizable variational auto-encoder based on a second order ordinary differential equation solver (Ode2-FacVAE) to account for separated covariances between the spatial, spectral and temporal video frames in order to improve the visual performance of previously proposed methods for video interpolation.

### Problem Formulation

Let $X=\{x_{t_i}\}_{i=1}^N$ where $x_{t_i} \in \mathbb{R}^d$ be an ordered sequence of video frames. Let $I=\{0,1,...,N\}$ be the frame index, where $t_i \in \mathbb{R}^+$ for $i \in I$ and $t_i=t_j > 0$ for all $i,j \in I$ where $i > j$. Let $t \in \mathbb{R}^+$ be continuous and represent time. We are tasked with recovering $x_t$ from $X$. We will do this by learning an independently factorized latent space manifolds that are linear locally and such that the latent space captures the covariance structure that exists between nearby frames:
$ \textbf{Objective: } \max p(x_t|X). $

- **Video Imputation:** Video can be damaged. The aim of this task is to identify damaged video frames and impute the missing or damaged pixels.
- **Video Extrapolation:** $\max p(x_t|X)$ where $t > t_N$.
- **Video Interpolation:** $\max p(x_t|X)$ where $t_i < t < t_{i+1}$ for some $i \in \{0,...,N-1\}$.

### Methodology

We are given video stream $x_{0:N}=\{x_0,x_1,...,x_N\}$. Suppose that the generative process that generates $x$ is described by a latent space that can be factorized into $L$ independent subspaces. That is,

$$
% p(x|z_{0:N}^1,z_{0:N}^2,...,z_{0:N}^L)=p(x|z_{0:N}^1)p(x|z_{0:N}^2)\cdots p(x|z_{0:N}^L)
p(z_{0:N}^1,z_{0:N}^2,...,z_{0:N}^L)=p(z_{0:N}^1)p(z_{0:N}^2)\cdots p(z_{0:N}^L)
$$

Further, suppose that the data dynamics governing the transition $x_k \to x_{k+1}$ are determined by second order dynamics in the latent spaces with a memory-less property such that

$$
p(z_{0:N}^l)=p(z_0^l)p(z_1^l|z_0)\cdots p(z_N^l|z_{N-1}^l)
$$

Let $z_k^l=(s_k^l,v_k^l)$, where $\frac{\partial s_k^l}{\partial t}=v_k^l$ is the velocity of latent position $s_k^l$ and $\frac{\partial v_k^l}{\partial t}=f(s_k^l,v_k^l)=a_k^l$ be the acceleration of latent position $s_k^l$. While the true dynamics in ODE2VAE were modeled with a BNN \cite{yildiz2019ode2vae}, in our approach the velocity function is deterministic (although we can easily substitute a BNN).

Our objective is to maximize the likelihood of observing the whole sequence of video frames $\log p(x_{0:N})$, which is intractable. We can make this tractable by maximizing the ELBO of $\log p(x_{0:N})$:

$$
ELBO = \mathbb{E}_{q} \log \Big( \frac{p(x_{0:N},z_{0:N}^1,...,z_{0:N}^L)}{q(z_{0:N}^1,...,z_{0:N}^L|x_{0:N})} \Big) \\
= \mathbb{E}_{q} \Big [\log p(x_{0:N}|z_{0:N}^1,...,z_{0:N}^L) + \log \Big( \frac{p(z_{0:N}^1,...,z_{0:N}^L)}{q(z_{0:N}^1,...,z_{0:N}^L|x_{0:N})} \Big) \Big ] \\
= \mathbb{E}_{q} \Big [\log p(x_{0:N}|z_{0:N}^1,...,z_{0:N}^L) +
\sum_{k=1}^L \log \Big(\frac{p(z_0^k)}{q(z_0^k|x_0)}\Big) + \sum_{k=1}^L \sum_{i=1}^N \log \Big(\frac{p(z_i^k|z_{i-1}^k)}{q(z_i^k|z_{i-1}^k)}\Big)
\Big] \\
= \underbrace{\log p(x_{0:N}|z_{0:N}^1,...,z_{0:N}^L)}_{\text{reconstruction error}} + \sum_{l=1}^L \Big( \underbrace{\sum_{i=1}^N \mathbb{E}_q \log p(z_i^l|z_{i-1}^l)}_{\text{prior regularizes latent movement}} - \underbrace{KL(q(z_0^l|x_0)||p(z_0^l))}_{\text{VAE KL term on first frame}} \Big) \\
$$

and where $q(z_i^l|z_{i-1}^l)$ is either one or zero since $f$ is deterministic (this can be relaxed),
and a superior prior is

$$
p(z_i^l|z_{i-1}^l) = p \Big (
\begin{pmatrix}
s_i^l \\ v_i^l
\end{pmatrix}
\Big |
\begin{pmatrix}
s_{i-1}^l \\ v_{i-1}^l
\end{pmatrix}
\Big) \sim \mathcal{N} \Big(
\begin{pmatrix}
s_i^l \\ v_i^l
\end{pmatrix}
\Big |
\begin{pmatrix}
(\gamma_1 \Delta t)^2 I & (\gamma_3 \Delta t)^2 I \\
(\gamma_3 \Delta t)^2 I & (\gamma_2 \Delta t)^2 I \\
\end{pmatrix}
\Big) \\
$$

where $\Delta t$ is the temporal difference between frames and $\{\gamma_1, \gamma_2, \gamma_3\}$ are hyperparameters. Also, we have a memoryless prior $p(z_i^l|z_{i-1}^l)=p(z_i^l|z_{i-1}^l,z_{i-2}^l,...)$, which can be relaxed if need be.

### Results

<p><img src="https://i.imgur.com/zcZbUnZ.png" alt="" width="1400" height="602">
<img src="https://i.imgur.com/W4nGOSe.png" alt="" width="1400" height="624">
<img src="https://i.imgur.com/UjzSG7X.png" alt="" width="1400" height="622"></p>

<p><img src="https://i.imgur.com/GVR5Wwn.png" alt="" width="1194" height="708">
<img src="https://i.imgur.com/yVsH2IK.png" alt="" width="1238" height="874">
<img src="https://i.imgur.com/lqUzqUy.png" alt="" width="1186" height="884">
<img src="https://i.imgur.com/yMoFLI4.png" alt="" width="1566" height="958">
<img src="https://i.imgur.com/Os1nUPw.png" alt="" width="1216" height="766">
<img src="https://i.imgur.com/xODUubq.jpg" alt="" width="3520" height="1634"></p>

`video: https://www.youtube.com/watch?v=sxsnwkKISWE`
`video: https://youtu.be/qTN-vRF3zwo`
`video: https://youtu.be/2YY6YLAlRAU`
`video: https://youtu.be/uKdEx6lEYgc`
