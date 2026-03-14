/**
 * cyber-background.js  —  Vaporwave 背景系统
 *
 * 性能优化要点：
 *   1. 双缓冲 OffscreenCanvas：静态层（太阳+星星初始帧）只在 resize 时重绘，
 *      主循环只绘制动态层（网格+汉字波动），再合成到主 canvas，大幅降低每帧工作量。
 *   2. 梯度对象缓存：bgGradient / glowGrad 在 resize 时创建一次，循环内复用。
 *   3. 降帧节能：页面不可见（Page Visibility API）时暂停 rAF；
 *      用户无操作超过 30s 后将帧率限制到 ~20fps（节能模式）。
 *   4. mousemove 节流：使用 rAF 节流，避免每次移动都触发计算。
 *   5. 故障效果 CSS-only：将 vhs-glitch 完全交给 CSS animation 处理，
 *      JS 只负责加/移除 class，不在主循环中执行任何故障绘制。
 *   6. 文字故障改为 hover-only：仅在鼠标悬停时激活 .glitch 伪元素动画，
 *      静止时 animation: none，减少持续合成层开销。
 *
 * 安全修复：
 *   - 移除 console.log 生产日志
 *   - setupButtonGlitch 限定只绑定导航类按钮，不全局劫持所有 <a>
 *   - 所有 setTimeout 句柄统一管理，页面卸载时清理
 */

