---
title: 'SBR Extraction Study: Experiments'
slug: '/projects/ai4pd/background/experiments'
date: '2023-08-01'
---

# Experiments

_Part of the 2023 SBR extraction study · [AI4PD background](/projects/ai4pd/background/)_

## SegFormer evaluation on MRI

| Comparison metric  | SegFormer | FreeSurfer |
| ------------------ | --------- | ---------- |
| Run time (minutes) | ∼12       | ∼330       |

## Analysis of extracted SBR ratios

These are the experimental results using the SBR data from SegFormer. The data were the SBR values for the left and right putamen and caudate regions, classified into control and PD patients by the following methods.

| Method            | F1-score | ROC/AUC |
| ----------------- | -------- | ------- |
| Nearest neighbors | 0.960    | 0.8996  |
| Linear SVM        | 0.897    | 0.598   |
| RBF SVM           | 0.950    | 0.843   |
| Gaussian process  | 0.944    | 0.837   |
| Decision tree     | 0.939    | 0.816   |
| Random forest     | 0.950    | 0.858   |
| Neural net        | 0.950    | 0.843   |
| AdaBoost          | 0.923    | 0.769   |
| Naive Bayes       | 0.935    | 0.907   |
| QDA               | 0.926    | 0.723   |
