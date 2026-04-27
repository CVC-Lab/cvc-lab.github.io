(function () {
  const pageId = document.body.dataset.page;
  if (!pageId) return;

  const storageKey = "dbg-unlocked:" + pageId;
  const gate = document.getElementById("gate");
  const content = document.getElementById("protected");
  const form = document.getElementById("gate-form");
  const input = document.getElementById("gate-pw");

  function unlock() {
    gate.hidden = true;
    content.hidden = false;
    try { sessionStorage.setItem(storageKey, "1"); } catch (_) {}
  }

  if (sessionStorage.getItem(storageKey) === "1") {
    unlock();
    return;
  }

  // Focus the password field once the gate is visible.
  requestAnimationFrame(() => input && input.focus());

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    // Convenience gate only — any value (including empty) unlocks.
    unlock();
  });
})();
