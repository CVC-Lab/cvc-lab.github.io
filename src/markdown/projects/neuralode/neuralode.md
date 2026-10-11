---
title: "Dueling Neural ODEs"
slug: "/projects/neuralode"
date: "2023-11-21"
---

## Problem and Goals

- Models for learning unknown dynamics in dynamical systems: $$\frac{d}{dt}y(t) = f(y(t),t)$$
- Adapt the Neural ODE model with the adjoint method.
- To enforce the stability of the dynamics via Lypanunov constraints on the forward and adjoint equations.
  The forward and backwards (adjoint equations) for a Neural ODE are $$\frac{d}{dt} z(t) = f_\theta(z(t),t)$$ $$\frac{d}{dt} a(t) = -a(t)^T \frac{\partial f(z(t),t)}{\partial z(t)}$$

The Lyapunov stability constraints for the two equation are: $$\frac{d}{dt} V(z(t))<-\alpha V(z(t)) $$ $$\frac{d}{dt} W(a(t)) < -\beta W(a(t)).$$ $$\frac{d}{dt}W(a(t)) = \nabla W(a(t))^T a'(t) = - \nabla W(a(t))^T a(t)^T \frac{\partial f(z(t),t)}{\partial z(t)}$$ $$=-\nabla W(a(t))^T \frac{\partial L}{\partial z(t)}^T \frac{\partial f(z(t),t)}{\partial z(t)} = -\nabla W(a(t))^T\frac{\partial L}{\partial z(t)}^T \frac{\partial}{\partial z(t)} \frac{dz(t)}{dt}$$

## Neural ODEs

A neural ODE is a machine learning model where the output is a solution to an ordinary differential equation (ODE) governed by a learned dynamics function, which is a neural network. $$z(0) = g_1(x) \qquad (\mathrm{where}\; x \; \mathrm{is\;the\;input})$$ $$\frac{d}{dt} z(t) = f_\theta (z(t),t), \quad 0\leq t \leq T$$ $$\mathrm{Output}: \; y = g_2(z(T))$$
Neural ODEs are in some way inspired by the similarity of residual neural networks and the Euler discretization of an ODE:$$z_{n+1} = z_n + f_{\theta_n}(z_n)\qquad\quad\qquad\; (\mathrm{residual\; network})$$ $$z_{n+1} = z_n + \Delta t f_\theta(z_n, t_n)\qquad (\mathrm{Euler\; discretization})$$

by using neural ODEs, more advanced ODE solvers such as Runge-Kutta solvers and adaptive solvers like DOPRI.

### Neural ODE adjoints

In order to train the Neural ODE, the gradient of the loss with respect to the parameter, $\frac{\partial \mathcal{L}}{\partial \theta}$, must be computed. The typical method of backpropagation used in neural networks can have high computation/memory cost when using ODE solvers. An alternative method for neural ODE is using the adjoint ODE. The adjoint ODE is solved backwards in time for the gradients. The adjoint state is defined by $$a(t) = \frac{\partial \mathcal{L}}{\partial z(t)},$$ and it solves the adjoint ODE, $$\frac{d}{dt}a(t) = -a(t)^T\frac{\partial f_\theta(z(t),t)}{\partial z(t)}, \qquad T\geq t \geq 0.$$

From the adjoint, the loss gradient can be computed by $$\frac{\partial \mathcal{L}}{\partial \theta} = - \int_0^T a(t)^T \frac{\partial f_\theta(z(t),t)}{\partial \theta}.$$

## Stability Criteria

### Lyapunov Stability

An ODE is Lyapunov stable if $\forall \epsilon >0 \; \exists \delta>0:\|z(0)\|<\delta \Rightarrow \forall t>0\;\|z(t)\|<\epsilon$.

### Asymptotic Stability

An ODE is asymptoticly stable if $$\lim_{z\rightarrow \infty} z(t)= 0 \; \mathrm{for\; any\; initial\; condition\;} z(0).$$

### Exponential Stability

An ODE is exponentially stable with equilibrium $z_e$ if $$\|z(t)\|\leq C e^{-\alpha t}\|z(0)\| \; \mathrm{for\; some\;} C,\alpha > 0$$

### Lyapunov Functions

A Lyapunov function is a function $V:\mathbb{R}^d \rightarrow \mathbb{R}$ such that $V(z)>0$ for $z\neq0$ and $V(0)=0$.
An ODE is asymptoticaly stable if there exists a Lyapunov function $V$ such that $$\frac{d}{dt}V(z(t)) = \nabla V(z(t))^T z'(t) = \nabla V(z(t))^T f(z(t),t)<0.$$

