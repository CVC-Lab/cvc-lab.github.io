---
title: 'SBR Extraction Study: Introduction'
slug: '/projects/ai4pd/background/introduction'
date: '2023-08-01'
---

# Introduction

_Part of the 2023 SBR extraction study · [AI4PD background](/projects/ai4pd/background/) · Next: [Preliminaries](/projects/ai4pd/background/preliminaries/)_

Parkinson's disease (PD) is a neurodegenerative disorder largely characterized by dopaminergic neuronal loss in substantia nigra pars compacta (SNpc) in the brain resulting in loss of control over motor function. On a genetic level, protein misfolding and its subsequent accumulation, known as "Lewy bodies", occurs in intra-cellular spaces. Lewy bodies are comprised mainly of proteins such as $\alpha$-synuclein, phosphorylated tau, and amyloid beta peptide which over the years of human life aggregates into amyloid-like fibrils. Research has shown that these protofibrils disrupt neuronal homeostasis, resulting in cell death and neurodegeneration [1]. PD affects 1$\sim$2% of the population that is 65+ and 4$\sim$5% of those 85+ with over 1 million PD cases reported in the United States alone [2]. Clinical diagnosis of PD only occurs after the detection of four symptoms by a doctor: tremor at rest, bradykinesia, rigidity, and postural instability. However, by the time of diagnosis over 60% of dopaminergic neurons have already been lost [3]. Early detection of Parkinson's is critical to allow for effective treatment and preservation of neurons in the SNpc. There are a number of prodromal biomarkers that exist for PD that can give insight into early diagnosis. Patients in the pre-motor stage of PD exhibit Rapid Eye Movement (REM) sleep disorder, olfactory loss, decreases in the levels of cerebral spinal fluid (CSF) $\alpha$-synuclein, and a decrease in intensity from dopamine transporter scans (DaTSCAN) within the striatum. The analysis of DaTSCAN images typically occurs within three categories: expert analysed, estimation based methods, and segmentation based methods. The fault with the first two methods is that there tends to be a simplification of the analysis process. For example, the DaTSCAN image is typically reduced from 3D to 2D leaving out important details. Other methods apply generalizations about caudate and putamen locations that may not be precise to the specific patient. These methods are most common because patient specific MRI segmentation of the striatum is seen as a timely process typically taking multiple hours for the segmentation of a single image. Our belief is that applying SegFormer, a state of the art AI segmentation model, will produce quick and accurate 3D striatum masks from patients' MRIs. These masks will then be used to extract patient specific SBR ratios from DaTSCAN images through alignment.

### References

1. Stefanis L. α-Synuclein in Parkinson's disease. Cold Spring Harb Perspect Med, 2(2):a009399, Feb 2012.
2. T. Marek K. Jennings D. Lasch S. Siderowf A. Tanner C. Simuni. Parkinson progression marker initiative. Progress in neurobiology, pages 629–635, 2011.
3. P. K. Ghosh S. Prashanth R. Dutta Roy S. Mandal. High-accuracy detection of early Parkinson's disease through multimodal features and machine learning. International journal of medical informatics, pages 13–21, 2016.
