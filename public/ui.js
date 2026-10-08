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

// Keep the full player at its original position, but collapse it to a very slim bar while scrolling.
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

// Poster lightbox with previous / next navigation.
const dialog = document.querySelector('#image-dialog');
const dialogImage = document.querySelector('#dialog-image');
const dialogTitle = document.querySelector('#dialog-title');
const dialogCounter = document.querySelector('#dialog-counter');
const closeDialog = document.querySelector('.dialog-close');
const prevButton = document.querySelector('.dialog-prev');
const nextButton = document.querySelector('.dialog-next');
const posterCards = Array.from(document.querySelectorAll('.poster-card[data-image]'));
let activePosterIndex = 0;

function showPoster(index) {
  if (!posterCards.length || !dialogImage) return;
  activePosterIndex = (index + posterCards.length) % posterCards.length;
  const card = posterCards[activePosterIndex];
  dialogImage.src = card.dataset.image || '';
  dialogImage.alt = `${card.dataset.title || '教材'}海報預覽`;
  if (dialogTitle) dialogTitle.textContent = card.dataset.title || '教材預覽';
  if (dialogCounter) dialogCounter.textContent = `${activePosterIndex + 1} / ${posterCards.length}`;
}

posterCards.forEach((button, index) => {
  button.addEventListener('click', () => {
    if (!dialog || !dialogImage) return;
    showPoster(index);
    dialog.showModal();
  });
});

prevButton?.addEventListener('click', () => showPoster(activePosterIndex - 1));
nextButton?.addEventListener('click', () => showPoster(activePosterIndex + 1));
closeDialog?.addEventListener('click', () => dialog?.close());

dialog?.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

document.addEventListener('keydown', (event) => {
  if (!dialog?.open) return;
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    showPoster(activePosterIndex - 1);
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    showPoster(activePosterIndex + 1);
  } else if (event.key === 'Escape') {
    dialog.close();
  }
});

// Avoid ugly broken-image icons if an R2 object is temporarily missing.
document.querySelectorAll('.poster-card img, .reader-mobile-fallback img').forEach((img) => {
  img.addEventListener('error', () => {
    const card = img.closest('.poster-card');
    if (card) card.classList.add('asset-missing');
    img.style.visibility = 'hidden';
  });
});
