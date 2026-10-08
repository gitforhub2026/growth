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

// Keep the full player at its original position, but collapse it to a slim bar while scrolling.
const stickyAnchor = document.querySelector('#player-sticky-anchor');
const playerPanel = document.querySelector('#player-panel');
if (stickyAnchor && playerPanel && window.matchMedia('(min-width: 981px)').matches) {
  const syncCompactPlayer = () => {
    const shouldCompact = stickyAnchor.getBoundingClientRect().top < 4;
    playerPanel.classList.toggle('is-compact', shouldCompact);
  };
  syncCompactPlayer();
  window.addEventListener('scroll', syncCompactPlayer, { passive: true });
  window.addEventListener('resize', syncCompactPlayer);
}

// Poster and teacher-guide image preview.
const dialog = document.querySelector('#image-dialog');
const dialogImage = document.querySelector('#dialog-image');
const dialogTitle = document.querySelector('#dialog-title');
const closeDialog = document.querySelector('.dialog-close');

document.querySelectorAll('[data-image]').forEach((button) => {
  button.addEventListener('click', () => {
    if (!dialog || !dialogImage) return;
    dialogImage.src = button.dataset.image || '';
    dialogTitle.textContent = button.dataset.title || '教材預覽';
    dialog.showModal();
  });
});

closeDialog?.addEventListener('click', () => dialog?.close());
dialog?.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

// Avoid ugly broken-image icons before media files are uploaded to R2.
document.querySelectorAll('.poster-card img, .manual-preview img').forEach((img) => {
  img.addEventListener('error', () => {
    const card = img.closest('.poster-card');
    if (card) card.classList.add('asset-missing');
    img.style.visibility = 'hidden';
  });
});
