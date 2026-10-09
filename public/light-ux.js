// Keep Light House playback usable while the listener reads deep into an episode.
(() => {
  const audio = document.querySelector('#audio');
  const playerBar = document.querySelector('.player');
  const episodeList = document.querySelector('#episodeList');
  const title = document.querySelector('#dTitle');
  const playButton = document.querySelector('#playBtn');
  const coverButton = document.querySelector('#coverBtn');
  const feedbackForm = document.querySelector('#light-feedback-form');
  const mobilePicker = document.querySelector('#mobilePicker');
  const bottomPicker = document.querySelector('#mobileBottomPicker');
  if (!audio || !playerBar || !episodeList || !title) return;

  const mobileQuery = window.matchMedia('(max-width: 680px)');
  let userActivatedAudio = false;
  let inlinePlayerVisible = true;
  let formFocused = false;
  let playbackStatus = '';

  const mini = document.createElement('aside');
  mini.className = 'light-now-player';
  mini.setAttribute('aria-label', '目前播放');
  mini.innerHTML = `
    <button class="light-now-toggle" type="button" aria-label="播放目前集數">▶</button>
    <div class="light-now-copy">
      <span class="light-now-kicker">NOW PLAYING</span>
      <strong class="light-now-title">尚未播放</strong>
      <span class="light-now-status" role="status" aria-live="polite"></span>
    </div>
    <span class="light-now-time">0:00 / --:--</span>
    <input class="light-now-seek" type="range" min="0" max="1000" value="0" aria-label="播放進度">
  `;
  document.body.appendChild(mini);

  const miniToggle = mini.querySelector('.light-now-toggle');
  const miniTitle = mini.querySelector('.light-now-title');
  const miniStatus = mini.querySelector('.light-now-status');
  const miniTime = mini.querySelector('.light-now-time');
  const miniSeek = mini.querySelector('.light-now-seek');

  function fmt(seconds) {
    if (!Number.isFinite(seconds)) return '--:--';
    const whole = Math.max(0, Math.floor(seconds));
    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
  }

  function currentIndex() {
    try { return typeof current !== 'undefined' ? current : 0; }
    catch { return 0; }
  }

  function currentTopicTitle() {
    try {
      const i = currentIndex();
      return typeof topics !== 'undefined' && topics[i]?.title ? topics[i].title : title.textContent.trim();
    } catch {
      return title.textContent.trim();
    }
  }

  function syncEpisodeRows() {
    const currentRow = currentIndex();
    const playing = !audio.paused && !audio.ended;
    episodeList.querySelectorAll('.ep-row').forEach((row, index) => {
      row.setAttribute('role', 'button');
      row.setAttribute('tabindex', '0');
      row.setAttribute('aria-current', index === currentRow ? 'true' : 'false');
      const rowTitle = row.querySelector('.ep-title')?.textContent.trim() || `第 ${index + 1} 集`;
      row.setAttribute('aria-label', `選擇：${rowTitle}`);
      if (!row.dataset.uxKeyboard) {
        row.dataset.uxKeyboard = '1';
        row.addEventListener('keydown', (event) => {
          if (event.target !== row || (event.key !== 'Enter' && event.key !== ' ')) return;
          event.preventDefault();
          if (typeof selectTopic === 'function') selectTopic(index, true);
        });
      }

      const button = row.querySelector('.playmini');
      if (!button) return;
      const isCurrent = index === currentRow;
      button.textContent = isCurrent && playing ? '❚❚' : '▶';
      button.setAttribute('aria-label', `${isCurrent && playing ? '暫停' : '播放'}：${rowTitle}`);
    });

    playButton?.setAttribute('aria-label', playing ? '暫停本集' : '播放本集');
    coverButton?.setAttribute('aria-label', playing ? '暫停本集' : '播放本集');
  }

  function syncMini() {
    const playing = !audio.paused && !audio.ended;
    miniToggle.textContent = playing ? '❚❚' : '▶';
    miniToggle.setAttribute('aria-label', playing ? '暫停目前集數' : '播放目前集數');
    miniTitle.textContent = currentTopicTitle() || '目前集數';
    miniStatus.textContent = playbackStatus;
    mini.classList.toggle('has-status', Boolean(playbackStatus));
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      miniSeek.value = String(Math.round((audio.currentTime / audio.duration) * 1000));
      miniTime.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
    } else {
      miniSeek.value = '0';
      miniTime.textContent = `${fmt(audio.currentTime)} / --:--`;
    }
    syncEpisodeRows();
  }

  function listIsOpen() {
    return episodeList.classList.contains('mobile-open');
  }

  function syncVisibility() {
    const visible = mobileQuery.matches && userActivatedAudio && !inlinePlayerVisible && !formFocused && !listIsOpen();
    mini.classList.toggle('is-visible', visible);
    document.body.classList.toggle('light-now-player-visible', visible);
  }

  new IntersectionObserver((entries) => {
    const entry = entries[0];
    inlinePlayerVisible = Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.18);
    syncVisibility();
  }, { threshold: [0, 0.18, 0.5] }).observe(playerBar);

  // The episode list is rebuilt whenever an episode or playback state changes.
  // Re-apply keyboard semantics and correct play/pause labels after each rebuild.
  new MutationObserver(() => {
    syncEpisodeRows();
    syncVisibility();
  }).observe(episodeList, { childList: true });

  miniToggle.addEventListener('click', () => {
    userActivatedAudio = true;
    if (audio.paused || audio.ended) {
      playbackStatus = '正在載入…';
      const promise = audio.play();
      syncMini();
      promise?.catch(() => {
        playbackStatus = '播放失敗，請再試一次';
        syncMini();
      });
    } else {
      playbackStatus = '';
      audio.pause();
      syncMini();
    }
    syncVisibility();
  });

  miniSeek.addEventListener('input', () => {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    audio.currentTime = (Number(miniSeek.value) / 1000) * audio.duration;
    syncMini();
  });

  if (feedbackForm) {
    feedbackForm.addEventListener('focusin', () => {
      formFocused = true;
      syncVisibility();
    });
    feedbackForm.addEventListener('focusout', () => {
      requestAnimationFrame(() => {
        formFocused = feedbackForm.contains(document.activeElement);
        syncVisibility();
      });
    });
  }

  [mobilePicker, bottomPicker].filter(Boolean).forEach((button) => {
    button.addEventListener('click', () => requestAnimationFrame(syncVisibility));
  });

  audio.addEventListener('loadstart', () => {
    if (!userActivatedAudio) return;
    playbackStatus = '正在載入…';
    syncMini();
  });
  audio.addEventListener('waiting', () => {
    if (!userActivatedAudio) return;
    playbackStatus = '網路較慢，正在緩衝…';
    syncMini();
  });
  audio.addEventListener('playing', () => {
    userActivatedAudio = true;
    playbackStatus = '';
    syncMini();
    syncVisibility();
  });
  audio.addEventListener('pause', () => {
    if (!audio.ended) playbackStatus = '';
    syncMini();
  });
  audio.addEventListener('ended', () => {
    playbackStatus = '本集播放完畢';
    syncMini();
  });
  audio.addEventListener('error', () => {
    if (!userActivatedAudio) return;
    playbackStatus = '播放失敗，請再試一次';
    syncMini();
  });
  audio.addEventListener('canplay', () => {
    if (!audio.paused) playbackStatus = '';
    syncMini();
  });
  audio.addEventListener('timeupdate', syncMini);
  audio.addEventListener('loadedmetadata', syncMini);
  mobileQuery.addEventListener?.('change', syncVisibility);

  // A direct click on the inline/list controls is user intent even before the
  // audio element fires play, so remember it for later sticky-control behavior.
  document.addEventListener('click', (event) => {
    if (event.target.closest?.('#playBtn,#coverBtn,.playmini')) userActivatedAudio = true;
  }, true);

  syncEpisodeRows();
  syncMini();
  syncVisibility();
})();
