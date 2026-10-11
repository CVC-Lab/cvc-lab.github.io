"use strict";(self.webpackChunkcvc_website=self.webpackChunkcvc_website||[]).push([[533],{923:function(e,t,i){i.r(t),i.d(t,{Head:function(){return l}});var a=i(6540),s=i(7528),n=i(7514),r=i(6289);const o="/projects/tri-modal-sensitivity-audit",d=(0,r.L)(String.raw`
<div class="hero">
  <div class="hero-tag">Manuscript under submission · September 2026</div>

  <h1>
    <span>A Prior-Robust Sensitivity</span>
    <span>and Factorial-Necessity Analysis</span>
    <span>of Tri-Modal Viral-Ultrasound</span>
    <span>Gene Delivery for Lysosomal</span>
    <span>Neurodegeneration</span>
  </h1>

  <p class="hero-authors">
    Kartheek Nekkanti<span><sup>1</sup></span>,&ensp;Chandrajit Bajaj<span><sup>2</sup></span>
  </p>
  <p class="hero-affil">
    <span class="affil-line"><sup>1</sup>Westwood High School,</span>
    <span class="affil-line">Round Rock Independent School District, Austin, TX</span>
    <span class="affil-line"><sup>2</sup>Oden Institute for Computational Engineering and Sciences,</span>
    <span class="affil-line">The University of Texas at Austin, Austin, TX</span>
  </p>

  <div class="hero-links">
    <a href="${o}/Nekkanti-Bajaj-prior-robust-audit-sep2026.pdf">Paper</a>
    <span class="sep" aria-hidden="true">|</span>
    <a href="https://doi.org/10.5281/zenodo.21985843">Data &amp; Outputs (Zenodo)</a>
    <span class="sep" aria-hidden="true">|</span>
    <a href="/projects/tri-modal-gene-therapy/">Original Model (May 2026)</a>
  </div>
</div>

<div class="content">
  <div class="followup-note">
    <strong>Follow-up study.</strong> This paper audits the headline result of our
    <a href="/projects/tri-modal-gene-therapy/">May 2026 tri-modal gene-therapy model</a>, which reported that
    blood–brain-barrier entry dominates GM2 outcome variance (\(S_T = 0.909\)). Under converged sampling and corrected
    input-uncertainty specifications, that ranking reverses: enzyme-kinetic and synthesis parameters dominate, and focused
    ultrasound adds a statistically detectable but practically negligible benefit by day 365.
  </div>
</div>

<hr />

<div class="content" id="abstract">
  <h2 class="section-head">Abstract</h2>
  <p>Global sensitivity analysis identifies which parameters of a stochastic biological model drive outcome variance, but variance-based indices are sensitive by construction to each input's prior width, so a dominant index can reflect a calibration choice rather than the underlying biology. We present a four-part audit protocol for distinguishing these two explanations — convergence verification, prior-specification robustness, structural saturation analysis, and factorial intervention-necessity testing — and demonstrate it on a 17-state stochastic model of tri-modal (substrate-reduction, AAV gene, and focused-ultrasound) therapy for GM2 gangliosidosis, chosen because an initial, as-documented analysis indicates BBB-entry kinetics dominate terminal substrate variance (\(S_T = 0.909\)), supporting delivery-focused engineering over enzyme optimization; this entry-rate parameter, however, shares the widest relative uncertainty band assigned to any input tier, raising the possibility that its dominance is a calibration artifact rather than biology.</p>
  <p>The saturation step (a 25-point continuous sweep) shows terminal substrate burden is insensitive to this parameter across twelve orders of magnitude, indicating a saturated regime at the calibrated dose. The robustness step (re-analysis under two corrected prior specifications) consistently identifies enzyme-kinetics parameters (synthesis, catalytic decay, capacity, Michaelis constant) as dominant instead, a pattern holding across ten disease parameterizations. The necessity step (a matched-seed factorial analysis) shows focused-ultrasound (FUS)'s contribution to combination therapy is statistically detectable but practically negligible and time-dependent, a conclusion that itself proves robust to a literature-bounded alternative acoustic mechanism.</p>
  <p>These results identify enzyme-kinetic parameters, not BBB-entry kinetics, as the highest-leverage within-model bottleneck under the tested assumptions, illustrating how the protocol can overturn a sensitivity-derived conclusion using only convergence, input-specification, and structural checks — no new experimental data. External comparisons revealed substantial absolute-prediction disagreements for untreated natural history, AAV monotherapy, and SRT monotherapy; the reported reversal should therefore be interpreted as a within-model sensitivity and necessity audit, not a validated therapeutic prioritization.</p>
</div>

<hr />

<div class="content">
  <h2 class="section-head">In Plain Terms</h2>
  <p>Children with GM2 gangliosidosis (Tay–Sachs and Sandhoff disease) lack an enzyme needed to clear a fatty molecule from brain cells, and the infantile disease is fatal. Our earlier computer model of three combined therapies suggested the biggest obstacle was getting therapy across the barrier that protects the brain from the bloodstream. That conclusion turned out to depend heavily on how much uncertainty was assigned to the barrier-crossing step — the part of the model least constrained by published data.</p>
  <p>Recalculating with careful, consistent assumptions reversed the conclusion: at the modeled dose, barrier crossing already works essentially at its ceiling, and the real bottleneck is how efficiently the replacement enzyme breaks down the harmful molecule once it arrives. The same pattern held across the other lysosomal disorders we tested. The broader lesson for disease models: a headline sensitivity result can reflect which assumptions were given the most room for uncertainty, and should be checked before it guides real experiments.</p>
</div>

<hr />

<div class="content">
  <h2 class="section-head">From Initial Claim to Corrected Finding</h2>
  <div class="fig-wrap">
    <img src="${o}/fig1_audit_overview_1800.webp" srcset="${o}/fig1_audit_overview_800.webp 800w, ${o}/fig1_audit_overview_1800.webp 1800w" sizes="${n.N}" alt="Figure 1: Flow from the original BBB-entry claim through three audit checks to the corrected enzyme-kinetics finding" width="1800" height="1100" loading="lazy" decoding="async" />
    <p class="fig-caption"><strong>Figure 1.</strong> <em>(A)</em> The initial, as-documented analysis. <em>(B)</em> Three independent audit checks: convergence, prior-width robustness, and saturation / factorial necessity. <em>(C)</em> The corrected finding these checks converge on. <em>(D)</em> The general methodological lesson. Separately, external validation against published data (bottom) identifies absolute-accuracy limitations that are orthogonal to, and do not resolve, the audit logic in (A)–(D).</p>
  </div>
</div>

<hr />

<div class="content">
  <h2 class="section-head">The Four-Part Audit Protocol</h2>
  <p>Each step answers a different question. Conflating them is a common source of misinterpretation in sensitivity-based biological modeling.</p>
  <div class="diag-tier-grid">
    <div class="diag-tier-item">
      <div class="diag-tier-num">Step 1 · Convergence</div>
      <h3 class="diag-tier-head">Are the indices numerically stable?</h3>
      <ul>
        <li>Sobol total-order indices at \(N = 64\)–\(1{,}024\)</li>
        <li>Top-five ranking unchanged for \(N \ge 128\)</li>
        <li>Bootstrap SE below 0.01 by \(N = 256\), the production size</li>
      </ul>
    </div>
    <div class="diag-tier-item">
      <div class="diag-tier-num">Step 2 · Prior Robustness</div>
      <h3 class="diag-tier-head">Does the ranking survive corrected priors?</h3>
      <ul>
        <li>As-documented, equal-width, and Tier-1-promoted input distributions</li>
        <li>Same estimator, sample size, and seed across scenarios</li>
        <li>Repeated for ten disease parameterizations</li>
      </ul>
    </div>
    <div class="diag-tier-item">
      <div class="diag-tier-num">Step 3 · Saturation</div>
      <h3 class="diag-tier-head">Is the parameter at a ceiling?</h3>
      <ul>
        <li>25-point sweep of \(k_{T4,\text{entry}}\) over twelve orders of magnitude</li>
        <li>50 stochastic realizations per point</li>
        <li>Local elasticity \(|E(k)| \le 5.3 \times 10^{-4}\)</li>
      </ul>
    </div>
    <div class="diag-tier-item">
      <div class="diag-tier-num">Step 4 · Necessity</div>
      <h3 class="diag-tier-head">Is the intervention needed at all?</h3>
      <ul>
        <li>Full \(2^3 = 8\)-arm factorial over SRT, AAV, and FUS</li>
        <li>200 matched-seed realizations per arm, paired contrasts</li>
        <li>Shapley attribution at days 45, 90, 180, and 365</li>
      </ul>
    </div>
  </div>

  <div class="table-wrap" role="region" aria-label="BBB-entry Sobol index by analysis stage">
    <table>
      <thead>
        <tr>
          <th>Analysis stage</th>
          <th>Parameters</th>
          <th>\(N\)</th>
          <th>\(S_T(k_{T4,\text{entry}})\)</th>
          <th>Interpretation</th>
        </tr>
      </thead>
      <tbody>
        <tr><td class="td-highlight">Original, pre-audit</td><td>unconfirmed</td><td>unconfirmed</td><td>0.909</td><td>Delivery-dominant claim</td></tr>
        <tr><td class="td-highlight">Recomputed as-documented</td><td>\(D = 14\)</td><td>256</td><td>0.039</td><td>Entry no longer dominant</td></tr>
        <tr><td class="td-highlight">Equal-width</td><td>\(D = 14\)</td><td>256</td><td>0.001</td><td>Prior-width correction</td></tr>
        <tr><td class="td-highlight">Tier-1-promoted</td><td>\(D = 14\)</td><td>256</td><td>0.004</td><td>Evidence-tier correction</td></tr>
      </tbody>
    </table>
  </div>
  <p class="fig-caption">The pre-audit sampling configuration is not recoverable, so 0.909 is treated only as the motivating claim. All conclusions rest on the three recomputed analyses, which share an identical \(N = 256\), \(D = 14\) configuration and differ only in prior specification.</p>
</div>

<hr />

<div class="content">
  <h2 class="section-head">BBB Entry Is Already Saturated</h2>
  <div class="fig-wrap">
    <img src="${o}/fig2_saturation_1800.webp" srcset="${o}/fig2_saturation_800.webp 800w, ${o}/fig2_saturation_1800.webp 1800w" sizes="${n.N}" alt="Figure 2: Convergence of the BBB-entry Sobol index, flat terminal burden across a twelve-order sweep, and near-zero local elasticity" width="1800" height="556" loading="lazy" decoding="async" />
    <p class="fig-caption"><strong>Figure 2.</strong> <em>(A)</em> Total-order Sobol index for \(k_{T4,\text{entry}}\) across \(N = 64\)–\(1{,}024\) with bootstrap standard errors (\(B = 1{,}000\)); the estimate stabilizes from \(N = 128\). <em>(B)</em> Terminal substrate burden across a 25-point log-spaced sweep of \(k_{T4,\text{entry}}\) (\(10^{-18}\) to \(10^{-6}\), 50 realizations per point); burden changes by less than 0.1% (226.83 → 226.63 nmol/g). The calibrated value (dashed line, 0.06) sits in the same saturated regime. <em>(C)</em> Local elasticity \(E(k) = \partial \log Y / \partial \log k\) stays within \(5.3 \times 10^{-4}\) of zero.</p>
  </div>
  <p>At the administered AAV dose, the entry pathway runs far faster than the timescale over which the rest of the system evolves. The entry rate is therefore numerically irrelevant to the outcome across its full range of biologically plausible uncertainty, and no Sobol analysis at realistic widths can detect entry-rate sensitivity in this model — whatever the sample size. Delivery is still <em>necessary</em>: driving \(k_{T4,\text{entry}} \to 0\) returns the model to the untreated baseline. It is simply already sufficient.</p>
</div>

<hr />

<div class="content">
  <h2 class="section-head">Enzyme Kinetics Dominate Under Every Prior Specification</h2>
  <div class="fig-wrap">
    <img src="${o}/fig3_sobol_forest_1800.webp" srcset="${o}/fig3_sobol_forest_800.webp 800w, ${o}/fig3_sobol_forest_1800.webp 1800w" sizes="${n.N}" alt="Figure 3: Forest plots showing enzyme and synthesis parameters dominate Sobol indices for GM2 and across ten lysosomal disease parameterizations" width="1800" height="872" loading="lazy" decoding="async" />
    <p class="fig-caption"><strong>Figure 3.</strong> <em>(A)</em> Total-order Sobol indices for the audited GM2 parameters under three prior specifications (marker shape encodes scenario; delivery-related parameters in blue, enzyme/synthesis parameters in vermillion). <em>(B)</em> Each disease's dominant parameter (vermillion) versus its BBB-entry rate (blue), with bootstrap 95% confidence intervals, across all ten disease parameterizations. The dotted line at \(S_T = 1\) marks the theoretical upper bound.</p>
  </div>

  <div class="table-wrap" role="region" aria-label="Total-order Sobol indices">
    <table>
      <thead>
        <tr>
          <th>Parameter (GM2)</th>
          <th>As-documented</th>
          <th>Equal-width</th>
          <th>Tier-1-promoted</th>
        </tr>
      </thead>
      <tbody>
        <tr><td class="td-highlight">Synthesis rate</td><td>0.237</td><td>0.260</td><td>0.250</td></tr>
        <tr><td class="td-highlight">Catalytic decay</td><td>0.221</td><td>0.242</td><td>0.232</td></tr>
        <tr><td class="td-highlight">Catalytic capacity</td><td>0.222</td><td>0.245</td><td>0.235</td></tr>
        <tr><td class="td-highlight">Michaelis constant</td><td>0.185</td><td>0.206</td><td>0.198</td></tr>
        <tr><td class="td-highlight">Expression rate</td><td>0.101</td><td>0.097</td><td>0.102</td></tr>
        <tr><td>Total AAV dose</td><td>0.058</td><td>0.001</td><td>0.038</td></tr>
        <tr><td>BBB-entry rate</td><td>0.039</td><td>0.001</td><td>0.004</td></tr>
        <tr><td>IC50</td><td>0.003</td><td>0.003</td><td>0.003</td></tr>
        <tr><td>FUS permeability gain</td><td>0.000</td><td>0.000</td><td>0.000</td></tr>
      </tbody>
    </table>
  </div>
  <p class="fig-caption">Total-order Sobol indices, full nine-parameter set with nonzero sensitivity. Bootstrap percentile 95% intervals are reported in the manuscript (Table 4).</p>

  <p>The five enzyme-kinetics and synthesis parameters occupy \(S_T = 0.075\)–\(0.260\) in every scenario, while the four delivery- and dose-related parameters stay lowest-ranked — including in the as-documented configuration — and the margin between the two classes widens under both corrections. Across Tay–Sachs, Sandhoff, Pompe, Krabbe, GM1, MPS I, MLD, CLN2, Niemann–Pick C, and Fabry, an enzyme-kinetic or synthesis parameter dominates in nine of ten cases. Pompe is the interpretable exception: total AAV dose, not entry rate, dominates (\(S_T = 0.40\)–\(0.43\)), consistent with known dose-titration considerations in Pompe enzyme-replacement therapy.</p>
</div>

<hr />

<div class="content">
  <h2 class="section-head">Sensitivity Is Not Necessity: The Factorial Test</h2>
  <div class="fig-wrap">
    <img src="${o}/fig6_factorial_1800.webp" srcset="${o}/fig6_factorial_800.webp 800w, ${o}/fig6_factorial_1800.webp 1800w" sizes="${n.N}" alt="Figure 6: Day-365 GM2 burden for all eight SRT, AAV, and FUS intervention combinations, 200 realizations each" width="1800" height="1145" loading="lazy" decoding="async" />
    <p class="fig-caption"><strong>Figure 6.</strong> All \(n = 200\) per-seed day-365 GM2 burden realizations for each of the eight intervention combinations (jittered for visibility), with mean ± one standard deviation. Adding FUS to any arm leaves the distribution essentially unchanged.</p>
  </div>
  <p>Sobol and Shapley indices ask whether varying a parameter changes the outcome <em>given</em> an intervention is active; they never switch the mechanism off. The full factorial design does. Every paired FUS contrast at day 365 has a 95% confidence interval that excludes zero, but the largest effect (−0.032 nmol/g) is 1.3% of a pre-defined practical-equivalence threshold of 2.51 nmol/g — two to three orders of magnitude smaller than the effect of AAV or SRT themselves. FUS is therefore <strong>statistically detectable but practically negligible</strong> by one year.</p>

  <div class="fig-wrap">
    <img src="${o}/fig5_fus_shapley_1800.webp" srcset="${o}/fig5_fus_shapley_800.webp 800w, ${o}/fig5_fus_shapley_1800.webp 1800w" sizes="${n.N}" alt="Figure 5: Shapley attribution of tri-modal benefit over time, with FUS contribution falling from 2.14 percent at day 45 to near zero" width="1800" height="720" loading="lazy" decoding="async" />
    <p class="fig-caption"><strong>Figure 5.</strong> <em>(A)</em> Shapley-attributed share of total tri-modal benefit for AAV, SRT, and FUS at days 45, 90, 180, and 365 (day 365: AAV 94.88%, SRT 5.12%). <em>(B)</em> FUS alone: a small, real early contribution (2.14% at day 45) that decays and turns slightly negative by day 365.</p>
  </div>
  <p>The early-but-fading FUS contribution is consistent with a model in which FUS multiplies an entry rate that is already saturated once AAV or SRT is active, and whose benefit fades as AAV expression itself wanes after its peak around day 250–300. The conclusion holds when the FUS gain is recomputed from a literature-bounded, infant-permissive acoustic threshold. We treat the time course as a model-specific interaction requiring further mechanistic verification.</p>
</div>

<hr />

<div class="content">
  <h2 class="section-head">What This Does — and Does Not — Claim</h2>
  <p>The paper does not claim that BBB delivery is biologically unimportant, that focused ultrasound is ineffective in vivo, or that enzyme engineering should be clinically prioritized without experimental validation. It shows that, in this simulator and parameter regime, the original delivery-dominant Sobol conclusion is not robust to convergence, input-width, saturation, and factorial-necessity checks.</p>
  <p>External comparisons found real disagreements with published data in all three monotherapy arms tested — untreated natural history, AAV monotherapy, and SRT monotherapy. These limit confidence in the model's absolute predictions, not its relative-sensitivity structure. FUS is represented as a scalar gain on entry and uptake rates in a lumped, non-spatial configuration; the findings do not extend to spatially resolved acoustic delivery. Structural model uncertainty (for example, alternative functional forms to Michaelis–Menten kinetics) is left to future work.</p>
  <p>Computation was performed on Lonestar6 at the Texas Advanced Computing Center.</p>
</div>

<hr />

<div class="content">
  <h2 class="section-head">People</h2>
  <ul class="people-list">
    <li><a href="https://www.cs.utexas.edu/~bajaj/">Chandrajit Bajaj</a></li>
    <li>Kartheek Nekkanti</li>
  </ul>
</div>
`),l=({location:e})=>a.createElement(s.A,{title:"Prior-Robust Sensitivity Analysis of Tri-Modal Gene Delivery",description:"A four-part audit (convergence, prior robustness, saturation, factorial necessity) that reverses the BBB-entry bottleneck claim of a tri-modal GM2 gene-therapy model: enzyme kinetics dominate, and focused ultrasound is practically negligible by day 365.",pathname:e.pathname,image:`${o}/fig1_audit_overview.png`,imageAlt:"Figure 1: Flow from the original BBB-entry claim through three audit checks to the corrected enzyme-kinetics finding",type:"article"});t.default=()=>a.createElement(n.A,null,a.createElement("div",{dangerouslySetInnerHTML:{__html:d}}))},4517:function(e,t,i){var a=i(6540),s=i(5549);t.A=({to:e,className:t="",children:i})=>a.createElement(s.Ay,{to:e,className:`back-link ${t}`.trim()},a.createElement("span",{className:"back-link__arrow","aria-hidden":"true"},"←"),a.createElement("span",{className:"back-link__label"},i))},6289:function(e,t,i){i.d(t,{L:function(){return n}});var a=i(2130);const s=/\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)/g,n=e=>e.replace(s,((e,t,i)=>a.Ay.renderToString(void 0===t?i:t,{displayMode:void 0!==t,throwOnError:!0})))},7514:function(e,t,i){i.d(t,{N:function(){return d}});var a=i(6540),s=i(4794),n=i(3514),r=i(4517),o=i(5549);const d="(max-width: 640px) calc(100vw - 2rem), (max-width: 860px) calc(100vw - 3rem), 812px";t.A=({children:e})=>{const t=a.useRef(null);return a.useEffect((()=>{const e=t.current,i=e=>{if(e.defaultPrevented||0!==e.button)return;if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;const t=e.target.closest("a[href]");if(!t||t.target)return;const{kind:i,href:a}=(0,o.nm)(t.getAttribute("href"));"internal"===i&&(e.preventDefault(),(0,s.navigate)(a))};return e.addEventListener("click",i),()=>e.removeEventListener("click",i)}),[]),a.useEffect((()=>{const e=Array.from(t.current.querySelectorAll(".table-wrap, .katex-display")),i=()=>e.forEach((e=>{e.scrollWidth>e.clientWidth+1?e.setAttribute("tabindex","0"):e.removeAttribute("tabindex")}));let a=null;window.ResizeObserver?(a=new window.ResizeObserver(i),e.forEach((e=>{a.observe(e),e.firstElementChild&&a.observe(e.firstElementChild)}))):i();let s=!0;return document.fonts&&document.fonts.ready.then((()=>s&&i())),()=>{s=!1,a&&a.disconnect()}}),[]),a.createElement(n.A,{headerVariant:"compact"},a.createElement("article",{className:"trimod-page",ref:t},a.createElement("noscript",null,a.createElement("style",{dangerouslySetInnerHTML:{__html:".trimod-page .anim-panel,.trimod-page .anim-caption,.trimod-page .sde-tabs .ui-tabs{display:none}.trimod-page .tab-panel[hidden]{display:block !important}"}})),a.createElement("div",{className:"back"},a.createElement(r.A,{to:"/projects/"},"Back to Projects")),e))}}}]);
//# sourceMappingURL=component---src-pages-projects-tri-modal-sensitivity-audit-js-8924f7e1f06942e2f69b.js.map