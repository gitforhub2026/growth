function expandEpisodeDetails() {
  document.querySelectorAll('.episode-card details').forEach((details) => {
    details.open = true;
  });
}

expandEpisodeDetails();

const episodeGrid = document.querySelector('#episode-grid');
if (episodeGrid) {
  const observer = new MutationObserver(() => expandEpisodeDetails());
  observer.observe(episodeGrid, { childList: true, subtree: true });
}
