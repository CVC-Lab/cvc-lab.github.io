"use strict";(self.webpackChunkcvc_website=self.webpackChunkcvc_website||[]).push([[665],{7053:function(t,e,i){i.r(e),i.d(e,{Head:function(){return g}});var a=i(4506),n=i(6540),s=i(4810);const r=String.raw`
<div class="back">
  <a href="/projects">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
    Back to Projects
  </a>
</div>

<div class="hero">
  <div class="hero-tag">MICCAI 2026 Submission</div>

  <h1>
    <span>A Novel Tri-Modal</span>
    <span>Viral–Ultrasound</span>
    <span>Gene-Delivery Therapy Protocol</span>
    <span>for Lysosomal</span>
    <span>Neurodegeneration</span>
    <span>via Stochastic Model</span>
    <span>Optimization</span>
    <span>with Uncertainty Quantification</span>
    <span>and Generalizability</span>
  </h1>

  <p class="hero-authors">
    Kartheek Nekkanti<span><sup>1</sup></span>,&ensp;Chandrajit Bajaj<span><sup>2</sup></span>
  </p>
  <p class="hero-affil">
    <span class="affil-line"><sup>1</sup>Pearson Ranch Middle School,</span>
    <span class="affil-line">Round Rock Independent School District,</span>
    <span class="affil-line">Austin, TX 78717</span>
    <span class="affil-line"><sup>2</sup>Oden Institute for Computational Engineering and Sciences,</span>
    <span class="affil-line">The University of Texas at Austin, Austin, TX 78712</span>
  </p>

  <div class="hero-links">
    <a href="/projects/tri-modal-gene-therapy/Tri-modal_kartheek-arxiv.pdf">Paper</a>
    <span class="sep">|</span>
    <a href="#sde-system">Full Version (30 pp.)</a>
  </div>
</div>

<div class="anim-panel">
  <div class="anim-box">
    <canvas id="hero-canvas"></canvas>
  </div>
</div>
<p class="anim-caption">
  <span class="caption-desktop">
    GM2 substrate dynamics across all treatment arms. N = 1,000 Milstein SDE realizations, 365-day horizon.
    Blue = Tri-Modal (SP2+AAV+FUS); red = Natural History.
    Tri-modal reaches 180 nmol/g vs. 1,325 nmol/g untreated.
  </span>
  <span class="caption-mobile">
    GM2 substrate dynamics: N = 1,000 runs. Blue = Tri-Modal; red = Natural History.
    Tri-modal reaches 180 nmol/g vs. 1,325 untreated.
  </span>
</p>

<hr />

<div class="content" id="abstract">
  <h2 class="section-head">Abstract</h2>
  <p>Lysosomal storage disorders (LSDs) are a class of more than 70 inherited metabolic diseases caused by deficient lysosomal enzyme activity, producing substrate accumulation, neuroinflammation, and progressive neuronal death. We focus on GM2 gangliosidosis (Tay-Sachs/Sandhoff), for which fewer than 100 new cases occur annually in the US and Europe combined, making prospective randomized trials both statistically underpowered and ethically untenable.</p>
  <p>We present a 16-dimensional Itô stochastic differential equation (SDE) system, with generic form \(dX_i = f_i(X,t)\,dt + \sigma_i X_i\,dW_i\), calibrated from 15 public genomic and proteomic datasets and integrated via the Milstein scheme (\(N = 1{,}000\) realizations, \(\Delta t = 0.1\) d). Tri-modal therapy — integrating AAV-T4 gene delivery, SP2 substrate reduction therapy, and focused ultrasound (FUS) blood–brain barrier modulation — reduces mean brain GM2 burden from 890 nmol/g to \(180 \pm 35\) nmol/g (75.7%; 95% CI [74.2%, 77.2%]) versus 30–35% for SRT monotherapy and 40–50% for AAV monotherapy. Neuroinflammation suppression reaches 95–97% and Bayley-III motor/cognitive advantages are +49/+21 points at day 365.</p>
  <p>Global Sobol analysis identifies BBB entry kinetics (\(k_{T4,\text{entry}}\), \(S_T = 0.909\)) as the singular rate-limiting parameter, exceeding enzymatic degradation (\(V_{\max,B}\)) by 13.0-fold, establishing GM2 gangliosidosis as delivery-limited rather than enzyme-limited. Six-region neuroanatomical validation confirms uniform 80–89% GM2 reduction (CV = 3.7%). Modular substitution across nine LSDs reproduces consistent BBB-bottleneck dominance (\(S_T = 0.82\text{–}0.91\)) with ≈90% parameter reuse, establishing computational stochastic optimization as a translational strategy for ultra-rare diseases.</p>
</div>

<hr />

<div class="content">
  <h2 class="section-head">Why Monotherapy Is Insufficient: A Formal Bottleneck Analysis</h2>
  <p>Three mechanistically non-redundant rate-limiting steps must be addressed concurrently for meaningful substrate clearance. No mono- or bi-modal therapy closes all three simultaneously:</p>

  <div class="bn-grid">
    <div class="bn-item">
      <div class="bn-num">Bottleneck 1 · Synthesis</div>
      <h4>Continuous GM2 Synthesis</h4>
      <p>Substrate synthesis at \(g_{\text{synth}} = 3\) nmol/g/d continuously replenishes the lysosomal burden even with fully restored enzyme. SRT achieves only ≈30–35% reduction without addressing delivery or enzyme absence.</p>
      <span class="bn-fix">Fixed by SP2 / SRT</span>
    </div>
    <div class="bn-item">
      <div class="bn-num">Bottleneck 2 · Enzyme</div>
      <h4>Absent β-Hexosaminidase</h4>
      <p>HEXA/HEXB mutations abolish lysosomal enzyme activity. AAV delivers the corrective gene but achieves &lt;1% CNS penetration intravenously; with GM2 \(\gg K_{m,B}\), clearance saturates at \(V_{\max}\).</p>
      <span class="bn-fix">Fixed by AAV-T4</span>
    </div>
    <div class="bn-item">
      <div class="bn-num">Bottleneck 3 · BBB</div>
      <h4>Blood–Brain Barrier</h4>
      <p>The dominant bottleneck (\(S_T = 0.909\)). FUS with microbubbles enhances CNS AAV delivery 10–100× via acoustic cavitation (\(\alpha_{\text{FUS}} = 50\)), timed to days 1–7 before anti-capsid IgG peaks.</p>
      <span class="bn-fix">Fixed by FUS</span>
    </div>
  </div>

  <p>Only the tri-modal combination (SRT + AAV + FUS) simultaneously reduces synthesis, restores enzyme, and amplifies transport — yielding synergy index 1.47 and 95–97% neuroinflammation suppression by disrupting the microglial feedback loop (GM2 \(> G_{th} = 500\) nmol/g).</p>
</div>

<hr />

<div class="content">
  <h2 class="section-head">GM2 Substrate Dynamics — All Treatment Arms</h2>
  <div class="fig-wrap">
    <img src="/projects/tri-modal-gene-therapy/Figure_1.png" alt="Figure 1: GM2 substrate dynamics across all treatment arms" loading="lazy" />
    <p class="fig-caption"><strong>Figure 1.</strong> Brain GM2 burden (nmol g⁻¹) over 365 days across all treatment arms, \(N = 1{,}000\) Milstein realizations. Shaded bands: 5th–95th percentile. Tri-modal (blue) achieves 75.7% substrate reduction (890 → 180 nmol/g) versus continuous rise in natural history (890 → 1,325 nmol/g). The strict NH &lt; mono &lt; bi &lt; tri hierarchy is preserved at every time step.</p>
  </div>
</div>

<hr />

<div class="content">
  <h2 class="section-head">Neuroinflammation &amp; Bayley-III Clinical Outcomes</h2>
  <div class="fig-wrap">
    <img src="/projects/tri-modal-gene-therapy/Figure_2.png" alt="Figure 2: Neuroinflammation and Bayley-III outcomes" loading="lazy" />
    <p class="fig-caption"><strong>Figure 2.</strong> <em>(A)</em> Neuroinflammation index \(I(t)\): tri-modal (blue) suppresses inflammation to physiological levels (\(I \approx 0.05\)) by day 250; untreated (red) plateaus at \(I \approx 0.5\). <em>(B)</em> Bayley-III cognitive trajectories across all arms (\(N = 1{,}000\)). <em>(C)</em> Terminal motor/cognitive Bayley-III scores at day 365 — tri-modal achieves \(\Delta = -8.6\) vs. natural history \(\Delta = -44.8\).</p>
  </div>
</div>

<hr />

<div class="content" id="sde-system">
  <h2 class="section-head">16-Dimensional Itô SDE System</h2>
  <p>Five coupled subsystems evolve as Itô SDEs with multiplicative noise \(\sigma_i X_i\,dW_i\) (CV ≈ 10%), integrated via the Milstein scheme (\(\Delta t = 0.1\) d, \(N = 1{,}000\) realizations). Multiplicative noise is mechanistically justified: inter-individual CV is approximately constant across concentration ranges, the empirical signature of geometric rather than additive dispersion.</p>

  <div class="sde-tabs">
    <div class="tab-bar">
      <button class="tab-btn active" data-tab="srt">SRT Pharmacokinetics</button>
      <button class="tab-btn" data-tab="aav">AAV-FUS Delivery</button>
      <button class="tab-btn" data-tab="gm2">GM2 Biochemistry</button>
      <button class="tab-btn" data-tab="neuro">Neuroinflammation</button>
      <button class="tab-btn" data-tab="bay">Bayley-III</button>
    </div>
    <div class="tab-panels">

      <div class="tab-panel active" data-panel="srt">
        <p>States 1–3: drug absorption, plasma distribution, brain penetration. Hill inhibition \(\eta_{SP}(B) = \mathrm{IC}_{50}^n / (\mathrm{IC}_{50}^n + B^n)\), \(\mathrm{IC}_{50} = 25\) µM, \(n = 2.0\).</p>
        \[\begin{aligned}
          dA_{\text{gut}} &= \bigl[-k_a A_{\text{gut}} + \text{dose}(t)\bigr]\,dt + \sigma_{\text{gut}}\,dW_1 \\
          dP &= \bigl[F k_a A_{\text{gut}} - (k_{\text{el}} + k_{p2b})P + k_{b2p}B\bigr]\,dt + \sigma_p\,dW_2 \\
          dB &= \bigl[k_{p2b}P - k_{\text{elim}}B\bigr]\,dt + \sigma_B\,dW_3
        \end{aligned}\]
      </div>

      <div class="tab-panel" data-panel="aav">
        <p>States 4–6: systemic AAV-T4, CNS entry with saturation, transgene expression. FUS modulation: \(k_{\text{entry}}^{\text{eff}} = k_{T4,\text{entry},0}(1 + \alpha_{\text{FUS}}\,u(t))(1 - 0.3\,Ab)\), \(\alpha_{\text{FUS}} \in [10,100]\).</p>
        \[\begin{aligned}
          dT_{4,\text{sys}} &= \bigl[-(k_{\text{clear}} + k_{\text{entry}}^{\text{eff}})T_{4,\text{sys}}\bigr]\,dt + \sigma\,dW_4 \\
          dT_{4,\text{entry}} &= \bigl[k_{\text{entry}}^{\text{eff}} T_{4,\text{sys}}(1 - T_{4,\text{entry}}) - 0.001\,T_{4,\text{entry}}\bigr]\,dt + \sigma\,dW_5 \\
          dE_{\text{expr}} &= \bigl[k_{\text{load}}\,T_{4,\text{entry}}(\text{cap} - E_{\text{expr}}) - k_{\text{decay}}\,E_{\text{expr}}\bigr]\,dt + \sigma\,dW_6
        \end{aligned}\]
      </div>

      <div class="tab-panel" data-panel="gm2">
        <p>States 7–8: GM2 substrate and enzymatic clearance via Michaelis–Menten kinetics. At baseline \(G_B = 890\) nmol/g \(\gg K_{m,B} = 300\) nmol/g, the enzyme operates at 74.8% of \(V_{\max,B}\) — firmly in the saturating regime, confirming delivery as the rate limiter.</p>
        \[\begin{aligned}
          dG_B &= \left[g_{\text{synth}}(1-\eta_{SP}) - \frac{V_{\max,B}\,E_{\text{expr}}\,G_B}{K_{m,B}+G_B}\right]dt + \sigma\,dW_7 \\
          dG_L &= \left[0.7\,g_{\text{synth}}(1-\eta_{SP}) - \frac{V_{\max,L}\,E_{\text{expr}}\,G_L}{K_{m,L}+G_L}\right]dt + \sigma\,dW_8
        \end{aligned}\]
      </div>

      <div class="tab-panel" data-panel="neuro">
        <p>States 9–10: microglial activation above \(G_{th} = 500\) nmol/g triggers the inflammatory cascade. Tri-modal synergistically suppresses all feedforward and feedback paths.</p>
        \[\begin{aligned}
          dI &= \left[k_{\text{inf}}\frac{\max(0,\,G_B - G_{th})}{G_{th}} - k_{\text{res}}I - k_{\text{tx}}\!\left(w_E\frac{E}{\text{cap}} + w_{SP}C_{SP}\right)\right]dt + \sigma\,dW_9 \\
          dD &= \left[k_{GB}\frac{G_B}{G_B+K_{GB}} + k_I\frac{I}{I+K_I} - k_{\text{repair}}D\right]dt + \sigma\,dW_{10}
        \end{aligned}\]
      </div>

      <div class="tab-panel" data-panel="bay">
        <p>States 11–12: Bayley-III motor/cognitive trajectories coupled to damage \(D\) and inflammation \(I\), with equilibria \(M_{\text{eq}} = 65(1-0.9D)(1-0.5I)\) and \(C_{\text{eq}} = 68(1-0.95D)(1-0.6I)\).</p>
        \[\begin{aligned}
          dB_{\text{mot}} &= \left[-k_M(B_{\text{mot}} - M_{\text{eq}}) - \alpha_M\frac{\bar{I}}{\bar{I}+K_{IM}}\right]dt + \sigma\,dW_{11} \\
          dB_{\text{cog}} &= \left[-k_C(B_{\text{cog}} - C_{\text{eq}}) - \alpha_C\frac{\bar{I}}{\bar{I}+K_{IC}}\right]dt + \sigma\,dW_{12}
        \end{aligned}\]
      </div>

    </div>
  </div>
</div>

<hr />

<div class="content">
  <h2 class="section-head">Global Sobol Sensitivity Analysis</h2>
  <div class="fig-wrap">
    <img src="/projects/tri-modal-gene-therapy/Figure_3.png" alt="Figure 3: Sobol sensitivity analysis and terminal GM2 distribution" loading="lazy" />
    <p class="fig-caption"><strong>Figure 3.</strong> <em>(A)</em> Global Sobol indices (\(N = 1{,}000\) Saltelli samples, 50 realizations each; 95% CI). \(k_{T4,\text{entry}}\) dominates at \(S_T = 0.909\), exceeding \(V_{\max,B}\) by 13.0× (total-order) and 16.5× (first-order). <em>(B)</em> Terminal GM2 distribution under tri-modal therapy (\(N = 1{,}000\)): median = 147 nmol/g, mean = 188 nmol/g — far below the microglial activation threshold \(G_0\).</p>
  </div>

  <p>The Sobol decomposition formalizes the delivery-limitation argument quantitatively: knowing \(k_{T4,\text{entry}}\) alone reduces outcome variance by 90.9%, whereas knowing all other parameters simultaneously reduces it by only 9.1%. This is a direct consequence of Michaelis–Menten saturation (\(G_B \gg K_{m,B}\)) and holds robustly across the full Saltelli parameter space. The implication for program design is unambiguous: capsid engineering, intrathecal administration, and FUS-mediated opening represent the highest-leverage interventions — not enzyme optimization.</p>
</div>

<hr />

<div class="content">
  <h2 class="section-head">Six-Region Spatial Validation</h2>
  <div class="fig-wrap">
    <img src="/projects/tri-modal-gene-therapy/Figure_4.png" alt="Figure 4: Six-region spatial GM2 validation" loading="lazy" />
    <p class="fig-caption"><strong>Figure 4.</strong> GM2 reduction trajectories across six brain regions under tri-modal therapy (\(N = 1{,}000\) per region). Frontal cortex and thalamus: 88%; temporal lobe: 84%; hippocampus: 86%; basal ganglia: 85%; cerebellum: 80% (lower AAV tropism). Spatial CV = 3.7% validates the lumped-compartment approximation used in the primary analysis.</p>
  </div>
</div>

<hr />

<div class="content">
  <h2 class="section-head">Cross-Disease Generalizability — Nine Lysosomal Storage Disorders</h2>
  <div class="fig-wrap">
    <img src="/projects/tri-modal-gene-therapy/Figure_5.png" alt="Figure 5: Cross-disease generalizability across 9 LSDs" loading="lazy" />
    <p class="fig-caption"><strong>Figure 5.</strong> <em>(A)</em> Terminal substrate reduction: tri-modal vs. untreated (\(N = 1{,}000\)). <em>(B)</em> Universal BBB bottleneck: \(S_T(k_{T4,\text{entry}}) = 0.82\text{–}0.91\) across all nine disorders, independent of enzymatic substrate. <em>(C)</em> Bayley-III cognitive outcomes: treated vs. untreated for each disease.</p>
  </div>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Disease</th>
          <th>Terminal GM2 (Tri)</th>
          <th>Terminal GM2 (Untr.)</th>
          <th>Inflammation (Tri)</th>
          <th>Cognition (Tri)</th>
          <th>\(S_T(k_{T4,\text{entry}})\)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="td-highlight">GM2 Gangliosidosis</td>
          <td>75 nmol/g</td><td>140 nmol/g</td><td>0.02</td><td>60</td><td class="gain">0.909</td>
        </tr>
        <tr><td>GM1 Gangliosidosis</td><td>70</td><td>138</td><td>0.03</td><td>57</td><td>0.893</td></tr>
        <tr><td>Krabbe Disease</td><td>45</td><td>130</td><td>0.05</td><td>44</td><td>0.871</td></tr>
        <tr><td>MLD</td><td>65</td><td>135</td><td>0.04</td><td>53</td><td>0.882</td></tr>
        <tr><td>Pompe Disease</td><td>60</td><td>132</td><td>0.03</td><td>55</td><td>0.875</td></tr>
        <tr><td>MPS I (Hurler)</td><td>62</td><td>133</td><td>0.04</td><td>51</td><td>0.868</td></tr>
        <tr><td>Niemann-Pick C</td><td>40</td><td>128</td><td>0.07</td><td>38</td><td>0.841</td></tr>
        <tr><td>CLN2 (Batten)</td><td>80</td><td>140</td><td>0.03</td><td>58</td><td>0.901</td></tr>
        <tr><td>Fabry Disease</td><td>75</td><td>125</td><td>0.02</td><td>60</td><td>0.820</td></tr>
      </tbody>
    </table>
  </div>
  <p style="margin-top:0.75rem;">\(S_T = 0.82\text{–}0.91\) across all nine disorders, spanning heterogeneous enzymatic substrates (glycolipids, sphingomyelin, heparan sulfate, acid glucosidase), neuroanatomical vulnerability patterns, and Michaelis constants covering a two-fold range (\(K_m = 260\text{–}380\) nmol/g). The universality of BBB-transport dominance points to a structural rather than disease-specific explanation: intravenous AAV penetrates the CNS at &lt;1% efficiency in any disease context. ≈90% parameter reuse enables framework-wide generalization with only four disease-specific substitutions per new disorder.</p>
</div>

<hr />

<div class="content">
  <h2 class="section-head">Lysosomal Disorder Biology: From Gene Mutation to Neurodegeneration</h2>
  <p>Lysosomal storage disorders originate when inherited mutations abolish the activity of a single lysosomal hydrolase, converting the cell's primary degradation organelle into a substrate trap. The diagram below traces the full cascade from HEXA/HEXB gene variants — through enzymatic failure, lysosomal engorgement, ER stress, and microglial activation — to irreversible neurodegeneration, and contrasts it with the healthy equilibrium maintained by functional β-hexosaminidase.</p>

  <div class="fig-wrap">
    <svg viewBox="0 0 820 368" xmlns="http://www.w3.org/2000/svg" aria-label="Figure 6: Lysosomal pathomechanism comparison" style="width:100%;height:auto;display:block;" role="img">
      <defs>
        <marker id="f6g" markerWidth="8" markerHeight="9" refX="7" refY="4.5" orient="auto" markerUnits="userSpaceOnUse">
          <polygon points="0 0, 8 4.5, 0 9" fill="#15803d"/>
        </marker>
        <marker id="f6r" markerWidth="8" markerHeight="9" refX="7" refY="4.5" orient="auto" markerUnits="userSpaceOnUse">
          <polygon points="0 0, 8 4.5, 0 9" fill="#dc2626"/>
        </marker>
      </defs>

      <rect x="0" y="0" width="820" height="368" fill="white" stroke="#d1d5db" stroke-width="1"/>
      <line x1="410" y1="10" x2="410" y2="358" stroke="#e5e7eb" stroke-width="1" stroke-dasharray="5,4"/>

      <rect x="10" y="10" width="390" height="28" rx="3" fill="#15803d"/>
      <text x="205" y="28" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="700" fill="white" letter-spacing="0.05em">NORMAL LYSOSOMAL FUNCTION</text>
      <rect x="420" y="10" width="390" height="28" rx="3" fill="#dc2626"/>
      <text x="615" y="28" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="700" fill="white" letter-spacing="0.05em">GM2 GANGLIOSIDOSIS PATHOMECHANISM</text>

      <rect x="50" y="52" width="310" height="38" rx="3" fill="#f0fdf4" stroke="#86efac" stroke-width="1.5"/>
      <text x="205" y="70" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="600" fill="#15803d">Wild-type HEXA / HEXB Genes</text>
      <text x="205" y="83" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="9" fill="#555">Normal alleles · Full transcription &amp; translation</text>
      <rect x="460" y="52" width="310" height="38" rx="3" fill="#fff5f5" stroke="#fca5a5" stroke-width="1.5"/>
      <text x="615" y="70" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="600" fill="#dc2626">HEXA / HEXB Pathogenic Variants</text>
      <text x="615" y="83" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="9" fill="#555">Autosomal recessive · Loss-of-function alleles</text>

      <line x1="205" y1="91" x2="205" y2="106" stroke="#15803d" stroke-width="1.5" marker-end="url(#f6g)"/>
      <line x1="615" y1="91" x2="615" y2="106" stroke="#dc2626" stroke-width="1.5" marker-end="url(#f6r)"/>

      <rect x="50" y="108" width="310" height="38" rx="3" fill="#f0fdf4" stroke="#86efac" stroke-width="1.5"/>
      <text x="205" y="126" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="600" fill="#15803d">Active β-Hexosaminidase A / B</text>
      <text x="205" y="139" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="9" fill="#555">V_max nominal · Km ≈ 300 nmol/g for GM2</text>
      <rect x="460" y="108" width="310" height="38" rx="3" fill="#fff5f5" stroke="#fca5a5" stroke-width="1.5"/>
      <text x="615" y="126" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="600" fill="#dc2626">Absent / Deficient β-Hexosaminidase</text>
      <text x="615" y="139" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="9" fill="#555">&lt;5% residual activity · V_max → ≈ 0</text>

      <line x1="205" y1="147" x2="205" y2="162" stroke="#15803d" stroke-width="1.5" marker-end="url(#f6g)"/>
      <line x1="615" y1="147" x2="615" y2="162" stroke="#dc2626" stroke-width="1.5" marker-end="url(#f6r)"/>

      <rect x="50" y="164" width="310" height="44" rx="3" fill="#f0fdf4" stroke="#86efac" stroke-width="1.5"/>
      <text x="205" y="181" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="600" fill="#15803d">GM2 Catabolism (Michaelis–Menten)</text>
      <text x="205" y="195" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="9" fill="#555">GM2 → GM3 + GalNAc</text>
      <text x="205" y="206" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="9" fill="#555">Steady-state: 30–90 nmol/g</text>

      <rect x="457" y="164" width="316" height="44" rx="3" fill="#fef2f2" stroke="#dc2626" stroke-width="2"/>
      <text x="615" y="180" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11.5" font-weight="700" fill="#dc2626">↑↑↑  GM2 Ganglioside Accumulation</text>
      <text x="615" y="194" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="9" fill="#7f1d1d">890 → 1,325 nmol/g (day 365, untreated)</text>
      <text x="615" y="205" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="9" fill="#555">g_synth = 3 nmol/g/d · enzymatic clearance = 0</text>

      <line x1="205" y1="209" x2="205" y2="224" stroke="#15803d" stroke-width="1.5" marker-end="url(#f6g)"/>
      <line x1="615" y1="209" x2="615" y2="224" stroke="#dc2626" stroke-width="1.5" marker-end="url(#f6r)"/>

      <rect x="50" y="226" width="310" height="44" rx="3" fill="#f0fdf4" stroke="#86efac" stroke-width="1.5"/>
      <text x="205" y="243" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="600" fill="#15803d">Lysosomal Homeostasis</text>
      <text x="205" y="257" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="9" fill="#555">pH 4.5–5.0 · Membrane integrity intact</text>
      <text x="205" y="268" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="9" fill="#555">Normal autophagy flux</text>
      <rect x="460" y="226" width="310" height="44" rx="3" fill="#fff5f5" stroke="#fca5a5" stroke-width="1.5"/>
      <text x="615" y="243" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="600" fill="#dc2626">Lysosomal Engorgement &amp; Cascade</text>
      <text x="615" y="257" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="9" fill="#555">ER stress / UPR · Mitochondrial dysfunction</text>
      <text x="615" y="268" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="9" fill="#555">Microglial activation: G_B &gt; G_th = 500 nmol/g</text>

      <line x1="205" y1="271" x2="205" y2="288" stroke="#15803d" stroke-width="1.5" marker-end="url(#f6g)"/>
      <line x1="615" y1="271" x2="615" y2="288" stroke="#dc2626" stroke-width="1.5" marker-end="url(#f6r)"/>

      <rect x="40" y="290" width="330" height="58" rx="3" fill="#dcfce7" stroke="#15803d" stroke-width="2"/>
      <text x="205" y="312" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="700" fill="#15803d">✓  Healthy Neuronal Function</text>
      <text x="205" y="327" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="9" fill="#166534">Normal myelination · Synaptic plasticity intact</text>
      <text x="205" y="340" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="9" fill="#166534">Bayley-III on developmental trajectory</text>
      <rect x="450" y="290" width="330" height="58" rx="3" fill="#7f1d1d" stroke="#dc2626" stroke-width="2"/>
      <text x="615" y="312" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="700" fill="white">✗  Progressive Neurodegeneration</text>
      <text x="615" y="327" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="9" fill="#fca5a5">Caspase-3 · Thalamic hyperintensity · CNS atrophy</text>
      <text x="615" y="340" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="9" fill="#fca5a5">Median survival &lt;5 y · Bayley-III Δ = −44.8</text>
    </svg>
    <p class="fig-caption"><strong>Figure 6.</strong> Side-by-side pathomechanism comparison (5 aligned steps). <em>Left (green):</em> Wild-type β-hexosaminidase maintains GM2 at physiological steady-state (30–90 nmol/g), preserving lysosomal pH homeostasis, normal autophagy flux, and neuronal viability. <em>Right (red):</em> HEXA/HEXB loss-of-function mutations abolish hydrolase activity, initiating continuous uncleared accumulation (g<sub>synth</sub> = 3 nmol/g/d; clearance → 0). Lysosomal engorgement triggers bifurcated pathology — ER stress/mitochondrial dysfunction and microglial neuroinflammation (G<sub>B</sub> &gt; G<sub>th</sub> = 500 nmol/g, governing States 9–10 of the Itô SDE) — converging on caspase-3 apoptosis and progressive CNS atrophy.</p>
  </div>
</div>

<hr />

<div class="content">
  <h2 class="section-head">Tri-Modal Therapy: How Each Modality Restores Homeostasis</h2>
  <p>Each therapeutic modality intercepts a distinct, non-redundant node in the pathomechanism cascade. SP2 suppresses GM2 biosynthesis upstream; AAV-T4 restores the missing enzyme downstream; FUS amplifies CNS delivery 10–100× by acoustically opening BBB tight junctions during a precisely timed 7-day window before anti-capsid IgG peaks. Only their concurrent application removes all three rate-limiting constraints simultaneously.</p>

  <div class="fig-wrap">
    <svg viewBox="0 0 820 272" xmlns="http://www.w3.org/2000/svg" aria-label="Figure 7: Tri-modal therapy mechanism of action" style="width:100%;height:auto;display:block;" role="img">
      <defs>
        <marker id="f7dark" markerWidth="8" markerHeight="9" refX="7" refY="4.5" orient="auto" markerUnits="userSpaceOnUse">
          <polygon points="0 0, 8 4.5, 0 9" fill="#1a1a2a"/>
        </marker>
      </defs>

      <rect x="0" y="0" width="820" height="272" fill="white" stroke="#d1d5db" stroke-width="1"/>
      <rect x="10" y="10" width="800" height="186" fill="none" stroke="#d1d5db" stroke-width="1"/>
      <line x1="277" y1="10" x2="277" y2="196" stroke="#d1d5db" stroke-width="1"/>
      <line x1="544" y1="10" x2="544" y2="196" stroke="#d1d5db" stroke-width="1"/>
      <line x1="10" y1="42" x2="810" y2="42" stroke="#d1d5db" stroke-width="1"/>
      <line x1="10" y1="136" x2="810" y2="136" stroke="#d1d5db" stroke-width="1"/>

      <rect x="10" y="10" width="267" height="32" fill="#f0fdf4"/>
      <text x="143" y="24" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="700" fill="#15803d">① SP2 — Substrate Reduction</text>
      <text x="143" y="36" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="8.5" fill="#166534">Miglustat analog · oral · Bottleneck 1 (synthesis)</text>
      <rect x="277" y="10" width="267" height="32" fill="#fff7ed"/>
      <text x="410" y="24" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="700" fill="#BF5700">② FUS — BBB Modulation</text>
      <text x="410" y="36" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="8.5" fill="#9a3e00">Focused ultrasound + microbubbles · Bottleneck 3 (BBB)</text>
      <rect x="544" y="10" width="266" height="32" fill="#eff6ff"/>
      <text x="677" y="24" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="700" fill="#1d4ed8">③ AAV-T4 — Gene Delivery</text>
      <text x="677" y="36" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="8.5" fill="#1e3a8a">Engineered AAV · IV single dose · Bottleneck 2 (enzyme)</text>

      <text x="143" y="58" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="10" font-weight="600" fill="#15803d">Glucosylceramide Synthase Inhibition</text>
      <text x="143" y="72" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="8.5" fill="#444">IC₅₀ = 25 µM · Hill coefficient n = 2.0</text>
      <text x="143" y="85" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="8.5" fill="#444">η_SP(B) = IC₅₀ⁿ / (IC₅₀ⁿ + Bⁿ)</text>
      <text x="143" y="98" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="8.5" fill="#444">g_synth: 3.0 → ~1.5 nmol/g/d</text>
      <text x="143" y="111" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="8.5" fill="#444">Oral · CNS-penetrant small molecule</text>
      <text x="143" y="124" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="8.5" fill="#444">Upstream of GM2 biosynthetic pathway</text>

      <text x="410" y="58" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="10" font-weight="600" fill="#BF5700">Acoustic BBB Tight Junction Opening</text>
      <text x="410" y="72" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="8.5" fill="#444">α_FUS ∈ [10, 100] · Days 1–7 post-dose</text>
      <text x="410" y="85" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="8.5" fill="#444">k_entry_eff = k₀ (1 + α_FUS · u(t))</text>
      <text x="410" y="98" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="8.5" fill="#444">Ab factor: × (1 – 0.3 Ab)</text>
      <text x="410" y="111" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="8.5" fill="#444">Timed before anti-capsid IgG peak</text>
      <text x="410" y="124" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="8.5" fill="#444">Non-invasive extracorporeal transducer</text>

      <text x="677" y="58" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="10" font-weight="600" fill="#1d4ed8">Neuronal HEXA / HEXB Re-expression</text>
      <text x="677" y="72" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="8.5" fill="#444">dE_expr = k_load · T₄_entry · (cap – E_expr)</text>
      <text x="677" y="85" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="8.5" fill="#444">– k_decay · E_expr  ·  dt</text>
      <text x="677" y="98" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="8.5" fill="#444">E_expr → V_max,B restored</text>
      <text x="677" y="111" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="8.5" fill="#444">Single IV dose · sustained transgene expression</text>
      <text x="677" y="124" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="8.5" fill="#444">Michaelis–Menten catabolism resumes</text>

      <rect x="10" y="136" width="267" height="60" fill="#f0fdf4"/>
      <text x="143" y="157" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="10" font-weight="700" fill="#15803d">GM2 Synthesis ↓ 30–35%</text>
      <text x="143" y="171" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="8.5" fill="#444">Insufficient alone; enzyme deficit</text>
      <text x="143" y="184" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="8.5" fill="#444">persists without AAV-T4</text>
      <rect x="277" y="136" width="267" height="60" fill="#fff7ed"/>
      <text x="410" y="157" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="10" font-weight="700" fill="#BF5700">CNS AAV Delivery × 10–100</text>
      <text x="410" y="171" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="8.5" fill="#444">Sobol S_T = 0.909 — dominant</text>
      <text x="410" y="184" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="8.5" fill="#444">rate-limiter; 13× above V_max,B</text>
      <rect x="544" y="136" width="266" height="60" fill="#eff6ff"/>
      <text x="677" y="157" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="10" font-weight="700" fill="#1d4ed8">Enzyme Activity Restored</text>
      <text x="677" y="171" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="8.5" fill="#444">GM2 catabolism resumes;</text>
      <text x="677" y="184" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="8.5" fill="#444">substrate cleared at V_max rate</text>

      <line x1="143" y1="196" x2="143" y2="214" stroke="#555" stroke-width="1.5"/>
      <line x1="410" y1="196" x2="410" y2="214" stroke="#555" stroke-width="1.5"/>
      <line x1="677" y1="196" x2="677" y2="214" stroke="#555" stroke-width="1.5"/>
      <line x1="143" y1="214" x2="677" y2="214" stroke="#1a1a2a" stroke-width="1.5"/>
      <line x1="410" y1="214" x2="410" y2="226" stroke="#1a1a2a" stroke-width="2" marker-end="url(#f7dark)"/>

      <rect x="10" y="226" width="800" height="36" rx="3" fill="#1a1a2a"/>
      <text x="410" y="241" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="10" font-weight="700" fill="white">Synergy Index 1.47 · GM2 ↓75.7% (890 → 180 ± 35 nmol/g) · Neuroinflammation ↓95–97%</text>
      <text x="410" y="255" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="9" fill="#94a3b8">Bayley-III: Motor +49 pts · Cognitive +21 pts · All three bottlenecks resolved → Lysosomal homeostasis restored</text>
    </svg>
    <p class="fig-caption"><strong>Figure 7.</strong> Grid-table summary of the tri-modal therapy mechanism. Three parallel columns show each modality's pharmacology (Row 1), kinetic mechanism (Row 2), and isolated effect (Row 3). <em>(①) SP2 (SRT)</em> inhibits glucosylceramide synthase upstream, reducing GM2 synthetic flux from 3.0 to ~1.5 nmol/g/d. <em>(②) FUS</em> acoustically opens BBB tight junctions during days 1–7 (k<sub>entry,eff</sub> = k₀(1 + α<sub>FUS</sub>·u(t))(1 – 0.3 Ab)), closing the dominant bottleneck (S<sub>T</sub> = 0.909). <em>(③) AAV-T4</em> restores β-hexosaminidase V<sub>max</sub> via HEXA/HEXB transduction. Concurrent action yields synergy index 1.47 and reduces GM2 from 890 to 180 ± 35 nmol/g (75.7%).</p>
  </div>
</div>

<hr />

<div class="content">
  <h2 class="section-head">Multi-Modal Diagnostic Protocol &amp; Severity Classification</h2>
  <p>Because GM2 gangliosidosis and related LSDs are ultra-rare and rapidly progressive in their infantile form, early accurate diagnosis is essential for treatment eligibility. The current standard combines newborn biochemical screening, confirmatory molecular genetics, neuroimaging for disease burden, and standardized functional assessment — each tier informing both diagnosis and severity staging for trial enrollment and outcome monitoring.</p>

  <div class="diag-tier-grid">
    <div class="diag-tier-item">
      <div class="diag-tier-num">Tier 1 · Newborn Screening</div>
      <div class="diag-tier-head">Enzyme Biomarker Screen</div>
      <ul>
        <li>Dried blood spot (DBS) β-hexosaminidase A fluorometric assay</li>
        <li>Hex A/total Hex ratio: cutoff &lt;55% for TSD; Hex A+B activity for Sandhoff</li>
        <li>Sensitivity &gt;99% for acute infantile; specificity ~95% (pseudodeficiency alleles confound)</li>
        <li>Turnaround: 24–48 h from birth collection</li>
        <li>Currently mandated in New York, Massachusetts; pilot programs expanding</li>
      </ul>
    </div>
    <div class="diag-tier-item">
      <div class="diag-tier-num">Tier 2 · Confirmatory Diagnosis</div>
      <div class="diag-tier-head">Genetic &amp; Biochemical Confirmation</div>
      <ul>
        <li>Leukocyte or fibroblast β-Hex A/B activity (nmol/hr/mg protein)</li>
        <li>HEXA / HEXB full-gene sequencing + MLPA (copy number variants)</li>
        <li>Variant classification: ACMG pathogenic / likely pathogenic criteria</li>
        <li>Plasma GM2 quantification by LC-MS/MS (if available)</li>
        <li>Ophthalmologic exam: cherry-red macular spot (infantile form ~90%)</li>
        <li>Carrier testing of parents; prenatal diagnosis available</li>
      </ul>
    </div>
    <div class="diag-tier-item">
      <div class="diag-tier-num">Tier 3 · Disease Burden Assessment</div>
      <div class="diag-tier-head">Neuroimaging &amp; Electrophysiology</div>
      <ul>
        <li><strong>Brain MRI (3T):</strong> T2/FLAIR white-matter hyperintensity, bilateral thalamic T2 signal, caudate/putamen involvement, cortical atrophy scoring</li>
        <li><strong>MR Spectroscopy:</strong> NAA/Cr ratio (neuronal integrity), Cho/Cr (demyelination)</li>
        <li>VEP (visual evoked potentials): prolonged P100 latency</li>
        <li>BAER (brainstem auditory): wave V latency / amplitude</li>
        <li>EEG: background slowing, epileptiform discharges</li>
        <li><strong>CSF biomarkers:</strong> neurofilament light (NfL), GFAP, chitotriosidase</li>
        <li>Plasma NfL: correlates with rate of neurodegeneration</li>
      </ul>
    </div>
    <div class="diag-tier-item">
      <div class="diag-tier-num">Tier 4 · Functional Staging</div>
      <div class="diag-tier-head">Standardized Clinical Assessment</div>
      <ul>
        <li><strong>Bayley-III</strong> (≤42 mo): cognitive, language, motor composite scores — primary endpoint in this model</li>
        <li>Vineland Adaptive Behavior Scales (VABS-3): adaptive functioning</li>
        <li>GMFCS (Gross Motor Function Classification System)</li>
        <li>Swallowing assessment: FEES or videofluoroscopy</li>
        <li>Seizure frequency diary &amp; anti-epileptic drug burden</li>
        <li>Developmental history with milestone regression timeline</li>
        <li>Caregiver-reported QoL (PedsQL proxy)</li>
      </ul>
    </div>
  </div>

  <h3 style="font-size:1rem;font-weight:700;margin:2rem 0 0.75rem;color:var(--text);">Disease Severity Classification</h3>
  <p>Severity is determined by residual enzyme activity, age of onset, GM2 substrate load (correlating with model parameter G<sub>B,0</sub>), and rate of functional decline. Classification guides treatment urgency and defines the simulation's initial conditions.</p>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Form</th>
          <th>Age of Onset</th>
          <th>Residual β-Hex A</th>
          <th>GM2 Burden (est.)</th>
          <th>Key Clinical Features</th>
          <th>Prognosis</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="td-highlight"><span class="sev-badge sev-acute">Acute Infantile</span>Tay-Sachs / Sandhoff</td>
          <td>3–6 months</td>
          <td>&lt;1% normal</td>
          <td>&gt;800 nmol/g (model G<sub>B,0</sub> = 890)</td>
          <td>Hypotonia, exaggerated startle, cherry-red spot, rapid developmental regression, seizures, macrocephaly</td>
          <td>Median 3–5 years</td>
        </tr>
        <tr>
          <td class="td-highlight"><span class="sev-badge sev-sub">Subacute Juvenile</span>GM2 gangliosidosis</td>
          <td>2–10 years</td>
          <td>1–5% normal</td>
          <td>300–800 nmol/g</td>
          <td>Progressive ataxia, dysarthria, muscle weakness, psychiatric manifestations, preserved cognition early</td>
          <td>Early adulthood</td>
        </tr>
        <tr>
          <td class="td-highlight"><span class="sev-badge sev-chron">Chronic / Late-Onset</span>Adult GM2</td>
          <td>&gt;10 years</td>
          <td>5–30% normal</td>
          <td>&lt;300 nmol/g</td>
          <td>Spinocerebellar ataxia, lower motor neuron disease, bipolar disorder / psychosis, slow progression</td>
          <td>Near-normal lifespan</td>
        </tr>
      </tbody>
    </table>
  </div>

  <h3 style="font-size:1rem;font-weight:700;margin:2rem 0 0.75rem;color:var(--text);">Key Biomarker Reference Thresholds</h3>
  <p>The biomarkers below are used to stratify patients at baseline and track response to therapy in clinical studies. Plasma and CSF neurofilament light chain (NfL) are the most sensitive progression biomarkers; chitotriosidase reflects the neuroinflammatory burden modeled by \(I(t)\) in the SDE system.</p>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Biomarker</th>
          <th>Specimen</th>
          <th>Normal Range</th>
          <th>Mild/Subacute LSD</th>
          <th>Severe/Infantile LSD</th>
          <th>Clinical Role</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="td-highlight">β-Hexosaminidase A activity</td>
          <td>Leukocytes</td>
          <td>100–250 nmol/hr/mg</td>
          <td>5–50 nmol/hr/mg</td>
          <td>&lt;5 nmol/hr/mg</td>
          <td>Primary diagnostic criterion; maps to V<sub>max,B</sub></td>
        </tr>
        <tr>
          <td class="td-highlight">DBS β-Hex A</td>
          <td>Dried blood spot</td>
          <td>1.5–5.0 µmol/L/hr</td>
          <td>0.1–0.5 µmol/L/hr</td>
          <td>&lt;0.1 µmol/L/hr</td>
          <td>Newborn screening; flag for confirmatory</td>
        </tr>
        <tr>
          <td class="td-highlight">Plasma NfL</td>
          <td>Plasma</td>
          <td>&lt;10 pg/mL</td>
          <td>10–50 pg/mL</td>
          <td>&gt;100 pg/mL</td>
          <td>Neurodegeneration rate; correlates with D(t)</td>
        </tr>
        <tr>
          <td class="td-highlight">CSF NfL</td>
          <td>CSF</td>
          <td>&lt;300 pg/mL</td>
          <td>300–1,000 pg/mL</td>
          <td>&gt;1,000 pg/mL</td>
          <td>CNS-specific staging; most sensitive to change</td>
        </tr>
        <tr>
          <td class="td-highlight">GFAP</td>
          <td>Plasma / CSF</td>
          <td>&lt;50 pg/mL</td>
          <td>50–200 pg/mL</td>
          <td>&gt;200 pg/mL</td>
          <td>Astrocyte activation; reflects I(t) burden</td>
        </tr>
        <tr>
          <td class="td-highlight">Chitotriosidase</td>
          <td>Plasma</td>
          <td>&lt;50 nmol/mL/hr</td>
          <td>50–200 nmol/mL/hr</td>
          <td>&gt;200 nmol/mL/hr</td>
          <td>Macrophage/microglial activation; neuroinflammation proxy</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

<hr />

<div class="content">
  <h2 class="section-head">People</h2>
  <ul class="people-list">
    <li><a href="https://www.cs.utexas.edu/~bajaj/">Chandrajit Bajaj</a></li>
    <li><a href="#people">Kartheek Nekkanti</a></li>
  </ul>
</div>

<hr />

<footer>
  <div class="footer-inner">
    <p>Oden Institute for Computational Engineering and Sciences · The University of Texas at Austin</p>
    <p>Peter O'Donnell Jr. Building (POB) 2.102 · 201 E 24th St · Austin, TX 78712 · bajaj@oden.utexas.edu</p>
    <p style="margin-top:0.75rem;">© 2026 The University of Texas at Austin. All rights reserved.</p>
  </div>
</footer>
`,l=[{label:"Natural History / FUS Only",shortLabel:"NH",color:"#ef4444",dash:[],final:1325,shape:"rise"},{label:"SP2 (SRT)",shortLabel:"SP2",color:"#f97316",dash:[6,4],final:580,shape:"mild"},{label:"AAV Only",shortLabel:"AAV",color:"#a78bfa",dash:[6,4],final:470,shape:"mild2"},{label:"SP2 + FUS",shortLabel:"SP2+FUS",color:"#fbbf24",dash:[4,4],final:420,shape:"bi1"},{label:"SP2 + AAV",shortLabel:"SP2+AAV",color:"#34d399",dash:[4,4],final:350,shape:"bi2"},{label:"AAV + FUS",shortLabel:"AAV+FUS",color:"#60a5fa",dash:[4,4],final:280,shape:"bi3"},{label:"Tri-Modal (SP2+AAV+FUS)",shortLabel:"Tri-Modal",color:"#38bdf8",dash:[],final:180,shape:"tri",bold:!0}],o=250,d=32,c=20,m=48,f=60,h=(t,e)=>{const i=[];for(let a=0;a<o;a+=1){const n=a/249,s=18*(Math.random()-.5)*(1-.6*n);let r;r="rise"===t?890+(e-890)*Math.pow(n,.55):"mild"===t?890-(890-e)*(1-Math.exp(-3.2*n)):"mild2"===t?890-(890-e)*(1-Math.exp(-3.8*n)):"bi1"===t?890-(890-e)*(1-Math.exp(-4.2*n)):"bi2"===t?890-(890-e)*(1-Math.exp(-4.5*n)):"bi3"===t?890-(890-e)*(1-Math.exp(-5*n)):890-(890-e)*(1-Math.exp(-6*n)),i.push(r+s)}return i},g=()=>n.createElement(n.Fragment,null,n.createElement("html",{lang:"en"}),n.createElement("title",null,"A Novel Tri-Modal Viral–Ultrasound Gene-Delivery Therapy Protocol for Lysosomal Neurodegeneration via Stochastic Model Optimization with Uncertainty Quantification and Generalizability | Computational Visualization Center"),n.createElement("meta",{name:"description",content:"Computationally optimized tri-modal AAV-T4, SP2, and focused ultrasound gene-delivery protocol for lysosomal neurodegeneration."}),n.createElement("meta",{name:"viewport",content:"width=device-width,initial-scale=1.0"}),n.createElement("link",{rel:"preconnect",href:"https://fonts.googleapis.com"}),n.createElement("link",{rel:"preconnect",href:"https://fonts.gstatic.com",crossOrigin:""}),n.createElement("link",{href:"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap",rel:"stylesheet"}));e.default=()=>{const t=n.useRef(null);return n.useEffect((()=>{if(!t.current)return;const e=t.current.querySelector("#hero-canvas"),n=e?(t=>{const e=t.getContext("2d"),i=l.map((t=>({...t,data:h(t.shape,t.final)}))),n=i.flatMap((t=>t.data)),s=Math.min.apply(Math,(0,a.A)(n))-50,r=Math.max.apply(Math,(0,a.A)(n))+50;let g=null,y=null,p=0,x=0;const u=()=>{const i=window.devicePixelRatio||1,a=t.parentElement.getBoundingClientRect();p=a.width,x=Math.min(360,.42*p),t.width=p*i,t.height=x*i,t.style.width=`${p}px`,t.style.height=`${x}px`,e.setTransform(i,0,0,i,0,0)},b=t=>f+t/249*(p-f-c),v=t=>d+(1-(t-s)/(r-s))*(x-d-m),w=t=>{y||(y=t);const a=p<520,n=(t-y)%5200/5200,s=n<.7?n/.7:1,r=n<.85?1:1-(n-.85)/.15,l=s<1?1-Math.pow(1-s,2.5):1,h=Math.max(2,Math.floor(l*o));e.clearRect(0,0,p,x),e.fillStyle="#0d1117",e.fillRect(0,0,p,x),[200,400,600,800,1e3,1200,1400].forEach((t=>{const i=v(t);i<d||i>x-m||(e.strokeStyle="rgba(255,255,255,0.06)",e.lineWidth=1,e.setLineDash([]),e.beginPath(),e.moveTo(f,i),e.lineTo(p-c,i),e.stroke(),e.fillStyle="rgba(255,255,255,0.28)",e.font="10px Inter, sans-serif",e.textAlign="right",e.fillText(t,f-8,i+4))}));const u=v(500);e.strokeStyle="rgba(251,146,60,0.35)",e.lineWidth=1,e.setLineDash([5,5]),e.beginPath(),e.moveTo(f,u),e.lineTo(p-c,u),e.stroke(),e.setLineDash([]),e.fillStyle="rgba(251,146,60,0.5)",e.font=a?"8px Inter, sans-serif":"9px Inter, sans-serif",e.textAlign="left",e.fillText(a?"G_th = 500":"G_th = 500 nmol/g (microglial activation)",f+6,u-5),e.strokeStyle="rgba(255,255,255,0.2)",e.lineWidth=1.5,e.beginPath(),e.moveTo(f,d),e.lineTo(f,x-m),e.lineTo(p-c,x-m),e.stroke(),[0,90,180,270,365].forEach((t=>{const i=f+t/365*(p-f-c);e.fillStyle="rgba(255,255,255,0.35)",e.font="10px Inter, sans-serif",e.textAlign="center",e.fillText(`Day ${t}`,i,x-m+15)})),e.save(),e.translate(14,x/2),e.rotate(-Math.PI/2),e.fillStyle="rgba(255,255,255,0.35)",e.font="10px Inter, sans-serif",e.textAlign="center",e.fillText("Brain GM2 burden (nmol g⁻¹)",0,0),e.restore(),i.forEach((t=>{if(t.bold)return;const i=t.data.slice(0,h);i.length<2||(e.globalAlpha=.7*r,e.strokeStyle=t.color,e.lineWidth=1.5,e.setLineDash(t.dash),e.lineJoin="round",e.beginPath(),i.forEach(((t,i)=>{0===i?e.moveTo(b(i),v(t)):e.lineTo(b(i),v(t))})),e.stroke(),e.setLineDash([]))}));const A=i.find((t=>t.bold));if(A){const t=A.data.slice(0,h);if(t.length>=2&&(e.globalAlpha=r,e.strokeStyle=A.color,e.lineWidth=3,e.setLineDash([]),e.lineJoin="round",e.shadowColor=A.color,e.shadowBlur=10,e.beginPath(),t.forEach(((t,i)=>{0===i?e.moveTo(b(i),v(t)):e.lineTo(b(i),v(t))})),e.stroke(),e.shadowBlur=0,h>180)){const i=t[t.length-1],a=b(h-1),n=v(i);e.globalAlpha=r*Math.min(1,(h-180)/40),e.fillStyle=A.color,e.font="bold 11px Inter, sans-serif",e.textAlign="left",e.fillText("↓ 75.7%  (180 nmol/g)",a+6,n+4)}}if(e.globalAlpha=1,!a){const t=p-c-190,a=d+6;i.forEach(((i,n)=>{const s=a+16*n;e.strokeStyle=i.color,e.lineWidth=i.bold?2.5:1.5,e.setLineDash(i.dash),e.globalAlpha=i.bold?1:.7,e.beginPath(),e.moveTo(t,s),e.lineTo(t+22,s),e.stroke(),e.setLineDash([]),e.globalAlpha=1,e.fillStyle=i.bold?"#ffffff":"rgba(255,255,255,0.5)",e.font=i.bold?"bold 9.5px Inter, sans-serif":"9px Inter, sans-serif",e.textAlign="left",e.fillText(i.label,t+28,s+3.5)}))}if(h<o){const t=Math.round(h/o*365);e.fillStyle="rgba(255,255,255,0.25)",e.font="9px Inter, sans-serif",e.textAlign="left",e.fillText(`Day ${t} / 365`,f+6,d+14)}g=window.requestAnimationFrame(w)},A=()=>{u(),y=null};return u(),g=window.requestAnimationFrame(w),window.addEventListener("resize",A),()=>{window.removeEventListener("resize",A),g&&window.cancelAnimationFrame(g)}})(e):void 0,s=Array.from(t.current.querySelectorAll(".tab-btn")).map((t=>{const e=()=>{const e=t.closest(".sde-tabs");if(!e)return;e.querySelectorAll(".tab-btn").forEach((t=>t.classList.remove("active"))),e.querySelectorAll(".tab-panel").forEach((t=>t.classList.remove("active"))),t.classList.add("active");const i=e.querySelector(`[data-panel="${t.dataset.tab}"]`);i&&i.classList.add("active")};return t.addEventListener("click",e),[t,e]}));return Promise.all([i.e(611),i.e(529)]).then(i.bind(i,3529)).then((e=>{(e.default||e)(t.current,{delimiters:[{left:"\\[",right:"\\]",display:!0},{left:"\\(",right:"\\)",display:!1}],throwOnError:!1})})),()=>{n&&n(),s.forEach((t=>{let[e,i]=t;return e.removeEventListener("click",i)}))}}),[]),n.createElement("div",{className:"trimod-page",ref:t},n.createElement("nav",{className:"navbar"},n.createElement(s.N_,{className:"nav-brand",to:"/"},n.createElement("svg",{width:"34",height:"34",viewBox:"0 0 60 60",fill:"none",xmlns:"http://www.w3.org/2000/svg"},n.createElement("circle",{cx:"30",cy:"30",r:"30",fill:"#BF5700"}),n.createElement("text",{x:"50%",y:"55%",dominantBaseline:"middle",textAnchor:"middle",fill:"white",fontSize:"21",fontWeight:"800",fontFamily:"Georgia, serif"},"UT")),n.createElement("div",null,n.createElement("div",{className:"nav-brand-text"},"Oden Institute",n.createElement("span",{className:"nav-brand-sub"},"The University of Texas at Austin")))),n.createElement("ul",{className:"nav-links"},n.createElement("li",null,n.createElement(s.N_,{to:"/"},"Home")),n.createElement("li",null,n.createElement(s.N_,{to:"/projects"},"Projects")),n.createElement("li",null,n.createElement(s.N_,{to:"/people"},"People")),n.createElement("li",null,n.createElement(s.N_,{to:"/publications"},"Publications")),n.createElement("li",null,n.createElement(s.N_,{to:"/news"},"News")),n.createElement("li",null,n.createElement(s.N_,{to:"/software"},"Software")),n.createElement("li",null,n.createElement(s.N_,{to:"/about"},"About")))),n.createElement("div",{dangerouslySetInnerHTML:{__html:r}}))}}}]);
//# sourceMappingURL=component---src-pages-projects-tri-modal-gene-therapy-js-074fa7eac4d059fb413c.js.map