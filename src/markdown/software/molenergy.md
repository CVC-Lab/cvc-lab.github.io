---
title: "MolEnergy"
slug: "/software/molenergy"
---

<img src="https://www.cs.utexas.edu/~bajaj/cvc/software/images/1A2K-1.png" alt="" title="MolEnergy-1A2K-1" width="255" height="162"><img src="https://www.cs.utexas.edu/~bajaj/cvc/software/images/1A2K-2.png" alt="" title="MolEnergy-1A2k-3" width="255" height="162"><img src="https://www.cs.utexas.edu/~bajaj/cvc/software/images/1A2K-3.png" alt="" title="MolEnergy-1A2K-3" width="255" height="162">  
_MolEnergy_ is a library of routines for efficiently computing molecular free energies. The primary components are:

- Octree-based approximation algorithms for computing pairwise Lennard-Jones and Coulombic potentials, Born radii and generalized Born polarization energy,
- Nonuniform fast Fourier transform approach (using [](http://www-user.tu-chemnitz.de/~potts/nfft)NFFT) to computing generalized Born polarization energy, and
- Kernel independent fast multipole-based boundary element solver for the Poisson-Boltmzann equation (using [](http://mrl.nyu.edu/~harper/kifmm3d/documentation)KIFMM3d and [](http://www.mcs.anl.gov/petsc)PETSc).

### References

C. Bajaj, S.-C. Chen and A. Rand  
**An Efficient Higher-Order Fast Multipole Boundary Element Solution for Poisson-Boltzmann Based molecular Electrostatics**  
_SIAM Journal on Scientific Computing, 33(2) 826-848, 2011, NIHMSID# 266230, PMCID: PMC3110014._ [(pdf)](http://www.ncbi.nlm.nih.gov/pmc/articles/PMC3110014/?tool=myncbi)

C. Bajaj, W. Zhao  
**Fast Molecular Solvation Energetics and Force Computation**  
_SIAM Journal on Scientific Computing, 31(6): 4524-4552, January 2010, [http://tinyurl.com/PMC2830669](http://tinyurl.com/PMC2830669), PMCID: PMC2830669_

C. Bajaj and R. Chowdhury  
**Multi-level Grid Algorithms for Faster Molecular Energetics**  
_Proceedings of the ACM Symposium on Solid and Physical Modeling, pp. 147-152, Sept. 2010_

### Download

Most _MolEnergy_ functionality can be interfaced through _[TexMol](../texmol)_.

Binaries for the command line utility: [linux](http://cvcweb.ices.utexas.edu/software/binaries/MolEnergy.ubuntu10.20110118) (ubuntu), [mac](http://cvcweb.ices.utexas.edu/software/binaries/MolEnergy.macOSXv10.5.20110114)

### Source

- Currently the source code is distributed only for academic use. Users interested in commercial licensing should contact licensing@otc.utexas.edu

- [Request academic license](http://cvcweb.ices.utexas.edu/software/license/MolEnergy.license_mail.php)

- [Download source](http://cvcweb.ices.utexas.edu/cvcwp/?page_id=2455)

### Software Usage

Software usage details and sample data to appear soon.
