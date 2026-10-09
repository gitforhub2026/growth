// Mobile reading UX: keep playback controls with the reader instead of pulling
// the viewport back to the full player at the top of the page.
(() => {
  const episodeGrid = document.querySelector('#episode-grid');
  const player = document.querySelector('#audio-player');
  const mainPanel = document.querySelector('#player-panel');
  const playerTitle = document.querySelector('#player-title');
  const feedbackForm = document.querySelector('#feedback-form');
  if (!episodeGrid || !player || !mainPanel || typeof selectEpisode !== 'function') return;

  let userActivatedAudio = false;
  let mainPlayerVisible = true;
  let formFocused = false;
  let playbackStatus = '';
  const mobileQuery = window.matchMedia('(max-width: 760px)');

  const mini = document.createElement('aside');
  mini.className = 'mobile-now-player';
  mini.setAttribute('aria-label', '目前播放');
  mini.innerHTML = `
    <button class="mobile-now-toggle" type="button" aria-label="播放目前集數">▶</button>
    <div class="mobile-now-copy">
      <span class="mobile-now-kicker">NOW PLAYING</span>
      <strong class="mobile-now-title">尚未播放</strong>
      <span class="mobile-now-status" role="status" aria-live="polite"></span>
    </div>
    <span class="mobile-now-time">0:00 / --:--</span>
    <input class="mobile-now-seek" type="range" min="0" max="1000" value="0" aria-label="播放進度">
  `;
  document.body.appendChild(mini);

  const miniToggle = mini.querySelector('.mobile-now-toggle');
  const miniTitle = mini.querySelector('.mobile-now-title');
  const miniTime = mini.querySelector('.mobile-now-time');
  const miniSeek = mini.querySelector('.mobile-now-seek');
  const miniStatus = mini.querySelector('.mobile-now-status');

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return '--:--';
    const whole = Math.max(0, Math.floor(seconds));
    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
  }

  function activeId() {
    try { return typeof activeEpisode !== 'undefined' ? activeEpisode : null; }
    catch { return null; }
  }

  function syncCardButtons() {
    const playing = !player.paused && !player.ended;
    const id = activeId();
    episodeGrid.querySelectorAll('.play-btn[data-play]').forEach((button) => {
      const isCurrent = button.dataset.play === id;
      if (isCurrent && playing) {
        button.innerHTML = '<span>❚❚</span> 暫停';
        button.setAttribute('aria-label', '暫停本集');
      } else if (isCurrent && player.currentTime > 0 && !player.ended) {
        button.innerHTML = '<span>▶</span> 繼續播放';
        button.setAttribute('aria-label', '繼續播放本集');
      } else {
        button.innerHTML = '<span>▶</span> 播放本集';
        button.setAttribute('aria-label', '播放本集');
      }
    });
  }

  function updateMiniContent() {
    const playing = !player.paused && !player.ended;
    miniToggle.textContent = playing ? '❚❚' : '▶';
    miniToggle.setAttribute('aria-label', playing ? '暫停目前集數' : '播放目前集數');
    miniTitle.textContent = (playerTitle?.textContent || '目前集數').trim();
    miniStatus.textContent = playbackStatus;
    mini.classList.toggle('has-status', Boolean(playbackStatus));

    if (Number.isFinite(player.duration) && player.duration > 0) {
      miniSeek.value = String(Math.round((player.currentTime / player.duration) * 1000));
      miniTime.textContent = `${formatTime(player.currentTime)} / ${formatTime(player.duration)}`;
    } else {
      miniSeek.value = '0';
      miniTime.textContent = `${formatTime(player.currentTime)} / --:--`;
    }
    syncCardButtons();
  }

  function updateMiniVisibility() {
    const visible = mobileQuery.matches && userActivatedAudio && !mainPlayerVisible && !formFocused;
    mini.classList.toggle('is-visible', visible);
    document.body.classList.toggle('mobile-now-player-visible', visible);
  }

  const observer = new IntersectionObserver((entries) => {
    const entry = entries[0];
    mainPlayerVisible = Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.18);
    updateMiniVisibility();
  }, { threshold: [0, 0.18, 0.5] });
  observer.observe(mainPanel);

  // renderEpisodes() rebuilds the cards after filters or episode changes. Resync
  // their play/pause labels immediately so the current track never looks idle.
  new MutationObserver(() => syncCardButtons()).observe(episodeGrid, { childList: true });

  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('#episode-grid .play-btn[data-play]');
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    userActivatedAudio = true;
    playbackStatus = '正在載入…';
    const readingPosition = window.scrollY;
    const sameEpisode = button.dataset.play === activeId();

    if (sameEpisode && !player.paused && !player.ended) {
      playbackStatus = '';
      player.pause();
    } else if (sameEpisode && player.currentSrc) {
      const promise = player.play();
      updateMiniContent();
      promise?.catch(() => {
        playbackStatus = '播放失敗，請再試一次';
        updateMiniContent();
      });
    } else {
      selectEpisode(button.dataset.play, true, false);
    }

    updateMiniContent();
    updateMiniVisibility();

    requestAnimationFrame(() => {
      window.scrollTo({ top: readingPosition, left: 0, behavior: 'auto' });
      updateMiniContent();
      updateMiniVisibility();
    });
  }, true);

  miniToggle.addEventListener('click', () => {
    userActivatedAudio = true;
    if (player.paused || player.ended) {
      playbackStatus = '正在載入…';
      const promise = player.play();
      updateMiniContent();
      promise?.catch(() => {
        playbackStatus = '播放失敗，請再試一次';
        updateMiniContent();
      });
    } else {
      playbackStatus = '';
      player.pause();
      updateMiniContent();
    }
    updateMiniVisibility();
  });

  miniSeek.addEventListener('input', () => {
    if (!Number.isFinite(player.duration) || player.duration <= 0) return;
    player.currentTime = (Number(miniSeek.value) / 1000) * player.duration;
    updateMiniContent();
  });

  if (feedbackForm) {
    feedbackForm.addEventListener('focusin', () => {
      formFocused = true;
      updateMiniVisibility();
    });
    feedbackForm.addEventListener('focusout', () => {
      requestAnimationFrame(() => {
        formFocused = feedbackForm.contains(document.activeElement);
        updateMiniVisibility();
      });
    });
  }

  player.addEventListener('loadstart', () => {
    if (!userActivatedAudio) return;
    playbackStatus = '正在載入…';
    updateMiniContent();
  });
  player.addEventListener('waiting', () => {
    if (!userActivatedAudio) return;
    playbackStatus = '網路較慢，正在緩衝…';
    updateMiniContent();
  });
  player.addEventListener('playing', () => {
    userActivatedAudio = true;
    playbackStatus = '';
    updateMiniContent();
    updateMiniVisibility();
  });
  player.addEventListener('canplay', () => {
    if (!player.paused) playbackStatus = '';
    updateMiniContent();
  });
  player.addEventListener('pause', () => {
    if (!player.ended) playbackStatus = '';
    updateMiniContent();
  });
  player.addEventListener('ended', () => {
    playbackStatus = '本集播放完畢';
    updateMiniContent();
  });
  player.addEventListener('error', () => {
    if (!userActivatedAudio) return;
    playbackStatus = '播放失敗，請再試一次';
    updateMiniContent();
  });
  player.addEventListener('timeupdate', updateMiniContent);
  player.addEventListener('loadedmetadata', updateMiniContent);
  player.addEventListener('durationchange', updateMiniContent);
  mobileQuery.addEventListener?.('change', updateMiniVisibility);

  updateMiniContent();
  updateMiniVisibility();
})();
