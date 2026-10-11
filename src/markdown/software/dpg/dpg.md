---
title: "DPG"
slug: "/software/dpg"
---

<p><img src="https://www.cs.utexas.edu/~bajaj/cvc/software/images/DPGDataStruct.jpeg" alt="" width="1089" height="723"></p>

### Description

_DPG_ can efficiently maintain the molecular surface using only linear space and supports quasi-constant time insertion, deletion and movement (i.e., updates) of atoms or groups of atoms. _DPG_ also supports constant time neighborhood queries from arbitrary points. The supported functionalities can be summarized as

- Core functions

  - Add, Remove and Move an atom of a molecule
  - Intersection and arbitrary range queries

- Extensions

  - Molecular Surface Maintenance

    - Identifying all exposed atoms of the molecule
    - Produce a patch complex representation of the surface

  - Energetics

    - Given the pdb and integration points sampled on the surface, compute the Born radii
    - Compute the polarization energy

  - Multi-resolution (in progress)

    - Range and intersection queries at residue, secondary structure, or chain level
    - Clustering of atoms and mutiresolution molecular surface maintenance

### References

C. Bajaj, R. Chowdhury, and M. Rasheed  
**A Dynamic Data Structure for Flexible Molecular Maintenance and Informatics**  
_Bioinformatics (2011) 27 (1): 55-62. DOI: 10.1093/bioinformatics/btq627_ ([pdf](http://bioinformatics.oxfordjournals.org/content/27/1/55.full.pdf+html))

### [Download](download) DPG

- Library also contained in [_TexMol_](../texmol)

### Software Usage

Installation, usage and programming guidelines for the packages.

- [Core library](http://www.cs.utexas.edu/~bajaj/cvc/software/doc/dpg_user_guide.pdf)
- [Energetics computations](http://www.cs.utexas.edu/~bajaj/cvc/software/doc/dpg_energy_user_guide.pdf)

### Example Results

<img src="https://www.cs.utexas.edu/~bajaj/cvc/software/images/DPGinsert.jpeg" alt="" width="723" height="499"> <img src="https://www.cs.utexas.edu/~bajaj/cvc/software/images/DPGrange.jpeg" alt="" width="711" height="505">  
<img src="https://www.cs.utexas.edu/~bajaj/cvc/software/images/bornSpeedup.jpeg" alt="" width="1267" height="798"> <img src="https://www.cs.utexas.edu/~bajaj/cvc/software/images/bornError.jpeg" alt="" width="1176" height="800">