An ODE is exponentially stable if there exists a Lyapunov function $V$ such that $$\frac{d}{dt}V(z(t)) = \nabla V(z(t))^T z'(t)\leq-\alpha V(z(t)),$$ $$\frac{\frac{d}{dt}V(z(t))}{V(z(t))}\leq -\alpha$$ $$\frac{d}{dt} log(V(z(t)))\leq -\alpha$$ $$log(V(z(t))) - log(V(z(0))) \leq -\alpha t$$ $$log(V(z(t)) \leq -\alpha t + log(V(z(0)))$$ $$V(z(t))\leq e^{-\alpha t} V(z(0))$$

To show that exponential stability implies the above Lyapunov condition:
Assume that $\|z(t)\|\leq Ce^{-\alpha t} \|z(0)\|$.

## Related Work on Stablizing Neural ODEs

### Learning Stable Deep Dynamics Models

This paper describes a method to learn the dynamics function and guarentee that it is stable. In order to guarentee it is stable, in addition to learning the dynamics function and Lyapunov function is also learned. The dynamics function is projected onto the half-space that satisfying the Lyapunov stability condition, so that the projected dynamics function is guaranteed to be stable. The projection is given by: $$f(z) = \hat f(z) - \nabla V(z) \frac{RELU(\nabla V(z)^T \hat f(z) + \alpha V(z))}{\|\nabla V(z)\|^2}$$
It is stable since $$\frac{d}{dt}V(z(t)) = \nabla V(z)^T f(z) = \nabla V(z)^T \nabla \hat f(z)$$ $$- \nabla V(x)^T \nabla V(z) \frac{RELU(\nabla V(z)^T \hat f(z) + \alpha V(z))}{\|\nabla V(z)\|^2} $$ $$= \nabla V(z)^T \nabla \hat f(z) -  RELU(\nabla V(z)^T \hat f(z) + \alpha V(z))$$

If $\nabla V(z)^T \hat f(z) + \alpha V(z) \leq 0$, then $$\frac{d}{dt}V(z(t)) = \nabla V(z)^T \nabla \hat f(z) \leq -\alpha V(z).$$

If $\nabla V(z)^T \hat f(z) + \alpha V(z) > 0$, then $$\frac{d}{dt}V(z(t)) = \nabla V(z)^T \nabla \hat f(z) -  (\nabla V(z)^T \hat f(z) + \alpha V(z)) = -\alpha V(z).$$

So for either case, it is exponentially stable.

##### Adjoint equation with Lyapunov projection

Let us consider the adjoint equation,

