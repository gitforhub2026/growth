// Start new visits at the top. Keep the browser's back/forward position when returning to the page.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
const navigationEntry = performance.getEntriesByType?.('navigation')?.[0];
if (!location.hash && navigationEntry?.type !== 'back_forward') {
  requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
}

// Persistent header: brand on the left, supporter on the right.
const topbar = document.querySelector('.topbar');
if (topbar && !topbar.querySelector('.support-credit')) {
  const support = document.createElement('div');
  support.className = 'support-credit';
  support.innerHTML = '<span>公益支持</span><strong>吳尊賢文教公益基金會</strong>';
  topbar.appendChild(support);
}

// Refine the page copy and keep important lines intentionally balanced.
const heroTitle = document.querySelector('.hero h1');
if (heroTitle) heroTitle.innerHTML = '<span>陪孩子看懂自己，</span><span>也找到下一步。</span>';

const heroLead = document.querySelector('.hero .lead');
if (heroLead) heroLead.textContent = '孩子的情緒、學習、人際與選擇，常常不是一句「想開一點」就能解決。這裡把難說清楚的事，整理成可以一起聽、一起看、一起聊的生活工具。';

const heroMeta = document.querySelectorAll('.hero-meta span');
const heroMetaCopy = [
  '<b>4</b> 大入口',
  '<b>12</b> 集聲音',
  '<b>23</b> 張海報',
  '<b>54</b> 頁手冊'
];
heroMeta.forEach((item, index) => { if (heroMetaCopy[index]) item.innerHTML = heroMetaCopy[index]; });

const boardLabel = document.querySelector('.board-label');
if (boardLabel) boardLabel.textContent = '四個入口，回應孩子不同時刻';
const boardTitle = document.querySelector('.board-title');
if (boardTitle) boardTitle.textContent = '先穩定、再啟動、想清楚，也練習好好相處。讓工具跟著孩子的需要出現。';

const libraryTitle = document.querySelector('#library-title');
if (libraryTitle) libraryTitle.textContent = '陪孩子談那些不容易說清楚的事';
const libraryHead = libraryTitle?.closest('.section-head')?.querySelector('p');
if (libraryHead) libraryHead.textContent = '12 個聲音主題，從情緒、學習、選擇到關係，把難開口的事變成可以一起理解、一起討論的話題。';
const audioEyebrow = libraryTitle?.closest('.section-head')?.querySelector('.eyebrow');
if (audioEyebrow) audioEyebrow.textContent = 'AUDIO TOOLKIT · 12 EPISODES';

const teacherNote = document.querySelector('.teacher-note');
if (teacherNote) {
  const title = teacherNote.querySelector('h2');
  const copy = teacherNote.querySelector('p');
  if (title) title.textContent = '把工具放在手邊，需要時就有一個起點';
  if (copy) copy.textContent = '有時候，一段陪伴不需要很長。也許是一張海報、一個問題，或一起聽完一集後的幾分鐘談話。只要孩子願意多說一點、老師多看懂一點，改變就已經開始。';
}

// Keep the embedded PDF available on mobile, with a simple fallback link below it.
const mobileFallback = document.querySelector('.reader-mobile-fallback');
if (mobileFallback) {
  mobileFallback.innerHTML = '<span>若手機瀏覽器無法操作內嵌閱讀器，可另開完整教師手冊 ↗</span>';
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
document.querySelectorAll('.poster-card img').forEach((img) => {
  img.addEventListener('error', () => {
    const card = img.closest('.poster-card');
    if (card) card.classList.add('asset-missing');
    img.style.visibility = 'hidden';
  });
});
