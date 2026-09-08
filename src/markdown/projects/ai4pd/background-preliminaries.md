---
title: 'SBR Extraction Study: Preliminaries and Related Work'
slug: '/projects/ai4pd/background/preliminaries'
date: '2023-08-01'
---

# Preliminaries and Related Work

_Part of the 2023 SBR extraction study · [AI4PD background](/projects/ai4pd/background/) · Next: [Methodology](/projects/ai4pd/background/methodology/)_

The regions of interest include the caudates, putamens, and whole striatums. There are two main methods for metric extraction. The ROI extraction makes a 2D representation from the 3D image for simplified extraction. VOI extraction takes advantage of full 3D DaTSCAN image and structural images (MRI).

1. **Manual ROI extraction.** The ROI is manually delineated by an expert.

2. **Template ROI extraction.**

   (a) The first involves placing preconstructed trapezoidal ROIs over the striatal compartment of the 2D image.

   (b) The second involves taking the DaTSCAN image and normalizing it to a space where preconstructed ROIs are known and can be placed over the modified image.

3. **VOI MRI extraction.** This method involves the use of complementary structural imaging to determine the volume of interest in the DaTSCAN. The VOIs are segmented out of structural images such as MRI manually through segmentation software (ITK-snap). Then the DaTSCAN and MRI are coregistered using rigid body transformation into the same space.