$$
\begin{align*}
\frac{d}{dt} a(t) &= -a(t)^T \frac{\partial \hat{f}{\theta,\phi} (z(t),t)}{\partial z(t)} \\
&= -a(t)^T \frac{\partial}{\partial z(t)} \left( f\theta(z(t)) - \nabla V_\phi(z(t)) \frac{\mathrm{ReLU}(\nabla V_\phi(z(t))^T f_\theta(z(t)) + \alpha V_\phi(z(t))}{|\nabla V_\phi(z(t))|^2} \right) \\
&= -a(t)^T \frac{\partial f_\theta (z(t))}{\partial z(t)} + a(t)^T \frac{\partial }{\partial z(t)} \left( \nabla V_\phi(z(t)) \frac{\mathrm{ReLU}(\nabla V_\phi(z(t))^T f_\theta(z(t)) + \alpha V_\phi(z(t))}{|\nabla V_\phi(z(t))|^2} \right)
\end{align*}
$$

The projection for the adjoint would be:

$$
-a(t)^T \frac{\partial f_\theta (z(t))}{\partial z(t)} - \nabla V(a(t)) \frac{\mathrm{ReLU}(- \nabla V(a)^T a(t)^T \frac{\partial f_\theta (z(t))}{\partial z(t)} + \alpha V(a(t)))}{|\nabla V(a)|^2}
$$

### LyaNet

LyaNet is a Neural ODE with a modified loss function so that zero loss guarantees the exponential stability of the forward ODE.
Consider the Neural ODE taking input $x$ to output $y$: $$z(0)=g_\theta(x)$$ $$\frac{dz(t)}{dt} = f_\theta(z(t),t), 0<t\leq 1$$ $$y = h_\theta(z(1))$$

Let the standard loss function be $\ell(y,\hat y)$.
The Lyapunov function is taken to be $V(z(t)) = \ell(h_\theta(z(t)),\hat y)$.
The new loss function is $$\mathcal{V}(\theta) = \int_0^1 RELU \left(\frac{d}{dt}V(z(t)) +\alpha V(z(t)) \right) dt.$$

Suppose there exists optimal parameters $\theta^*$ such that $\mathcal{V}(\theta^*)=0$.
Then $$\frac{d}{dt}V(z(t)) +\alpha V(z(t))\leq 0,$$

so it is exponentially stable, and also: $$V(z(t))\leq e^{-\alpha t} V(z(0))$$ $$\ell(h_\theta(z(t)), \hat y) \leq e^{-\alpha t} \ell(h_\theta(z(0)), \hat y).$$

The Lyapunov loss function is an integral that must be approximated. There are two proposed methods for approximating it. One is to use a Monte Carlo method of sampling time points $t_i$ and states $z_i$ and averaging the value at different samples. The other is path integration. The ODE is numerically integrated for an approximate solution at a number of time steps. Then discrete approximations of the derivative and integral in the Lyapunov loss function are used.

#### Possible approach for adjoint

Consider using two regularizations, one for the forward and one for the adjoint: $$\mathcal{L}_\mathrm{Lyap} = \int_0^1 \mathrm{ReLU} \left( \frac{d}{dt} V(z(t)) + \alpha V(z(t)) \right) dt$$
For adjoint: $$\mathcal{L}_\mathrm{adj} = \int_0^1 \mathrm{ReLU} \left( \frac{d}{dt} W(a(t)) + \alpha W(a(t)) \right) dt$$
The problem will be determining how

## Dueling Neural ODE Inner and Outer Loop

<p><img src="https://hackmd.io/_uploads/ryfT654N6.png" alt="Neural_ODE" width="1388" height="719">
The inner loop contains the forward and adjoint ODE solves with stability constraints.
The outer loop focuses on the filtering of gradients, i.e. selection of gradients with highest impact on training.
</p>

- To enforce stability in the gradient calculations used for updating in the training process.

## Some Results

#### Comparison of standard NODE, LyaNet, and PINN for solving spring equation (NYU data) over a domain of initial conditions

<!-- ![](https://hackmd.io/_uploads/ryRTxse_3.png) -->

<img src="https://hackmd.io/_uploads/HyyKqWh9n.png" alt="" width="530" height="389"><br>
Note: PINN is trained for 200000 epochs and the final test loss is shown for reference.

#### Results of training LyaNet to solve spring equation (NYU data). Two types of loss are computed, MSE and Lyapunov, for each the training and testing datasets (top figure). The differences between the training and testing loss (a measure of generalization) is plotted in the bottom figure.

<p><img src="https://hackmd.io/_uploads/BkaYEAld2.png" alt="" width="511" height="751"></p>

#### Results of previous model but with controller that removes some gradients

<p><img src="https://hackmd.io/_uploads/SkGi66td3.png" alt="" width="519" height="741">
<img src="https://hackmd.io/_uploads/r1t1O-iu3.png" alt="" width="519" height="758"></p>

## References

- Ricky T. Q. Chen, Yulia Rubanova, Jesse Bettencourt, David Duvenaud. Neural Ordinary Differential Equations. 2019. https://arxiv.org/abs/1806.07366
- Gaurav Manek and J. Zico Kolter. Learning stable deep dynamics models. Neural information processing systems. 2019. https://arxiv.org/pdf/2001.06116 https://github.com/locuslab/stable_dynamics
- Ivan Dario Jimenez Rodriguez, Aaron D. Ames, Yisong Yue. LyaNet: A Lyapunov dramework for training neural ODEs. 2022. https://arxiv.org/abs/2202.02526
- Sanchez-Lengeling and Aspuru-Guzik. Inverse molecular design using machine learning: generative models for matter engineering. Science. 2018.
- Advanced Generative Adversarial Autoencoder Model for de Novo Generation of New Molecules with Desired Molecular Properties in Silico. Mol. Pharmaceutics. 2017.
- Bajaj, et al. An Efficient Higher-Order Fast Multipole Boundary Element Solution for Poisson–Boltzmann-Based Molecular Electrostatics. SIAM J Sci Comput. 2011.
- Lelièvre and Stoltz. Partial differential equations and stochastic methods in molecular dynamics. Actua Numerica. 2016.
- J.T. Oden, Ludovic Chamoin, Serge Prudhomme. A stochastic coupling method for atomic-to-continuum Monte-Carlo simulations. Comput. Methods Appl. Mech. Engrg. 2008.
