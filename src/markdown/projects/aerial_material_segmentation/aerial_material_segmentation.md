---
title: "Low-cost Robust Night-time Aerial Material Segmentation through Hyper Spectral Data and Sparse Time Series Extraction"
slug: "/projects/aerial-material-segmentation"
date: "2024-09-12"
---

**By Chandrajit Bajaj, Minh Nguyen, and Shubham Bhardwaj**

<p><img src="https://i.imgur.com/Vw8rZ5m.png" alt="" width="2220" height="1554"></p>

### **Introduction**

Material segmentation, especially in night-time aerial environments, is a challenging task due to poor lighting conditions and atmospheric disturbances. Traditional RGB imaging methods struggle in such environments, which is where hyperspectral imaging (HSI) technology comes into play. However, the high cost and low spatial resolution of hyperspectral cameras limit their usage. Our project introduces a low-cost solution for robust material segmentation using a novel framework that fuses hyperspectral data with RGB imagery, ensuring efficient segmentation in challenging night-time conditions.

---

### **Problem Statement**

Hyperspectral cameras capture the electromagnetic spectrum in many continuous bands, providing rich spectral information for tasks like material segmentation. However, due to hardware limitations, high spectral data comes at the cost of spatial resolution. Furthermore, incorporating this high-dimensional data into learning-based models adds computational complexity. Our research addresses this by creating a scalable framework that integrates hyperspectral and RGB data, reducing the need for expensive hardware without compromising performance.

---

### **Key Contributions**

1. **Selective Channel Utilization:** Instead of processing the entire hyperspectral dataset, we employ time-series analysis to extract essential spectral channels, significantly reducing computational overhead.
2. **Siamese Deep Learning Architecture:** Our innovative Siamese network processes both hyperspectral and RGB data, combining them for robust segmentation.
3. **Robust Performance in Adverse Conditions:** The model is specifically designed to operate in low-light and atmospheric disturbances, outperforming traditional methods in difficult conditions.

---

### **Methodology**

Our approach leverages hyperspectral and RGB image pairs for the segmentation task. By employing time-series-based compression, we reduce the number of spectral channels and retain only the most informative data points. This is followed by a Siamese network that merges the reduced hyperspectral data with RGB data to predict pixel-level material segmentation.

<p><img src="https://i.imgur.com/iKNkygL.png" alt="" width="1222" height="758"></p>

---

<p><img src="https://i.imgur.com/QavofLk.png" alt="" width="1230" height="538"></p>

### **Experimental Results**

Our framework was evaluated on well-known aerial datasets (Jasper Ridge and Urban), simulating adverse conditions like low light and atmospheric scattering. The results demonstrate significant improvements in segmentation accuracy compared to baseline models, with notable resilience to night-time conditions.

Key findings:

- **Jasper Ridge Dataset:** Achieved superior segmentation accuracy, with a 10% improvement over traditional U-Net and CNN models in low-light conditions.
- **Urban Dataset:** Our model maintained robust performance even with heavy atmospheric scattering and low contrast, outperforming RGB-only methods.

---

### **Conclusion**

We introduced a novel, low-cost solution for night-time aerial material segmentation using hyperspectral data and sparse spatio-temporal learning. Our method significantly reduces the need for expensive equipment while maintaining high performance in adverse environmental conditions. Future work will explore extending this framework to other domains and applications beyond material segmentation.
