---
author:
- Johannes Rauch
- Claude (Anthropic)
bibliography: spatial-frequency-domain-imaging/references.bib
title: Notes on Spatial-Frequency-Domain Imaging
description: Introduction to SFDI for mathematicians
date: 2026-10-12
---

# Introduction

Spatial-frequency-domain imaging (SFDI) is a measurement and reconstruction framework for characterizing how light propagates through a turbid medium (Cuccia et al. 2005, 2009; Gioux, Mazhar, and Cuccia 2019). In diffuse optical imaging, the medium is typically a tissue, gel, or other material in which light is attenuated by absorption and scattered by fluctuations of the refractive index. The challenge is to separate the effects of these optical properties from each other and from the illumination and detection geometry. SFDI addresses this challenge by illuminating the medium with known, spatially periodic patterns and by measuring the amplitude (and, optionally, the phase) of the diffusely reflected pattern at several spatial frequencies.

The central physical idea is that a turbid medium acts as a spatial low-pass filter. A pattern that varies slowly in space is transported deep into the medium and is strongly affected by absorption, whereas a pattern that varies rapidly is washed out within a short distance, so its remaining amplitude depends mainly on scattering. Measuring the reflected amplitude at low and high spatial frequencies therefore separates absorption from scattering. Because a camera records the whole field of view at once, this can be done for every pixel, which yields wide-field maps of the optical properties. The complete process consists of four stages:

1.  deriving a model for light transport in the medium (Section <a href="#sec:rte" data-reference-type="ref" data-reference="sec:rte">3</a>);

2.  reducing the model to a practical diffusion approximation (Section <a href="#sec:diffusion" data-reference-type="ref" data-reference="sec:diffusion">4</a>);

3.  modulating the illumination at several spatial frequencies and measuring the response (Sections <a href="#sec:modulation" data-reference-type="ref" data-reference="sec:modulation">5</a> and <a href="#sec:measurement" data-reference-type="ref" data-reference="sec:measurement">6</a>); and

4.  reconstructing the optical properties through an inverse problem (Section <a href="#sec:inverse" data-reference-type="ref" data-reference="sec:inverse">7</a>).

These notes are organized around this causal chain. The radiative transfer model describes the physical propagation of light, while the diffusion approximation provides a computationally tractable model for the same physics in the strongly scattering regime. Spatial-frequency modulation provides a controlled set of measurements, and the inverse problem converts those measurements into estimates of the absorption and scattering parameters. Instrument design and numerical methods for the forward problem are only touched upon.

# Optical properties of turbid media

Consider a sample occupying a region $\Omega\subset\mathbb{R}^3$. In the typical SFDI geometry, the sample is a half-space $\{\mathbf{x}=(x,y,z):z>0\}$ whose surface $z=0$ is both illuminated and imaged; points on this surface are denoted by $\boldsymbol{\rho}=(x,y)$. A photon inside the sample may be absorbed, scattered, or continue propagating. The medium is assumed to be optically turbid, so that multiple scattering is common and the light reaching the detector has typically undergone many scattering events.

## Absorption and scattering coefficients

The absorption coefficient $\mu_a(\mathbf{x})$ and the scattering coefficient $\mu_s(\mathbf{x})$ are interaction rates per unit path length (units of inverse length, e.g. $\mathrm{mm}^{-1}$): over an infinitesimal path length $ds$, the probability that a photon is absorbed is $\mu_a(\mathbf{x})\,ds$, and the probability that it is scattered is $\mu_s(\mathbf{x})\,ds$, up to terms of order $ds^2$. The medium is assumed isotropic in its interaction rates, i.e. the coefficients may vary with position but not with the propagation direction. Their sum

$$
\mu_t(\mathbf{x})=\mu_a(\mathbf{x})+\mu_s(\mathbf{x})
$$

is the total interaction (extinction) coefficient. In a homogeneous medium, $1/\mu_t$ is the mean free path between interactions, and the albedo $\mu_s/\mu_t$ is the probability that an interaction is a scattering event.

For an uncollided beam travelling a distance $s$ through a homogeneous medium, the radiance $L$ (defined in Section <a href="#sec:rte" data-reference-type="ref" data-reference="sec:rte">3</a>) obeys

$$
\frac{dL}{ds}=-\mu_t L,
\qquad
L(s)=L(0)e^{-\mu_t s},
\tag{2}
$$

which is Beer–Lambert attenuation. Scattering contributes to this extinction because a photon scattered out of the beam no longer occupies its original directional state; its contribution to other directions is accounted for separately as in-scattering.

## Scattering phase function

