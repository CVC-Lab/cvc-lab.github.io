window.mermaidConfig = {
  startOnLoad: false,
  securityLevel: "loose",
  theme: "default",
};

function renderMermaid() {
  if (typeof mermaid === "undefined") {
    return;
  }
  mermaid.initialize(window.mermaidConfig);
  mermaid.run({ querySelector: ".mermaid" });
}

if (typeof document$ !== "undefined") {
  document$.subscribe(function () {
    renderMermaid();
  });
} else {
  document.addEventListener("DOMContentLoaded", function () {
    renderMermaid();
  });
}
