// Mobile reading UX: playing an episode from its card must not pull the reader
// away from the copy they are currently reading.
(() => {
  const episodeGrid = document.querySelector('#episode-grid');
  if (!episodeGrid || typeof selectEpisode !== 'function') return;

  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('#episode-grid .play-btn[data-play]');
    if (!button) return;

    // The original card handler calls selectEpisode(..., shouldScroll=true).
    // Intercept it before the target handler and replay the action without scrolling.
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const readingPosition = window.scrollY;
    selectEpisode(button.dataset.play, true, false);

    // renderEpisodes() replaces the card DOM. Keep the viewport anchored even if
    // a browser makes a tiny layout adjustment during that replacement.
    requestAnimationFrame(() => {
      window.scrollTo({ top: readingPosition, left: 0, behavior: 'auto' });
    });
  }, true);
})();
