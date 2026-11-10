/**
 * 葉律言 畫作展示輯 (Gallery Showcase Engine)
 * 核心功能：
 * 1. 寫實動態舞台火焰背景
 * 2. 畫作展示框架與彈窗互動
 * 3. YouTube 背景音樂播放與禁音按鈕 (Video: FhgFtXESdPk)
 */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================================================
  // 1. 寫實動態舞台火焰背景引擎 (Realistic Stage Fire Engine)
  // ==========================================================================
  const canvas = document.getElementById('stageFireCanvas');
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initFireSources();
  });

  // 沿著舞台底部排列的自然火源點
  let fireSources = [];
  function initFireSources() {
    fireSources = [];
    const count = Math.max(8, Math.floor(width / 130));
    const step = width / count;
    for (let i = 0; i <= count; i++) {
      fireSources.push({
        x: step * i + (Math.random() * 40 - 20),
        y: height + 10,
        baseIntensity: Math.random() * 0.4 + 0.8,
        freq: Math.random() * 0.03 + 0.02,
        phase: Math.random() * Math.PI * 2
      });
    }
  }
  initFireSources();

  const flames = [];
  const embers = [];

  // 寫實火焰羽流粒子
  class RealisticFlameParticle {
    constructor(x, y, size, vy, life) {
      this.x = x;
      this.y = y;
      this.origX = x;
      this.size = size;
      this.initialSize = size;
      this.vy = vy;
      this.vx = (Math.random() - 0.5) * 1.2;
      this.life = life;
      this.maxLife = life;
      this.seed = Math.random() * 100;
    }

    update(time) {
      const turbulence = Math.sin(this.y * 0.015 + time * 3 + this.seed) * 1.4;
      this.x += this.vx + turbulence * 0.35;
      this.y += this.vy;
      this.life--;
      const progress = 1 - (this.life / this.maxLife);
      this.size = this.initialSize * (1 - progress * 0.7);
    }

    draw(ctx) {
      const progress = 1 - (this.life / this.maxLife);
      if (this.size <= 0) return;

      let r, g, b, alpha;
      if (progress < 0.25) {
        r = 255;
        g = Math.floor(240 - progress * 200);
        b = Math.floor(180 - progress * 600);
        alpha = 0.75;
      } else if (progress < 0.6) {
        r = 255;
        g = Math.floor(180 - (progress - 0.25) * 300);
        b = 10;
        alpha = 0.6 - (progress - 0.25) * 0.5;
      } else {
        r = Math.floor(200 - (progress - 0.6) * 350);
        g = Math.floor(40 - (progress - 0.6) * 100);
        b = 0;
        alpha = Math.max(0, 0.4 - (progress - 0.6) * 0.9);
      }

      ctx.save();
      const grad = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, Math.max(1, this.size)
      );
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
      grad.addColorStop(0.5, `rgba(${r}, ${Math.floor(g * 0.7)}, 0, ${alpha * 0.6})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(1, this.size), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 舞台餘燼火星
  class RealisticEmber {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * width;
      this.y = height + Math.random() * 20;
      this.vx = (Math.random() - 0.5) * 1.2;
      this.vy = -(Math.random() * 1.8 + 0.8);
      this.size = Math.random() * 2 + 0.8;
      this.alpha = Math.random() * 0.6 + 0.3;
      this.decay = Math.random() * 0.003 + 0.0015;
      this.flickerOffset = Math.random() * Math.PI * 2;
    }

    update(time) {
      this.x += this.vx + Math.sin(time * 2 + this.flickerOffset) * 0.4;
      this.y += this.vy;
      this.alpha -= this.decay;
      if (this.y < -10 || this.alpha <= 0) {
        this.reset();
      }
    }

    draw(ctx, time) {
      const flicker = (Math.sin(time * 5 + this.flickerOffset) + 1) * 0.15;
      const currentAlpha = Math.max(0, this.alpha + flicker);

      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 140, 20, ${currentAlpha})`;
      ctx.shadowBlur = 6;
      ctx.shadowColor = 'rgba(255, 90, 0, 0.8)';
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < 40; i++) {
    const emb = new RealisticEmber();
    emb.y = Math.random() * height;
    embers.push(emb);
  }

  function animate(timestamp) {
    const time = timestamp * 0.001;
    ctx.clearRect(0, 0, width, height);

    fireSources.forEach(src => {
      const wave = Math.sin(time * 2.5 + src.phase);
      const intensity = src.baseIntensity + wave * 0.3;
      const pCount = Math.floor(3 * intensity);
      for (let i = 0; i < pCount; i++) {
        const spreadX = (Math.random() - 0.5) * 55;
        const size = (Math.random() * 25 + 20) * intensity;
        const vy = -(Math.random() * 3.5 + 2.5) * intensity;
        const life = Math.floor(Math.random() * 35 + 30);
        flames.push(new RealisticFlameParticle(
          src.x + spreadX,
          src.y,
          size,
          vy,
          life
        ));
      }
    });

    ctx.globalCompositeOperation = 'screen';

    for (let i = flames.length - 1; i >= 0; i--) {
      const f = flames[i];
      f.update(time);
      f.draw(ctx);
      if (f.life <= 0) {
        flames.splice(i, 1);
      }
    }

    embers.forEach(ember => {
      ember.update(time);
      ember.draw(ctx, time);
    });

    const baseGlow = ctx.createLinearGradient(0, height - 120, 0, height);
    baseGlow.addColorStop(0, 'rgba(0, 0, 0, 0)');
    baseGlow.addColorStop(0.7, 'rgba(255, 60, 0, 0.12)');
    baseGlow.addColorStop(1, 'rgba(255, 120, 0, 0.28)');
    ctx.fillStyle = baseGlow;
    ctx.fillRect(0, height - 120, width, 120);

    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);


  // ==========================================================================
  // 2. 作品展示純淨框架資料 (Artwork Frame Templates)
  // ==========================================================================
  const artworksData = {
    1: {
      title: "作品 01",
      series: "系列一 (SERIES I)",
      medium: "未填寫媒材",
      year: "—",
      size: "—",
      image: "https://placehold.co/900x675/121217/555562?text=PAINTING+FRAME+01",
      note: "此處為作品說明展示框架。日後可於此填寫該幅畫作的創作概念、使用技法或展示備註。"
    },
    2: {
      title: "作品 02",
      series: "系列一 (SERIES I)",
      medium: "未填寫媒材",
      year: "—",
      size: "—",
      image: "https://placehold.co/900x675/121217/555562?text=PAINTING+FRAME+02",
      note: "此處為作品說明展示框架。日後可於此填寫該幅畫作的創作概念、使用技法或展示備註。"
    },
    3: {
      title: "作品 03",
      series: "系列二 (SERIES II)",
      medium: "未填寫媒材",
      year: "—",
      size: "—",
      image: "https://placehold.co/900x675/121217/555562?text=PAINTING+FRAME+03",
      note: "此處為作品說明展示框架。日後可於此填寫該幅畫作的創作概念、使用技法或展示備註。"
    },
    4: {
      title: "作品 04",
      series: "系列二 (SERIES II)",
      medium: "未填寫媒材",
      year: "—",
      size: "—",
      image: "https://placehold.co/900x675/121217/555562?text=PAINTING+FRAME+04",
      note: "此處為作品說明展示框架。日後可於此填寫該幅畫作的創作概念、使用技法或展示備註。"
    },
    5: {
      title: "作品 05",
      series: "系列三 (SERIES III)",
      medium: "未填寫媒材",
      year: "—",
      size: "—",
      image: "https://placehold.co/900x675/121217/555562?text=PAINTING+FRAME+05",
      note: "此處為作品說明展示框架。日後可於此填寫該幅畫作的創作概念、使用技法或展示備註。"
    },
    6: {
      title: "作品 06",
      series: "系列三 (SERIES III)",
      medium: "未填寫媒材",
      year: "—",
      size: "—",
      image: "https://placehold.co/900x675/121217/555562?text=PAINTING+FRAME+06",
      note: "此處為作品說明展示框架。日後可於此填寫該幅畫作的創作概念、使用技法或展示備註。"
    }
  };


  // ==========================================================================
  // 3. 畫作分類篩選
  // ==========================================================================
  const filterBtns = document.querySelectorAll('.filter-btn');
  const artCards = document.querySelectorAll('.art-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      artCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        if (filterValue === 'all' || cardCategory === filterValue) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 30);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(15px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 250);
        }
      });
    });
  });


  // ==========================================================================
  // 4. 畫作詳細資訊彈窗 Modal
  // ==========================================================================
  const modal = document.getElementById('artModal');
  const modalBody = document.getElementById('modalBody');
  const modalClose = document.getElementById('modalClose');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const viewArtBtns = document.querySelectorAll('.view-art-btn');

  function openArtModal(id) {
    const data = artworksData[id];
    if (!data) return;

    modalBody.innerHTML = `
      <img src="${data.image}" alt="${data.title}" class="modal-art-img">
      
      <span style="color: var(--fire-orange); font-size: 0.85rem; letter-spacing: 2px; font-family: var(--font-display);">${data.series}</span>
      <h2 class="modal-title">${data.title}</h2>
      
      <div class="modal-specs-box">
        <span><strong>媒材：</strong> ${data.medium}</span>
        <span><strong>年代：</strong> ${data.year}</span>
        <span><strong>尺寸：</strong> ${data.size}</span>
      </div>

      <p class="modal-desc">${data.note}</p>

      <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
        <button class="btn btn-outline" onclick="closeArtModal()">關閉視窗</button>
      </div>
    `;

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeArtModal() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  window.closeArtModal = closeArtModal;

  viewArtBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      openArtModal(id);
    });
  });

  if (modalClose) modalClose.addEventListener('click', closeArtModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeArtModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      closeArtModal();
    }
  });


  // ==========================================================================
  // 5. YouTube 背景音樂與音量大小控制 (YouTube Background BGM & Volume Control)
  // ==========================================================================
  const musicMuteBtn = document.getElementById('musicMuteBtn');
  const musicIcon = document.getElementById('musicIcon');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumeVal = document.getElementById('volumeVal');
  const soundWave = document.getElementById('soundWave');

  let ytPlayer = null;
  let isMuted = true;
  let isReady = false;
  let currentVolume = 70;
  let previousVolume = 70;

  // 動態載入 YouTube IFrame API
  const ytScriptTag = document.createElement('script');
  ytScriptTag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName('script')[0];
  if (firstScriptTag && firstScriptTag.parentNode) {
    firstScriptTag.parentNode.insertBefore(ytScriptTag, firstScriptTag);
  } else {
    document.head.appendChild(ytScriptTag);
  }

  window.onYouTubeIframeAPIReady = function() {
    ytPlayer = new YT.Player('youtubePlayer', {
      height: '1',
      width: '1',
      videoId: 'FhgFtXESdPk',
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        loop: 1,
        playlist: 'FhgFtXESdPk',
        modestbranding: 1,
        playsinline: 1
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange
      }
    });
  };

  function onPlayerReady(event) {
    isReady = true;
    try {
      // 預設靜音載入以符合現代瀏覽器政策
      event.target.mute();
      event.target.playVideo();
      event.target.setVolume(currentVolume);
    } catch (e) {
      console.warn('Autoplay initiated:', e);
    }
  }

  function onPlayerStateChange(event) {
    // 循環播放
    if (event.data === (window.YT ? YT.PlayerState.ENDED : 0) && ytPlayer) {
      ytPlayer.playVideo();
    }
  }

  function setAudioVolume(vol) {
    vol = Math.max(0, Math.min(100, parseInt(vol, 10)));
    currentVolume = vol;

    if (volumeSlider) volumeSlider.value = vol;
    if (volumeVal) volumeVal.textContent = vol + '%';

    if (!ytPlayer || !isReady) return;

    if (vol === 0) {
      ytPlayer.mute();
      isMuted = true;
      if (musicIcon) musicIcon.textContent = '🔇';
      if (soundWave) soundWave.classList.add('paused');
    } else {
      ytPlayer.unMute();
      ytPlayer.setVolume(vol);
      ytPlayer.playVideo();
      isMuted = false;
      if (musicIcon) musicIcon.textContent = vol > 50 ? '🔊' : '🔉';
      if (soundWave) soundWave.classList.remove('paused');
    }
  }

  function toggleMute() {
    if (!ytPlayer || !isReady) return;

    if (isMuted || currentVolume === 0) {
      // 解除靜音，恢復原先音量（預設 70）
      const restoreVol = previousVolume > 0 ? previousVolume : 70;
      setAudioVolume(restoreVol);
    } else {
      // 靜音：保存當前音量並將滑桿歸零
      previousVolume = currentVolume;
      setAudioVolume(0);
    }
  }

  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      setAudioVolume(e.target.value);
    });
  }

  if (musicMuteBtn) {
    musicMuteBtn.addEventListener('click', toggleMute);
  }

});