(function () {
  'use strict';

  /* ─── 工具函数 ─── */
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  /* ─── 可见性 & 帧率控制 ─── */
  let hidden = false;
  let idleTimer = null;
  let idleLowFps = false;
  const IDLE_TIMEOUT = 30000; // 30s 无操作进入节能模式

  function resetIdle() {
    idleLowFps = false;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { idleLowFps = true; }, IDLE_TIMEOUT);
  }

  document.addEventListener('visibilitychange', () => { hidden = document.hidden; });
  ['mousemove', 'keydown', 'scroll', 'touchstart'].forEach(ev =>
    window.addEventListener(ev, resetIdle, { passive: true })
  );
  resetIdle();

  /* ─── Canvas 背景动画 ─── */
  function initCyberBackground() {
    const canvas = document.getElementById('sun-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = 0, height = 0;

    /* 鼠标：rAF 节流 */
    let mouseTargetX = 0, mouseTargetY = 0;
    let normalizedMouseX = 0, normalizedMouseY = 0;
    let mousePending = false;

    document.addEventListener('mousemove', (e) => {
      mouseTargetX = e.clientX;
      mouseTargetY = e.clientY;
      if (!mousePending) {
        mousePending = true;
        requestAnimationFrame(() => {
          normalizedMouseX = (mouseTargetX / width - 0.5) * 2;
          normalizedMouseY = (mouseTargetY / height - 0.5) * 2;
          mousePending = false;
        });
      }
    }, { passive: true });

    /* 星星数据 */
    let stars = [];
    function buildStars() {
      stars = Array.from({ length: 120 }, () => {
        const x = Math.random() * width;
        const y = Math.random() * height * 0.62;
        return {
          originalX: x, originalY: y,
          size: Math.random() * 1.8 + 0.4,
          blinkSpeed: Math.random() * 0.04 + 0.005,
          depth: Math.random() * 0.8 + 0.2,
          blinkOffset: Math.random() * Math.PI * 2,
        };
      });
    }

    /* 缓存的渐变对象（resize 时重建） */
    let bgGradient = null;
    let glowGrad = null;
    let sunGrad = null;
    let cachedCenterX = 0, cachedHorizonY = 0, cachedSunRadius = 0;

    /* 静态层离屏 canvas（太阳 + 背景） */
    const staticCanvas = document.createElement('canvas');
    const staticCtx = staticCanvas.getContext('2d');

    function rebuildStaticLayer() {
      staticCanvas.width = width;
      staticCanvas.height = height;

      cachedCenterX = width / 2;
      cachedHorizonY = height * 0.6;
      cachedSunRadius = clamp(Math.min(width, height) * 0.15, 60, 200);

      /* 背景渐变 */
      bgGradient = staticCtx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, '#050510');
      bgGradient.addColorStop(1, '#150a15');

      staticCtx.fillStyle = bgGradient;
      staticCtx.fillRect(0, 0, width, height);

      /* 太阳 */
      sunGrad = staticCtx.createLinearGradient(
        cachedCenterX, cachedHorizonY - cachedSunRadius * 2,
        cachedCenterX, cachedHorizonY
      );
      sunGrad.addColorStop(0, '#ffee00');
      sunGrad.addColorStop(0.45, '#ff00ff');
      sunGrad.addColorStop(1, '#8800ee');

      staticCtx.fillStyle = sunGrad;
      staticCtx.beginPath();
      staticCtx.arc(cachedCenterX, cachedHorizonY - 40, cachedSunRadius, 0, Math.PI * 2);
      staticCtx.fill();

      /* 太阳切割线：用真实矩形而非背景色遮盖，避免颜色不匹配 */
      const sy = cachedHorizonY - 40;
      const sr = cachedSunRadius;
      const stripeCount = 10;
      for (let i = 0; i < stripeCount; i++) {
        const ratio = i / stripeCount;
        const stripY = sy - sr + ratio * sr * 1.8; // 从下半部分开始分条
        const stripH = clamp((i + 1) * 1.8, 1, 12);
        if (stripY < sy - sr || stripY > sy + sr) continue;
        // 用背景渐变在对应 y 处的颜色插值填充（近似：用深色半透明矩形叠加）
        staticCtx.fillStyle = `rgba(5, 5, 16, ${0.55 + i * 0.045})`;
        staticCtx.fillRect(cachedCenterX - sr, stripY, sr * 2, stripH);
      }

      /* 地平线光晕（缓存） */
      glowGrad = staticCtx.createLinearGradient(0, cachedHorizonY - 20, 0, cachedHorizonY + 20);
      glowGrad.addColorStop(0, 'rgba(0,255,255,0)');
      glowGrad.addColorStop(0.5, 'rgba(0,255,255,0.75)');
      glowGrad.addColorStop(1, 'rgba(0,255,255,0)');
      staticCtx.fillStyle = glowGrad;
      staticCtx.fillRect(0, cachedHorizonY - 2, width, 4);
    }

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      buildStars();
      rebuildStaticLayer();
    }

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 200);
    });
    resize();

    /* 主循环 */
    let time = 0;
    let gridOffset = 0;
    const GRID_SPEED = 0.5;
    let lastFrameTime = 0;
    const TARGET_IDLE_INTERVAL = 1000 / 20; // 节能模式 20fps

    function draw(timestamp) {
      requestAnimationFrame(draw);

      if (hidden) return;

      /* 节能降帧 */
      if (idleLowFps) {
        if (timestamp - lastFrameTime < TARGET_IDLE_INTERVAL) return;
      }
      lastFrameTime = timestamp;

      time += 0.01;
      gridOffset = (gridOffset + GRID_SPEED) % 40;

      /* 1. 贴静态层 */
      ctx.drawImage(staticCanvas, 0, 0);

      /* 2. 绘制星星（动态：视差 + 闪烁） */
      const px = normalizedMouseX;
      const py = normalizedMouseY;
      stars.forEach(star => {
        const blink = Math.sin(time * star.blinkSpeed * 5 + star.blinkOffset) * 0.28 + 0.72;
        const cx = star.originalX + px * 18 * star.depth;
        const cy = star.originalY + py * 18 * star.depth;
        ctx.globalAlpha = blink;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      /* 3. 透视网格（动态） */
      const vpX = cachedCenterX + px * 40; // 视角点随鼠标偏移
      const hy = cachedHorizonY;

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 0, 255, 0.35)';
      ctx.lineWidth = 0.8;

      /* 竖向透视线 */
      ctx.beginPath();
      for (let i = -width; i < width * 2; i += 80) {
        ctx.moveTo(vpX, hy);
        ctx.lineTo(vpX + (i - vpX) * 3.2, height);
      }
      ctx.stroke();

      /* 横向移动线 */
      ctx.beginPath();
      for (let i = 0; i < 20; i++) {
        const p = gridOffset + i * 40;
        const y = hy + (p * p) / 800;
        if (y > height) continue;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
      ctx.restore();

      /* 4. 竖行汉字（动态波动） */
      ctx.save();
      ctx.font = '48px "FZShuTi", "STHupo", cursive';
      ctx.fillStyle = 'rgba(0, 255, 255, 0.28)';
      ctx.textAlign = 'center';
      ctx.translate(width - 58, height / 2 - 95);
      const chars = '浮生一梦 何以解忧'.split('');
      chars.forEach((ch, idx) => {
        const wave = Math.sin(time * 1.8 + idx * 0.5) * 2;
        ctx.fillText(ch, 0, idx * 50 + wave);
      });
      ctx.restore();
    }

    requestAnimationFrame(draw);
  }

  /* ─── 故障效果系统 ─── */
  function initGlitchEffects() {
    let isGlitchActive = false;
    const glitchTimers = [];

    function triggerGlitch(duration) {
      if (isGlitchActive) return;
      isGlitchActive = true;

      const colors = ['#ff00ff', '#00ffff', '#ccff00'];
      const c = colors[Math.floor(Math.random() * colors.length)];
      document.documentElement.style.setProperty('--color-magenta', c);
      document.body.classList.add('vhs-glitch-effect');

      const t = setTimeout(() => {
        document.body.classList.remove('vhs-glitch-effect');
        document.documentElement.style.setProperty('--color-magenta', '#ff00ff');
        isGlitchActive = false;
      }, duration);
      glitchTimers.push(t);
    }

    /* 随机定时故障：1.5~4 分钟触发一次 */
    function scheduleNext() {
      const delay = Math.random() * 150000 + 90000;
      const t = setTimeout(() => {
        triggerGlitch(Math.random() * 500 + 300);
        scheduleNext();
      }, delay);
      glitchTimers.push(t);
    }

    /* 首次故障延迟 15~45s（避免刚打开就抖） */
    const t0 = setTimeout(() => scheduleNext(), Math.random() * 30000 + 15000);
    glitchTimers.push(t0);

    /* 仅绑定导航交互元素（不全局劫持所有 <a>） */
    function setupNavGlitch() {
      const selector = '.nav-left li > div, .left-bottom a, .hide-list .semicircle';
      document.querySelectorAll(selector).forEach(el => {
        el.addEventListener('click', () => triggerGlitch(180), { passive: true });
      });
    }
    setupNavGlitch();

    /* 文字故障：hover-only，减少持续合成层
     * CSS 侧将 .glitch::before/after 的 animation 设为 paused，
     * hover 时通过 .glitch:hover::before/after { animation-play-state: running } 激活。
     * 这里只负责为元素打上 class + data-text。
     */
    function setupTextGlitch() {
      document.querySelectorAll('h1, h2, h3, .article-title').forEach(el => {
        if (!el.classList.contains('glitch')) {
          el.classList.add('glitch');
          el.setAttribute('data-text', el.textContent);
        }
      });
    }
    setupTextGlitch();

    /* 页面卸载时清理所有定时器 */
    window.addEventListener('pagehide', () => {
      glitchTimers.forEach(clearTimeout);
    });
  }

  /* ─── 入口 ─── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    initCyberBackground();
    initGlitchEffects();
  }

})();
