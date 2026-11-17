/* Pins the page to the visual viewport and unlocks audio on the first gesture.
   In-app browsers resize the visual viewport when their toolbars show. */
(function () {
  function sync() {
    const vv = window.visualViewport;
    const w = vv ? vv.width : window.innerWidth;
    const h = vv ? vv.height : window.innerHeight;
    const root = document.documentElement;
    root.style.setProperty("--vvw", w + "px");
    root.style.setProperty("--vvh", h + "px");
    root.style.setProperty("--vv-top", (vv ? vv.offsetTop : 0) + "px");
    root.style.setProperty("--vv-left", (vv ? vv.offsetLeft : 0) + "px");
  }

  sync();
  window.addEventListener("resize", sync);
  window.addEventListener("orientationchange", function () {
    sync();
    setTimeout(sync, 250);
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", function () {
      sync();
      window.dispatchEvent(new Event("resize"));
    });
    window.visualViewport.addEventListener("scroll", sync);
  }

  document.addEventListener("gesturestart", function (e) {
    e.preventDefault();
  }, { passive: false });

  function unlock() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      if (!window.__mobileAudio) window.__mobileAudio = new AC();
      if (window.__mobileAudio.state === "suspended") window.__mobileAudio.resume();
    } catch (err) {
      /* Audio is optional. The game still runs. */
    }
  }

  document.addEventListener("pointerdown", unlock, { passive: true });
  document.addEventListener("keydown", unlock);
  window.viewSize = function () {
    const vv = window.visualViewport;
    return {
      w: Math.max(1, Math.round(vv ? vv.width : window.innerWidth)),
      h: Math.max(1, Math.round(vv ? vv.height : window.innerHeight))
    };
  };
})();