The scattering coefficient $\mu_s$ determines how likely a scattering event is, while the scattering phase function $p(\hat{\mathbf{s}}',\hat{\mathbf{s}})$ determines the direction of the photon after the event. For a fixed incoming direction $\hat{\mathbf{s}}'\in S^2$, the phase function is a probability density per unit solid angle over the outgoing direction $\hat{\mathbf{s}}\in S^2$:

$$
P(\hat{\mathbf{s}}\in d\hat{\mathbf{s}}\mid\hat{\mathbf{s}}')=p(\hat{\mathbf{s}}',\hat{\mathbf{s}})\,d\hat{\mathbf{s}},
\qquad
\int_{S^2}p(\hat{\mathbf{s}}',\hat{\mathbf{s}})\,d\hat{\mathbf{s}}=1,
\tag{3}
$$

where $d\hat{\mathbf{s}}$ denotes the solid-angle element on the unit sphere. The phase function is therefore not itself the probability of a single direction, and the normalization expresses that a scattered photon leaves in *some* direction with probability one. For a rotation-invariant medium, $p$ depends only on the scattering angle $\theta$, defined by $\cos\theta=\hat{\mathbf{s}}\cdot\hat{\mathbf{s}}'$. Its first angular moment is the anisotropy factor

$$
g=\int_{S^2}(\hat{\mathbf{s}}\cdot\hat{\mathbf{s}}')\,p(\hat{\mathbf{s}}\cdot\hat{\mathbf{s}}')\,d\hat{\mathbf{s}}=\langle\cos\theta\rangle\in[-1,1],
\tag{4}
$$

which does not depend on the incoming direction $\hat{\mathbf{s}}'$. A value $g=0$ means no preference between forward and backward scattering, while $g\to1$ means strongly forward-peaked scattering. Biological tissue is strongly forward scattering, with $g$ typically between $0.8$ and $0.95$ in the visible and near-infrared range.

Examples of scattering phase functions include:

- **Isotropic scattering:** $p=1/(4\pi)$. Every outgoing direction is equally likely, and $g=0$.

- **Rayleigh scattering:** $p(\theta)=\frac{3}{16\pi}(1+\cos^2\theta)$. This describes scattering of unpolarized light by particles much smaller than the wavelength. The phase function is symmetric under $\theta\mapsto\pi-\theta$, i.e. forward and backward scattering are equally likely, so that again $g=0$.

- **Henyey–Greenstein scattering (Henyey and Greenstein 1941):** a one-parameter family

  $$
  p(\theta)=\frac{1}{4\pi}\,\frac{1-g^2}{(1+g^2-2g\cos\theta)^{3/2}},
  $$

  which is normalized over all outgoing directions and whose anisotropy factor (4) is exactly the parameter $g$. It reduces to isotropic scattering for $g=0$ and is widely used as a model for tissue.

## Reduced scattering and the parameters of interest

A forward-peaked scattering event changes the photon direction only slightly, so many such events are needed to randomize the direction. This is captured by the reduced scattering coefficient

$$
\mu_s'(\mathbf{x})=\mu_s(\mathbf{x})\,(1-g),
\tag{5}
$$

whose inverse $1/\mu_s'$ is the length scale over which the photon direction becomes randomized (the transport mean free path when $\mu_a\ll\mu_s'$). In tissue in the red and near-infrared range, typical values are $\mu_a\approx 0.001$–$0.1\,\mathrm{mm}^{-1}$ and $\mu_s'\approx 0.5$–$2\,\mathrm{mm}^{-1}$, so that $\mu_s'\gg\mu_a$.

As shown in Section <a href="#sec:diffusion" data-reference-type="ref" data-reference="sec:diffusion">4</a>, in the strongly scattering regime the diffuse light field depends on $\mu_s$ and $g$ only through $\mu_s'$. Diffuse measurements such as SFDI therefore cannot determine $\mu_s$ and $g$ separately, and the optical properties to be reconstructed are collected in the parameter field

$$
\boldsymbol{\theta}(\mathbf{x}) =
\begin{bmatrix}
\mu_a(\mathbf{x}) \\
\mu_s'(\mathbf{x})
\end{bmatrix}.
\tag{6}
$$

The goal of the reconstruction is not to recover individual photons or their paths. Instead, it is to estimate the (locally averaged) optical properties that best explain the measured response to a known set of illumination patterns.

# Radiative transfer equation

The radiative transfer equation (RTE) (Ishimaru 1978; Wang and Wu 2007) is a conservation law for photon number in phase space: position and direction together specify a photon’s state. It is a linear Boltzmann equation for photons moving through, and colliding with, a fixed background medium. This particle description neglects wave effects such as interference, diffraction, and polarization. It is useful when scatterers are randomly distributed and the length scales of interest are much larger than the optical wavelength.

## Photon density and radiance

Let $n_{\mathrm{ph}}(\mathbf{x},\hat{\mathbf{s}},t)$ be the expected photon number per unit volume per unit solid angle at position $\mathbf{x}$, moving in direction $\hat{\mathbf{s}}\in S^2$ at time $t$. Assume a constant refractive index $n_{\mathrm{r}}$ inside the medium, so that photons stream at the constant speed $c=c_0/n_{\mathrm{r}}$. For monochromatic light, the photon energy $h\nu$ can be absorbed into the normalization of the field. With that convention, the radiance is

$$
L(\mathbf{x},\hat{\mathbf{s}},t)=c\,n_{\mathrm{ph}}(\mathbf{x},\hat{\mathbf{s}},t).
\tag{7}
$$

Restoring the photon energy multiplies both the radiance and the source by the same constant $h\nu$. Radiance then measures energy flow per unit area, per unit solid angle, and per unit time.

## Balance on a phase-space control region

Choose an arbitrary spatial region $V\subset\Omega$ and an angular patch $\mathcal{A}\subset S^2$. The photon number in the product region $V\times\mathcal{A}$ is

$$
N(t)=\int_V\int_{\mathcal{A}}
n_{\mathrm{ph}}(\mathbf{x},\hat{\mathbf{s}},t)
\,d\hat{\mathbf{s}}\,d\mathbf{x}.
$$

Its time rate of change is the sum of streaming, extinction, in-scattering, and source contributions, which are derived in turn using the coefficients of Section <a href="#sec:optical-properties" data-reference-type="ref" data-reference="sec:optical-properties">2</a>.

#### Streaming.

Photons in direction $\hat{\mathbf{s}}$ have velocity $c\hat{\mathbf{s}}$, so the photon flux density in that direction is $c\,n_{\mathrm{ph}}\hat{\mathbf{s}}$. The contribution of streaming to $dN/dt$ is minus the outward flux through the spatial boundary,

$$
-\int_{\partial V}\int_{\mathcal{A}}
c\,n_{\mathrm{ph}}\,\hat{\mathbf{s}}\cdot\boldsymbol{\nu}
\,d\hat{\mathbf{s}}\,dA
=-\int_V\int_{\mathcal{A}}
c\,\hat{\mathbf{s}}\cdot\nabla n_{\mathrm{ph}}
\,d\hat{\mathbf{s}}\,d\mathbf{x},
$$

where $\boldsymbol{\nu}$ is the outward unit normal of $\partial V$. The divergence theorem is applied for each fixed direction, and $\nabla\cdot(n_{\mathrm{ph}}\hat{\mathbf{s}})=\hat{\mathbf{s}}\cdot\nabla n_{\mathrm{ph}}$ because $\hat{\mathbf{s}}$ does not depend on $\mathbf{x}$.

#### Extinction.

During time $dt$, a photon travels the distance $c\,dt$, so a fraction $\mu_t c\,dt$ leaves its current state by absorption or scattering. The resulting loss is

$$
-\int_V\int_{\mathcal{A}}
\mu_t c\,n_{\mathrm{ph}}\,d\hat{\mathbf{s}}\,d\mathbf{x}.
$$

#### In-scattering.

For every incoming direction $\hat{\mathbf{s}}'$, photons are scattered at the rate $\mu_s c\,n_{\mathrm{ph}}(\mathbf{x},\hat{\mathbf{s}}',t)$. By the definition (3) of the phase function, the fraction directed into $d\hat{\mathbf{s}}$ is $p(\hat{\mathbf{s}}',\hat{\mathbf{s}})\,d\hat{\mathbf{s}}$, so the gain in the patch is

$$
\int_V\int_{\mathcal{A}}
\left[\mu_s c\int_{S^2}
p(\hat{\mathbf{s}}',\hat{\mathbf{s}})\,
n_{\mathrm{ph}}(\mathbf{x},\hat{\mathbf{s}}',t)
\,d\hat{\mathbf{s}}'\right]
\,d\hat{\mathbf{s}}\,d\mathbf{x}.
$$

#### Sources.

Let $Q(\mathbf{x},\hat{\mathbf{s}},t)$ be the emission rate in photon number per unit volume, solid angle, and time. Its contribution is

$$
\int_V\int_{\mathcal{A}}Q\,d\hat{\mathbf{s}}\,d\mathbf{x}.
$$

## Localization and the radiance equation

Equating $dN/dt$ to these four contributions and moving the time derivative under the integral gives

$$
\begin{aligned}
\int_V\int_{\mathcal{A}}\Bigg[
&\partial_t n_{\mathrm{ph}}
+c\,\hat{\mathbf{s}}\cdot\nabla n_{\mathrm{ph}}
+\mu_t c\,n_{\mathrm{ph}}\notag\\
&-\mu_s c\int_{S^2}
p(\hat{\mathbf{s}}',\hat{\mathbf{s}})\,
n_{\mathrm{ph}}(\mathbf{x},\hat{\mathbf{s}}',t)
\,d\hat{\mathbf{s}}'
-Q
\Bigg]d\hat{\mathbf{s}}\,d\mathbf{x}=0.
\end{aligned}
$$

Because $V$ and $\mathcal{A}$ are arbitrary, the integrand vanishes almost everywhere in phase space; if it is continuous, it vanishes pointwise:

$$
\partial_t n_{\mathrm{ph}}
+c\,\hat{\mathbf{s}}\cdot\nabla n_{\mathrm{ph}}
+\mu_t c\,n_{\mathrm{ph}}
=\mu_s c\int_{S^2}
p(\hat{\mathbf{s}}',\hat{\mathbf{s}})\,
n_{\mathrm{ph}}(\mathbf{x},\hat{\mathbf{s}}',t)
\,d\hat{\mathbf{s}}'+Q.
$$

Substitute $L=c\,n_{\mathrm{ph}}$ and divide by $c$. The photon-number source $Q$ (photons per volume, solid angle, and time) then has the same units as radiance per unit length, so we may write $q=Q$ in the radiance equation. This yields the time-dependent RTE

$$
\frac{1}{c}\frac{\partial L}{\partial t}
+\hat{\mathbf{s}}\cdot\nabla L
+\left(\mu_a+\mu_s\right)L
=\mu_s\int_{S^2}
p(\hat{\mathbf{s}}',\hat{\mathbf{s}})\,
L(\mathbf{x},\hat{\mathbf{s}}',t)\,d\hat{\mathbf{s}}'
+q(\mathbf{x},\hat{\mathbf{s}},t),
\tag{15}
$$

where all coefficients are evaluated at $\mathbf{x}$. SFDI uses illumination that is constant in time (on the time scale of photon transport), so $\partial_t L=0$ and the equation reduces to the steady RTE

$$
\hat{\mathbf{s}}\cdot\nabla L
+\mu_t L
=\mu_s\int_{S^2}
p(\hat{\mathbf{s}}',\hat{\mathbf{s}})\,
L(\mathbf{x},\hat{\mathbf{s}}')\,d\hat{\mathbf{s}}'
+q(\mathbf{x},\hat{\mathbf{s}}).
\tag{16}
$$

The streaming and extinction terms on the left describe transport out of a local phase-space state, while the integral on the right accounts for photons scattered into its direction. The RTE must be supplemented by a boundary condition that prescribes the radiance entering the medium, $L(\mathbf{x},\hat{\mathbf{s}})$ for $\mathbf{x}\in\partial\Omega$ and $\hat{\mathbf{s}}\cdot\boldsymbol{\nu}<0$; the illumination enters the problem either through this condition or through the source $q$.

The RTE is the most complete description of the problem considered here, but it is usually too expensive to invert directly. The unknown $L$ depends on five variables (three spatial and two angular), the scattering integral couples all directions, and although the equation is linear in $L$ and $q$, the map from the optical properties $\boldsymbol\theta$ to the light field is nonlinear. In practice, the RTE is solved by Monte Carlo simulation, which serves as a reference for the approximations below. The following section reduces the RTE to a scalar equation that is better suited for imaging and reconstruction.

# Diffusion approximation

The diffusion approximation applies when scattering dominates absorption ($\mu_s'\gg\mu_a$) and the light field is considered at distances from sources and boundaries that are large compared with the transport mean free path $1/\mu_s'$. In this regime, the photon directions are nearly randomized and the radiance is almost isotropic. The directional field can then be described by its two lowest angular moments: the fluence rate

$$
\phi(\mathbf{x}) = \int_{S^2} L(\mathbf{x},\hat{\mathbf{s}})\,d\hat{\mathbf{s}},
$$

which is the angular integral of the radiance (that is, $4\pi$ times its angular average), and the flux vector

$$
\mathbf{J}(\mathbf{x}) = \int_{S^2} \hat{\mathbf{s}}\,L(\mathbf{x},\hat{\mathbf{s}})\,d\hat{\mathbf{s}},
$$

which describes the small net flow of light. The diffusion equation follows by taking the zeroth and first angular moments of the steady RTE (16) and closing the resulting system with an approximation for $L$.

## Zeroth moment: photon balance

Integrate (16) over all directions. By the normalization (3), the in-scattering term becomes

$$
\mu_s\int_{S^2}\int_{S^2}p(\hat{\mathbf{s}}',\hat{\mathbf{s}})\,L(\mathbf{x},\hat{\mathbf{s}}')\,d\hat{\mathbf{s}}'\,d\hat{\mathbf{s}}
=\mu_s\int_{S^2}L(\mathbf{x},\hat{\mathbf{s}}')\,d\hat{\mathbf{s}}'=\mu_s\phi,
$$

which cancels the scattering part of $\mu_t\phi=(\mu_a+\mu_s)\phi$: scattering redistributes photons between directions but does not remove them. The streaming term becomes a divergence,

$$
\int_{S^2}\hat{\mathbf{s}}\cdot\nabla L\,d\hat{\mathbf{s}}
= \nabla\cdot\int_{S^2}\hat{\mathbf{s}}\,L\,d\hat{\mathbf{s}}=\nabla\cdot\mathbf{J}.
$$

With the isotropic source density $q_0(\mathbf{x})=\int_{S^2}q(\mathbf{x},\hat{\mathbf{s}})\,d\hat{\mathbf{s}}$, the zeroth angular moment is

$$
\nabla\cdot\mathbf{J}(\mathbf{x}) + \mu_a(\mathbf{x})\phi(\mathbf{x}) = q_0(\mathbf{x}).
\tag{19}
$$

This is a local photon balance: the net outflow of light is balanced by absorption and by the source. It is exact, but it contains two unknowns, $\phi$ and $\mathbf{J}$.

## First moment and the $P_1$ closure

To obtain a second equation, multiply (16) by $\hat{\mathbf{s}}$ and integrate over directions:

$$
\nabla\cdot\int_{S^2}\hat{\mathbf{s}}\hat{\mathbf{s}}^{\mathsf T} L\,d\hat{\mathbf{s}}
+\mu_t\mathbf{J}
=
\mu_s\int_{S^2}\int_{S^2}
\hat{\mathbf{s}}\,p(\hat{\mathbf{s}}',\hat{\mathbf{s}})\,
L(\mathbf{x},\hat{\mathbf{s}}')\,d\hat{\mathbf{s}}'\,d\hat{\mathbf{s}}
+ \int_{S^2}\hat{\mathbf{s}}\,q(\mathbf{x},\hat{\mathbf{s}})\,d\hat{\mathbf{s}}.
\tag{20}
$$

The first term involves the second angular moment of $L$, so the hierarchy of moment equations does not close by itself. In a nearly isotropic field, the radiance is approximated by the first two terms of its expansion in spherical harmonics (the $P_1$ approximation),

$$
L(\mathbf{x},\hat{\mathbf{s}})
\approx \frac{1}{4\pi}\phi(\mathbf{x})
+\frac{3}{4\pi}\mathbf{J}(\mathbf{x})\cdot\hat{\mathbf{s}},
\tag{21}
$$

whose prefactors are chosen such that (21) reproduces $\phi$ and $\mathbf{J}$ exactly. The terms of (20) are then evaluated with the following identities:

- $\int_{S^2}\hat{\mathbf{s}}\hat{\mathbf{s}}^{\mathsf T}\,d\hat{\mathbf{s}}= \frac{4\pi}{3}I$, and odd moments such as $\int_{S^2}\hat{\mathbf{s}}\hat{\mathbf{s}}^{\mathsf T}(\mathbf{J}\cdot\hat{\mathbf{s}})\,d\hat{\mathbf{s}}$ vanish. Hence the first term becomes $\nabla\cdot\left(\frac{\phi}{3}I\right)=\frac13\nabla\phi$.

- For a rotation-invariant phase function, $\int_{S^2}\hat{\mathbf{s}}\,p(\hat{\mathbf{s}}',\hat{\mathbf{s}})\,d\hat{\mathbf{s}}=g\,\hat{\mathbf{s}}'$, since by symmetry the integral must be parallel to $\hat{\mathbf{s}}'$ and its component along $\hat{\mathbf{s}}'$ is $g$ by (4). Hence the in-scattering term becomes $\mu_s g\int_{S^2}\hat{\mathbf{s}}'L(\mathbf{x},\hat{\mathbf{s}}')\,d\hat{\mathbf{s}}'=\mu_s g\,\mathbf{J}$.

- The source is assumed to be isotropic (or its first moment is neglected), so the last term vanishes.

Collecting the terms and using $\mu_t-\mu_s g=\mu_a+\mu_s(1-g)$ gives the first moment equation

$$
\frac{1}{3}\nabla\phi(\mathbf{x}) + \mu_{\mathrm{tr}}(\mathbf{x})\,\mathbf{J}(\mathbf{x}) = 0,
\tag{22}
$$

where the transport coefficient is

$$
\mu_{\mathrm{tr}}(\mathbf{x})
=
\mu_a(\mathbf{x})+
\mu_s(\mathbf{x})(1-g)
=\mu_a(\mathbf{x})+\mu_s'(\mathbf{x}).
\tag{23}
$$

## The diffusion equation

Equation (22) is Fick’s law of diffusion, with anisotropic scattering accounted for through $\mu_s'$:

$$
\mathbf{J} = -D\nabla\phi,
\qquad
D(\mathbf{x}) = \frac{1}{3\mu_{\mathrm{tr}}(\mathbf{x})}=\frac{1}{3(\mu_a(\mathbf{x})+\mu_s'(\mathbf{x}))}.
\tag{24}
$$

Some authors use $D=1/(3\mu_s')$ instead; the difference is negligible when $\mu_a\ll\mu_s'$. Substituting Fick’s law into the photon balance (19) gives the diffusion equation

$$
-\nabla\cdot\left(D(\mathbf{x})\nabla\phi(\mathbf{x})\right)
+\mu_a(\mathbf{x})\phi(\mathbf{x})
=q_0(\mathbf{x}),
\tag{25}
$$

where $D$ is the diffusion coefficient and $q_0$ is the isotropic source term. Note that the model depends on the optical properties only through $\mu_a$ and $\mu_s'$, which justifies the choice of parameters in (6). In a homogeneous medium, the diffusion equation reduces to the modified Helmholtz equation

$$
\nabla^2\phi-\mu_{\mathrm{eff}}^2\phi=-\frac{q_0}{D},
\qquad
\mu_{\mathrm{eff}}=\sqrt{\frac{\mu_a}{D}}=\sqrt{3\mu_a(\mu_a+\mu_s')},
\tag{26}
$$

whose solutions away from sources decay on the length scale $1/\mu_{\mathrm{eff}}$, the effective penetration depth of diffuse light. In a heterogeneous medium, $D$ varies with position; in media with oriented microstructure (e.g. fibrous tissue), $D$ may even be replaced by a tensor, which goes beyond the isotropic model assumed here.

## Boundary conditions

The diffusion equation must be completed by boundary conditions. Since no diffuse light enters the medium from outside, the inward-directed partial current at the boundary is set to zero, apart from the light that is reflected back into the medium by the refractive-index mismatch at the surface (Haskell et al. 1994). Within the $P_1$ approximation, this yields the Robin (partial-current) boundary condition

$$
D\frac{\partial\phi}{\partial\nu}+A\,\phi=0
\quad\text{on }\partial\Omega,
\qquad
A=\frac{1-R_{\mathrm{eff}}}{2(1+R_{\mathrm{eff}})},
\tag{27}
$$

where $\partial/\partial\nu$ is the derivative along the outward normal and $R_{\mathrm{eff}}$ is the effective reflection coefficient of the boundary, which can be computed from the Fresnel equations. For an index-matched boundary, $R_{\mathrm{eff}}=0$ and $A=1/2$; for tissue ($n_{\mathrm{r}}\approx1.4$) against air, $R_{\mathrm{eff}}\approx0.49$ and $A\approx0.17$. The diffuse reflectance, i.e. the flux leaving the medium through the boundary, is then

$$
R=\mathbf{J}\cdot\boldsymbol{\nu}=-D\frac{\partial\phi}{\partial\nu}=A\,\phi
\quad\text{on }\partial\Omega.
\tag{28}
$$

A general configuration has an illumination boundary $\Gamma_\mathrm{in}$ and a collection boundary $\Gamma_\mathrm{out}$. Collimated illumination incident on $\Gamma_\mathrm{in}$ is commonly modelled by an isotropic source inside the medium, representing the photons at their first scattering event; for normal incidence on the half-space $z>0$ with incident irradiance $I(\boldsymbol{\rho})$, a standard choice is

$$
q_0(\boldsymbol{\rho},z)=\mu_s'\,I(\boldsymbol{\rho})\,e^{-\mu_{\mathrm{tr}}z},
\tag{29}
$$

i.e. Beer–Lambert attenuation (2) of the incident beam with the reduced coefficients. The detector measures the reflectance (28) on $\Gamma_\mathrm{out}$. In the reflectance geometry of SFDI, both boundaries coincide with the imaged surface $z=0$.

## Validity

The diffusion approximation reduces the full directional transport model to a scalar elliptic problem. It is appropriate when scattering dominates absorption, the medium is optically thick, and the detector measures the angularly integrated reflectance rather than the direction of individual photons. Its accuracy degrades within a few transport mean free paths of sources and boundaries, in weakly scattering or strongly absorbing regions, and, in SFDI, at high spatial frequencies, where the illumination varies on length scales comparable to $1/\mu_s'$ (see Section <a href="#sec:modulation" data-reference-type="ref" data-reference="sec:modulation">5</a>). In these cases, Monte Carlo solutions of the RTE are used instead. These limitations should be kept in mind when interpreting an experimental reconstruction.

# Spatial-frequency modulation

## Modulated illumination

Spatial-frequency modulation encodes a known spatial pattern into the illumination. Typically, a projector illuminates the surface $z=0$ with a sinusoidal pattern

$$
I_j(\boldsymbol{\rho})
=
I_0(\boldsymbol{\rho})
\left[1+m\cos\left(2\pi\mathbf{f}_j\cdot\boldsymbol{\rho}+
\alpha_j\right)\right],
\tag{30}
$$

where $\mathbf{f}_j$ is the spatial frequency vector (in cycles per unit length, e.g. $\mathrm{mm}^{-1}$), $m\in(0,1]$ is the modulation depth, and $\alpha_j$ is the spatial phase of the pattern. Often, the pattern varies along one direction only, $\mathbf{f}_j=(f_j,0)$. The spatial frequency determines the length scale $1/|\mathbf{f}_j|$ of the illumination pattern: a high spatial frequency produces a pattern with short spatial variations, while a low spatial frequency produces a slowly varying pattern; $\mathbf{f}_j=\mathbf 0$ corresponds to planar illumination. It is convenient to also introduce the angular spatial frequency $k_j=2\pi|\mathbf{f}_j|$.

## Linear response and spatial transfer function

For each setting $j$, the incident pattern is inserted into the source term (29) of the diffusion equation (25), and the resulting fluence rate is denoted by $\phi_j(\mathbf{x})$. Since the diffusion equation is linear in the source, the constant part and the modulated part of (30) propagate independently, and the response to (30) is the superposition of the responses to its components. Moreover, if the medium is laterally homogeneous (its properties depend at most on $z$), the problem is invariant under lateral translations, and complex exponentials $e^{i2\pi\mathbf{f}\cdot\boldsymbol{\rho}}$ are eigenfunctions of the transport problem: a sinusoidal illumination produces a sinusoidal reflectance with the same frequency, scaled by a factor that depends only on $|\mathbf{f}|$. In this case, the medium is completely characterized by its spatial transfer function, the diffuse reflectance $R_d(f)$ as a function of spatial frequency. Without a lateral shift of the reflected pattern, this transfer function is real-valued and plays the role of a modulation transfer function of the turbid medium.

## Analytical solution for a homogeneous half-space

For a homogeneous half-space $z>0$ illuminated with $I(\boldsymbol{\rho})=I_0\cos(k x)$, the ansatz $\phi(\mathbf{x})=\varphi(z)\cos(kx)$ reduces (25) with the source (29) to the ordinary differential equation

$$
\varphi''(z)-\mu_{\mathrm{eff}}'^2\varphi(z)
=-3\mu_{\mathrm{tr}}\mu_s' I_0\,e^{-\mu_{\mathrm{tr}}z},
\qquad
\mu_{\mathrm{eff}}'=\sqrt{\mu_{\mathrm{eff}}^2+k^2},
\tag{31}
$$

where $\mu_{\mathrm{tr}}=\mu_a+\mu_s'$ as in (23). The lateral modulation thus simply increases the effective attenuation coefficient from $\mu_{\mathrm{eff}}$ to $\mu_{\mathrm{eff}}'$. The bounded solution is

$$
\varphi(z)=C e^{-\mu_{\mathrm{tr}}z}+B e^{-\mu_{\mathrm{eff}}' z},
\qquad
C=\frac{3a' I_0}{(\mu_{\mathrm{eff}}'/\mu_{\mathrm{tr}})^2-1},
\qquad
a'=\frac{\mu_s'}{\mu_{\mathrm{tr}}},
$$

where $a'$ is the reduced albedo, and the boundary condition (27), which reads $D\varphi'(0)=A\varphi(0)$ at $z=0$, determines

$$
B=-C\,\frac{1+3A}{\mu_{\mathrm{eff}}'/\mu_{\mathrm{tr}}+3A}.
$$

By (28), the diffuse reflectance $R_d=A\varphi(0)/I_0$ is (Cuccia et al. 2009)

$$
R_d(k)=\frac{3A\,a'}{\left(\mu_{\mathrm{eff}}'/\mu_{\mathrm{tr}}+1\right)\left(\mu_{\mathrm{eff}}'/\mu_{\mathrm{tr}}+3A\right)}.
\tag{32}
$$

Two limits illustrate the formula. For a non-absorbing medium under planar illumination ($\mu_a=0$, $k=0$), we have $a'=1$ and $\mu_{\mathrm{eff}}'=0$, so $R_d=1$: all light eventually leaves the medium. For $k\to\infty$, $\mu_{\mathrm{eff}}'\to\infty$ and $R_d\to0$: very fine patterns are completely blurred by scattering.

## Why several spatial frequencies are needed

Equation (32) shows how the spatial frequency separates the two optical properties. At $k=0$, the reflectance depends on $\mu_a$ mainly through $\mu_{\mathrm{eff}}=\sqrt{3\mu_a\mu_{\mathrm{tr}}}$, and light penetrates to a depth of order $1/\mu_{\mathrm{eff}}$. At high spatial frequencies, $k\gg\mu_{\mathrm{eff}}$, so that $\mu_{\mathrm{eff}}'\approx k$ is nearly independent of $\mu_a$; the reflectance is then determined mainly by $\mu_s'$, and the penetration depth $1/\mu_{\mathrm{eff}}'\approx1/k$ is small. For example, with $\mu_a=0.01\,\mathrm{mm}^{-1}$ and $\mu_s'=1\,\mathrm{mm}^{-1}$, the penetration depth $1/\mu_{\mathrm{eff}}'$ is about $5.7\,\mathrm{mm}$ at $f=0$ but only about $0.8\,\mathrm{mm}$ at $f=0.2\,\mathrm{mm}^{-1}$. A single measurement cannot distinguish a change in absorption from a change in scattering, but the pair $(R_d(0),R_d(k))$ with $k$ sufficiently large determines $(\mu_a,\mu_s')$ uniquely. Additional frequencies improve robustness and, because each frequency probes a different depth, provide depth information.

If the medium is laterally heterogeneous, translation invariance is lost: frequencies are mixed and the response is no longer a pointwise multiplication in the Fourier domain. The diffusion equation is still linear in $\phi$, but the dependence of the measured response on the optical properties remains nonlinear. Nevertheless, the response at each frequency is associated with a different spatial scale and depth, so multiple spatial frequencies provide a structured set of measurements that reveals the spatial variation of absorption and scattering. In practice, the optical properties are often assumed to vary slowly compared with the length scales $1/\mu_{\mathrm{eff}}'$, so that (32) can be applied locally at each pixel (Section <a href="#sec:inverse" data-reference-type="ref" data-reference="sec:inverse">7</a>).

# Measurement and demodulation

## Data model

At each spatial-frequency setting, a camera records an image of the diffusely reflected light. This image contains the response to the modulated illumination, the response to its constant part, ambient light, and the response of the instrument itself. Because transport is linear, the recorded image for a pattern with phase $\alpha$ has the form

$$
I_{j}(\boldsymbol{\rho};\alpha)=M_{\mathrm{DC},j}(\boldsymbol{\rho})
+M_{\mathrm{AC},j}(\boldsymbol{\rho})\cos\left(2\pi\mathbf{f}_j\cdot\boldsymbol{\rho}+\alpha+\psi_j(\boldsymbol{\rho})\right),
\tag{33}
$$

where $M_{\mathrm{DC},j}$ is the unmodulated background (including ambient light), $M_{\mathrm{AC},j}$ is the amplitude of the reflected pattern, and $\psi_j$ is a phase shift, which is caused by lateral heterogeneity of the medium and by the surface topography. The quantity of interest is the amplitude envelope $M_{\mathrm{AC},j}(\boldsymbol{\rho})$. Stacking the demodulated data of all settings, a simple data model is

$$
\mathbf{d}_j =
\mathbf{H}_j(\boldsymbol{\theta})+
\boldsymbol{\epsilon}_j,
\tag{34}
$$

where $\mathbf{H}_j$ is the forward measurement operator associated with the $j$th spatial frequency, $\boldsymbol{\theta}$ contains the optical parameters, and $\boldsymbol{\epsilon}_j$ represents noise and calibration error.

## Synchronous demodulation by phase stepping

A convenient way to separate the modulated component from the background is synchronous demodulation. In SFDI, it is performed in the spatial domain: the same frequency is projected with $N\geq3$ equally spaced phases $\alpha_n=2\pi n/N$, $n=0,\dots,N-1$, and the images $I_{j,n}=I_j(\,\cdot\,;\alpha_n)$ are multiplied by the known reference signals and summed over one period of the phase. The in-phase and quadrature components are

$$
D_j^{\mathrm{I}} =
\frac{2}{N}\sum_{n=0}^{N-1} I_{j,n}\cos\alpha_n,
\qquad
D_j^{\mathrm{Q}} =
-\frac{2}{N}\sum_{n=0}^{N-1} I_{j,n}\sin\alpha_n.
$$

Since $\sum_n\cos\alpha_n=\sum_n\sin\alpha_n=0$ and $\sum_n e^{2i\alpha_n}=0$ for $N\geq3$, the background $M_{\mathrm{DC},j}$ cancels, and the complex demodulated signal $D_j=D_j^{\mathrm{I}}+iD_j^{\mathrm{Q}}$ satisfies

$$
D_j(\boldsymbol{\rho})=M_{\mathrm{AC},j}(\boldsymbol{\rho})\,e^{i(2\pi\mathbf{f}_j\cdot\boldsymbol{\rho}+\psi_j(\boldsymbol{\rho}))}.
$$

The amplitude and phase follow as

$$
M_{\mathrm{AC},j}=|D_j| = \sqrt{(D_j^{\mathrm{I}})^2+(D_j^{\mathrm{Q}})^2},
\qquad
\arg(D_j)=\operatorname{atan2}(D_j^{\mathrm{Q}},D_j^{\mathrm{I}}),
$$

and the phase $\psi_j$ is obtained by subtracting the known carrier $2\pi\mathbf{f}_j\cdot\boldsymbol{\rho}$. For the most common choice $N=3$ (phases $0$, $2\pi/3$, $4\pi/3$), the amplitude takes the well-known form (Cuccia et al. 2005)

$$
\begin{aligned}
M_{\mathrm{AC},j}&=\frac{\sqrt2}{3}
\sqrt{(I_{j,0}-I_{j,1})^2+(I_{j,1}-I_{j,2})^2+(I_{j,2}-I_{j,0})^2},
\tag{37}\\
M_{\mathrm{DC},j}&=\frac{1}{3}\left(I_{j,0}+I_{j,1}+I_{j,2}\right).
\notag
\end{aligned}
$$

Note that this is a pixel-wise operation: the demodulated amplitude retains the full spatial resolution of the camera.

<div class="remark">

*Remark 1*. This procedure is the spatial analogue of lock-in detection, which uses a temporal reference modulation to isolate the component of a detector signal at a known modulation frequency. In both cases, unmodulated background light and noise outside the modulation frequency are suppressed. Temporal modulation at radio frequencies is the basis of the related frequency-domain diffuse optical spectroscopy, where the measured phase delay helps to distinguish absorption from scattering; in SFDI, this role is taken by the measurement at several spatial frequencies, while the spatial phase $\psi_j$ is mainly used to correct for surface topography.

</div>

## Calibration

The amplitude $M_{\mathrm{AC},j}$ still contains the illumination intensity and the transfer function of the projector and camera optics, which also attenuate high spatial frequencies. To remove these, the same measurement is repeated on a reference phantom with known optical properties, for which the diffuse reflectance $R_{d,\mathrm{ref}}^{\mathrm{model}}(f_j)$ can be predicted by (32) or by Monte Carlo simulation. The calibrated diffuse reflectance is

$$
R_d(\boldsymbol{\rho},f_j)=
\frac{M_{\mathrm{AC},j}(\boldsymbol{\rho})}{M_{\mathrm{AC},j}^{\mathrm{ref}}(\boldsymbol{\rho})}\,
R_{d,\mathrm{ref}}^{\mathrm{model}}(f_j).
\tag{38}
$$

The ratio cancels all multiplicative instrument factors, provided that the sample and the reference are measured in the same geometry.

The calibrated reflectance is still a measured quantity, not a reconstruction of the optical properties. The reconstruction requires a forward model that maps the physical parameters to the calibrated measurements.

# Inverse problem

The inverse problem is to find the parameter field $\boldsymbol{\theta}$ that best explains the measured data. Let $\mathcal{H}$ denote the complete measurement operator, combining the forward model for all spatial-frequency settings with the measurement model of Section <a href="#sec:measurement" data-reference-type="ref" data-reference="sec:measurement">6</a>. The data model can be written as

$$
\mathbf{d}=
\mathcal{H}(\boldsymbol{\theta})+
\boldsymbol{\epsilon},
\tag{39}
$$

where $\mathbf{d}$ stacks the calibrated reflectances $R_d(\boldsymbol{\rho},f_j)$ of all pixels and frequencies, $\boldsymbol{\theta}$ contains the spatially varying optical properties (6), and $\boldsymbol{\epsilon}$ represents measurement noise and model error.

## Pixel-wise inversion

In standard SFDI, the medium is assumed to be locally homogeneous, so that the measurement at pixel $\boldsymbol{\rho}$ depends only on $\boldsymbol\theta(\boldsymbol{\rho})$ through the homogeneous model (32). The inverse problem then decouples into one small nonlinear problem per pixel:

$$
\boldsymbol\theta(\boldsymbol{\rho})=\arg\min_{\mu_a,\mu_s'\geq0}\;
\sum_j w_j\left(R_d(\boldsymbol{\rho},f_j)-R_d^{\mathrm{model}}(f_j;\mu_a,\mu_s')\right)^2,
\tag{40}
$$

with weights $w_j$ reflecting the measurement uncertainty. With two frequencies (typically $f=0$ and $f\approx0.1$–$0.2\,\mathrm{mm}^{-1}$), (40) is a system of two equations in two unknowns. Rather than solving it iteratively at every pixel, one typically precomputes a lookup table of $(R_d(0),R_d(f))$ on a grid of $(\mu_a,\mu_s')$, generated with the diffusion model or with Monte Carlo simulations, and inverts it by interpolation. This makes the reconstruction fast enough for real-time imaging. Repeating the measurement at several wavelengths and fitting the absorption spectra of known chromophores (e.g. oxy- and deoxyhemoglobin) yields maps of their concentrations (Gioux, Mazhar, and Cuccia 2019).

## Regularized reconstruction

When lateral heterogeneity or the depth distribution of the optical properties cannot be neglected, as in spatial-frequency-domain tomography (Cuccia et al. 2005), the full forward model (25) must be solved on a discretized domain, and $\boldsymbol{\theta}$ is a discretized field with many more unknowns than there are pixels. A typical reconstruction then minimizes the regularized objective

$$
\mathcal{J}(\boldsymbol{\theta})=
\frac{1}{2}\left\|
\mathbf{W}^{1/2}
\left(\mathbf{d}-\mathcal{H}(\boldsymbol{\theta})\right)
\right\|_2^2
+
\lambda\mathcal{R}(\boldsymbol{\theta}),
\tag{41}
$$

where $\mathbf{W}$ is a weighting matrix, ideally the inverse of the noise covariance, $\mathcal{R}$ is a regularization term, and $\lambda>0$ balances data fit and regularization. The regularizer can enforce smoothness, sparsity of edges, or agreement with a prior model, while positivity and physical bounds are usually imposed as constraints. Regularization is necessary because the inverse problem is ill-posed (Arridge 1999): diffuse light blurs spatial structure, particularly at depth, so the data are insensitive to fine details of $\boldsymbol\theta$, and small measurement errors can lead to large parameter changes. In addition, the problem is nonlinear and typically has more unknowns than independent measurements.

Identifiability depends on the amount of independent information contained in the data. At a minimum, the experiment needs enough spatial-frequency settings and enough independent detector measurements to distinguish absorption from scattering and to separate the optical properties from the source and detector characteristics, which is the purpose of the calibration (38). A single intensity measurement at one spatial frequency does not provide enough information to recover both optical parameters, not even in a homogeneous sample, and, as noted above, $\mu_s$ and $g$ cannot be recovered separately from diffuse measurements at all.

## Practical reconstruction algorithm

Algorithm <a href="#alg:reconstruction" data-reference-type="ref" data-reference="alg:reconstruction">[alg:reconstruction]</a> shows a regularized iterative method for (41). It is intentionally implementation-agnostic and describes the relationship between the forward model, the data term, the regularization term, and the parameter update. The forward model is solved for every spatial-frequency setting, the predicted measurements are compared with the data, and the parameters are updated in a descent direction of the objective. A detailed implementation is expected to use a physically meaningful initialization (e.g. the result of the pixel-wise inversion), a reliable data-weighting strategy, and a regularization term that preserves the desired spatial structure.

<div class="algorithm">

$\boldsymbol\theta\leftarrow\operatorname{proj}_\Theta(\boldsymbol\theta_0)$

</div>

The forward solver computes the expected measurements for the current parameter field, while the gradient describes how the objective changes when the optical parameters are altered. An adjoint solver computes the full gradient at the cost of one additional linear solve per spatial-frequency setting, independently of the number of parameters. Finite differences, which require one additional forward solve per parameter, are only an option when the number of parameters is small or the forward model cannot easily be differentiated. Because the problem is nonlinear, Gauss–Newton or Levenberg–Marquardt updates, which use the Jacobian of $\mathcal H$, typically converge in far fewer iterations than plain gradient descent.

A robust implementation should also include the following checks:

- enforce nonnegative absorption and reduced scattering coefficients;

- constrain the reduced scattering coefficient to a physically meaningful range;

- use the measured uncertainty of each spatial-frequency channel as the data weight;

- report the objective value and parameter change at every iteration;

- test the reconstruction with synthetic data whose true optical properties are known, generated with a different forward model (e.g. Monte Carlo) than the one used for the inversion, to avoid an “inverse crime”;

- validate the final result against held-out measurements or independent calibration data, such as phantoms with known optical properties.

# Summary

The spatial-frequency-domain imaging workflow can be summarized as follows:

1.  describe light transport in a turbid medium by the radiative transfer equation;

2.  reduce the directional radiative transfer problem to a scalar diffusion model, which depends on the optical properties only through $\mu_a$ and $\mu_s'$;

3.  illuminate the sample with sinusoidal patterns at several spatial frequencies and phases;

4.  demodulate the camera images pixel-wise to extract the amplitude of the reflected pattern and to remove the background;

5.  calibrate the amplitudes with a reference phantom to obtain the diffuse reflectance $R_d(\boldsymbol{\rho},f_j)$; and

6.  solve the inverse problem, either pixel-wise with a lookup table or as a regularized reconstruction, to estimate the absorption and reduced scattering fields.

The result is a sequence of physically meaningful transformations rather than a single direct measurement. This structure makes the model assumptions, the measurement procedure, and the reconstruction step explicit and allows each stage to be tested independently.

<div id="refs" class="references csl-bib-body hanging-indent" entry-spacing="0">

<div id="ref-Arridge1999" class="csl-entry">

Arridge, Simon R. 1999. “Optical Tomography in Medical Imaging.” *Inverse Problems* 15 (2): R41–93.

</div>

<div id="ref-Cuccia2009" class="csl-entry">

Cuccia, David J., Frédéric Bevilacqua, Anthony J. Durkin, Frederick R. Ayers, and Bruce J. Tromberg. 2009. “Quantitation and Mapping of Tissue Optical Properties Using Modulated Imaging.” *Journal of Biomedical Optics* 14 (2): 024012.

</div>

<div id="ref-Cuccia2005" class="csl-entry">

Cuccia, David J., Frédéric Bevilacqua, Anthony J. Durkin, and Bruce J. Tromberg. 2005. “Modulated Imaging: Quantitative Analysis and Tomography of Turbid Media in the Spatial-Frequency Domain.” *Optics Letters* 30 (11): 1354–56.

</div>

<div id="ref-Gioux2019" class="csl-entry">

Gioux, Sylvain, Amaan Mazhar, and David J. Cuccia. 2019. “Spatial Frequency Domain Imaging in 2019: Principles, Applications, and Perspectives.” *Journal of Biomedical Optics* 24 (7): 071613.

</div>

<div id="ref-Haskell1994" class="csl-entry">

Haskell, Richard C., Lars O. Svaasand, Tsong-Tseh Tsay, Ti-Chen Feng, Matthew S. McAdams, and Bruce J. Tromberg. 1994. “Boundary Conditions for the Diffusion Equation in Radiative Transfer.” *Journal of the Optical Society of America A* 11 (10): 2727–41.

</div>

<div id="ref-HenyeyGreenstein1941" class="csl-entry">

Henyey, Louis G., and Jesse L. Greenstein. 1941. “Diffuse Radiation in the Galaxy.” *The Astrophysical Journal* 93: 70–83.

</div>

<div id="ref-Ishimaru1978" class="csl-entry">

Ishimaru, Akira. 1978. *Wave Propagation and Scattering in Random Media*. New York: Academic Press.

</div>

<div id="ref-WangWu2007" class="csl-entry">

Wang, Lihong V., and Hsin-I Wu. 2007. *Biomedical Optics: Principles and Imaging*. Hoboken, NJ: Wiley.

</div>

</div>
