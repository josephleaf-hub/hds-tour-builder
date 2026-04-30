/**
 * HDS Tour Lightbox v1.3
 * ----------------------------------------------------------------
 * Full-bleed screenshot lightbox with floating tooltip anchored
 * to the highlighted area. No bottom caption strip, no thumbnails.
 *
 * Step shape:
 * {
 *   "image": "/screenshot.png",
 *   "title": "Track project health",
 *   "caption": "These KPI cards summarise...",
 *   "highlight": {              // OPTIONAL — omit for full-screen step
 *     "x": 0.32,                // 0..1 fraction from image left
 *     "y": 0.18,
 *     "w": 0.25,
 *     "h": 0.12
 *   }
 * }
 * ----------------------------------------------------------------
 */

(function (window, document) {
  'use strict';

  const TOOLTIP_W = 440;
  const TOOLTIP_GAP = 20;

  const HDSTour = {
    config: null,
    currentStep: 0,
    elements: {},
    isFullscreen: false,

    init: function (options) {
      options = options || {};

      const setup = (config) => {
        this.config = config;
        this.buildLightbox();
        this.bindFab();
      };

      if (options.config) {
        setup(options.config);
      } else if (options.configUrl) {
        fetch(options.configUrl)
          .then((r) => {
            if (!r.ok) throw new Error('Tour config fetch failed: ' + r.status);
            return r.json();
          })
          .then(setup)
          .catch((err) => console.error('[HDSTour]', err));
      } else {
        console.error('[HDSTour] init requires either `config` or `configUrl`.');
      }
    },

    bindFab: function () {
      const fab = document.getElementById('hds-tour-fab');
      if (!fab) return;
      if (!fab.innerHTML.trim()) {
        fab.classList.add('hds-tour-fab');
        fab.setAttribute('aria-label', 'Open tour');
        fab.innerHTML =
          '<span class="hds-tour-fab-label">Take a tour</span>' +
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" ' +
          'stroke="currentColor" stroke-width="2.2" stroke-linecap="round" ' +
          'stroke-linejoin="round">' +
          '<circle cx="12" cy="12" r="10"/>' +
          '<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>' +
          '<path d="M12 17h.01"/>' +
          '</svg>';
      }
      fab.addEventListener('click', () => this.open());
      setTimeout(() => fab.classList.add('no-pulse'), 8000);
    },

    buildLightbox: function () {
      if (document.getElementById('hds-tour-overlay')) return;

      const overlay = document.createElement('div');
      overlay.id = 'hds-tour-overlay';
      overlay.className = 'hds-tour-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');

      overlay.innerHTML = `
        <div class="hds-tour-backdrop"></div>
        <div class="hds-tour-modal" id="hds-tour-modal">
          <header class="hds-tour-header">
            <div class="hds-tour-header-left">
              <h2 class="hds-tour-title">${this.escape(this.config.title || 'Tour')}</h2>
              <span class="hds-tour-counter" id="hds-tour-counter">Step 1 of ${this.config.steps.length}</span>
            </div>
            <div class="hds-tour-header-right">
              <div class="hds-tour-nav-group">
                <button class="hds-tour-nav-btn" id="hds-tour-nav-back" aria-label="Previous step" title="Previous (←)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m15 18-6-6 6-6"/>
                  </svg>
                </button>
                <button class="hds-tour-nav-btn primary" id="hds-tour-nav-next" aria-label="Next step" title="Next (→)">
                  <svg class="icon-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                  <svg class="icon-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                </button>
              </div>
              <button class="hds-tour-icon-btn" id="hds-tour-fullscreen" aria-label="Toggle fullscreen" title="Fullscreen">
                <svg class="icon-expand" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
                  <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                  <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
                  <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                </svg>
                <svg class="icon-collapse" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:none;">
                  <path d="M9 3v2a2 2 0 0 1-2 2H5"/>
                  <path d="M15 3v2a2 2 0 0 0 2 2h2"/>
                  <path d="M19 15h-2a2 2 0 0 0-2 2v2"/>
                  <path d="M5 15h2a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
              <button class="hds-tour-icon-btn" id="hds-tour-close" aria-label="Close tour" title="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>
            <div class="hds-tour-header-progress">
              <div class="hds-tour-header-progress-bar" id="hds-tour-progress-bar"></div>
            </div>
          </header>

          <div class="hds-tour-stage" id="hds-tour-stage">
            <img class="hds-tour-image" id="hds-tour-image" alt="" draggable="false" />
            <div class="hds-tour-no-highlight-dim"></div>
            <div class="hds-tour-redactions" id="hds-tour-redactions"></div>
            <div class="hds-tour-highlight-ring" id="hds-tour-highlight-ring"></div>

            <div class="hds-tour-loader" aria-hidden="true">
              <div class="hds-tour-loader-spinner">
                <svg width="32" height="32" viewBox="0 0 50 50">
                  <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="80 50">
                    <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/>
                  </circle>
                </svg>
              </div>
              <div class="hds-tour-loader-label">Loading tour…</div>
            </div>

            <div class="hds-tour-tt" id="hds-tour-tt">
              <div class="hds-tour-tt-body">
                <div class="hds-tour-tt-meta" id="hds-tour-tt-meta">Step 1 of 1</div>
                <div class="hds-tour-tt-title" id="hds-tour-tt-title"></div>
                <div class="hds-tour-tt-desc" id="hds-tour-tt-desc"></div>
              </div>
              <div class="hds-tour-tt-actions">
                <button class="hds-tour-nav-btn" id="hds-tour-tt-back" aria-label="Back">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <button class="hds-tour-nav-btn primary" id="hds-tour-tt-next" aria-label="Next">
                  <svg class="icon-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  <svg class="icon-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      this.elements = {
        overlay:        overlay,
        modal:          overlay.querySelector('#hds-tour-modal'),
        backdrop:       overlay.querySelector('.hds-tour-backdrop'),
        closeBtn:       overlay.querySelector('#hds-tour-close'),
        fullscreenBtn:  overlay.querySelector('#hds-tour-fullscreen'),
        navBack:        overlay.querySelector('#hds-tour-nav-back'),
        navNext:        overlay.querySelector('#hds-tour-nav-next'),
        stage:          overlay.querySelector('#hds-tour-stage'),
        image:          overlay.querySelector('#hds-tour-image'),
        ring:           overlay.querySelector('#hds-tour-highlight-ring'),
        redactions:     overlay.querySelector('#hds-tour-redactions'),
        counter:        overlay.querySelector('#hds-tour-counter'),
        progressBar:    overlay.querySelector('#hds-tour-progress-bar'),
        tt:             overlay.querySelector('#hds-tour-tt'),
        ttMeta:         overlay.querySelector('#hds-tour-tt-meta'),
        ttTitle:        overlay.querySelector('#hds-tour-tt-title'),
        ttDesc:         overlay.querySelector('#hds-tour-tt-desc'),
        ttBack:         overlay.querySelector('#hds-tour-tt-back'),
        ttNext:         overlay.querySelector('#hds-tour-tt-next'),
      };

      this.bindEvents();
    },

    bindEvents: function () {
      this.elements.closeBtn.addEventListener('click', () => this.close());
      this.elements.backdrop.addEventListener('click', () => this.close());
      this.elements.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());

      // Nav buttons in header
      this.elements.navBack.addEventListener('click', () => this.prev());
      this.elements.navNext.addEventListener('click', () => this.next());
      // Nav buttons in tooltip
      this.elements.ttBack.addEventListener('click', () => this.prev());
      this.elements.ttNext.addEventListener('click', () => this.next());

      document.addEventListener('keydown', (e) => {
        if (!this.elements.overlay.classList.contains('active')) return;
        if (e.key === 'Escape') {
          if (this.isFullscreen) this.toggleFullscreen();
          else this.close();
        } else if (e.key === 'ArrowRight') this.next();
        else if (e.key === 'ArrowLeft') this.prev();
        else if (e.key === 'f' || e.key === 'F') this.toggleFullscreen();
      });

      window.addEventListener('resize', () => this.applyHighlight());
      this.elements.image.addEventListener('load', () => this.applyHighlight());
    },

    open: function () {
      this.currentStep = 0;
      this.elements.overlay.classList.add('active');
      document.body.classList.add('hds-tour-open');

      // Show loading state — gives the user a brief beat so the lightbox
      // doesn't feel like it pops in unexpectedly
      this.elements.overlay.classList.add('loading');

      const minDelay = 600;
      const startedAt = Date.now();

      const finishLoad = () => {
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, minDelay - elapsed);
        setTimeout(() => {
          this.elements.overlay.classList.remove('loading');
          this.render();
        }, remaining);
      };

      // Preload the first image so we don't pop with a half-loaded image
      const firstStep = this.config.steps[0];
      if (firstStep && firstStep.image) {
        const preload = new Image();
        preload.onload = finishLoad;
        preload.onerror = finishLoad;
        preload.src = firstStep.image;
      } else {
        finishLoad();
      }
    },

    close: function () {
      this.elements.overlay.classList.remove('active');
      document.body.classList.remove('hds-tour-open');
      if (this.isFullscreen) {
        this.elements.modal.classList.remove('fullscreen');
        this.isFullscreen = false;
        this.updateFullscreenIcon();
      }
    },

    toggleFullscreen: function () {
      this.isFullscreen = !this.isFullscreen;
      this.elements.modal.classList.toggle('fullscreen', this.isFullscreen);
      this.updateFullscreenIcon();
      setTimeout(() => this.applyHighlight(), 320);
    },

    updateFullscreenIcon: function () {
      const expand = this.elements.fullscreenBtn.querySelector('.icon-expand');
      const collapse = this.elements.fullscreenBtn.querySelector('.icon-collapse');
      if (this.isFullscreen) {
        expand.style.display = 'none';
        collapse.style.display = 'block';
      } else {
        expand.style.display = 'block';
        collapse.style.display = 'none';
      }
    },

    next: function () {
      if (this.currentStep < this.config.steps.length - 1) {
        this.currentStep++;
        this.render();
      } else {
        this.close();
      }
    },

    prev: function () {
      if (this.currentStep > 0) {
        this.currentStep--;
        this.render();
      }
    },

    render: function () {
      const step = this.config.steps[this.currentStep];
      const total = this.config.steps.length;

      // Cross-fade image and tooltip together
      this.elements.image.classList.add('fading');
      this.elements.tt.classList.add('fading');
      setTimeout(() => {
        this.elements.image.src = step.image;
        this.elements.image.alt = step.title || ('Tour step ' + (this.currentStep + 1));
        this.elements.image.classList.remove('fading');
        // tt fades back in after we've positioned it (in applyHighlight)
      }, 150);

      // Tooltip text
      this.elements.ttMeta.textContent = 'Step ' + (this.currentStep + 1) + ' of ' + total;
      this.elements.ttTitle.textContent = step.title || '';
      this.elements.ttDesc.textContent = step.caption || '';
      this.elements.counter.textContent = 'Step ' + (this.currentStep + 1) + ' of ' + total;

      // Progress bar
      const pct = ((this.currentStep + 1) / total) * 100;
      this.elements.progressBar.style.width = pct + '%';

      // Buttons — sync state across both header nav and tooltip nav
      this.elements.navBack.disabled = this.currentStep === 0;
      this.elements.ttBack.disabled  = this.currentStep === 0;

      const isLast = this.currentStep === total - 1;
      this.elements.navNext.classList.toggle('is-final', isLast);
      this.elements.ttNext.classList.toggle('is-final', isLast);

      // Apply highlight + position tooltip
      this.applyHighlight();
    },

    /**
     * Computes:
     *  - Where the image is rendered (object-fit: contain box)
     *  - The highlight rect in stage coords
     *  - Spotlight ring position (spotlight mode) OR image transform (close-up)
     *  - Best tooltip position based on highlight location
     */
    applyHighlight: function () {
      const step = this.config.steps[this.currentStep];
      if (!step) return;

      const stage = this.elements.stage;
      const image = this.elements.image;
      const ring  = this.elements.ring;
      const tt    = this.elements.tt;

      // Reset
      stage.classList.remove('no-highlight');
      image.style.transform = '';
      image.style.transformOrigin = '';
      ring.style.display = 'none';

      if (!image.naturalWidth || !image.naturalHeight) {
        // Image not loaded yet — try again on load
        return;
      }

      const stageRect = stage.getBoundingClientRect();

      // Compute the actual rendered image rect within the stage (object-fit: contain)
      // This is the BASE rect, before any per-step viewport is applied.
      const stageW = stageRect.width;
      const stageH = stageRect.height;
      const imgRatio = image.naturalWidth / image.naturalHeight;
      const stageRatio = stageW / stageH;
      let baseImgW, baseImgH, baseImgX, baseImgY;
      if (imgRatio > stageRatio) {
        baseImgW = stageW;
        baseImgH = stageW / imgRatio;
        baseImgX = 0;
        baseImgY = (stageH - baseImgH) / 2;
      } else {
        baseImgH = stageH;
        baseImgW = stageH * imgRatio;
        baseImgX = (stageW - baseImgW) / 2;
        baseImgY = 0;
      }

      // Apply per-step viewport (zoom + pan).
      // viewport is { zoom, panX, panY } where zoom is a scale factor
      // and panX/panY are fractions of the rendered image size.
      const vp = step.viewport || { zoom: 1, panX: 0, panY: 0 };
      const z = vp.zoom;
      const imgW = baseImgW * z;
      const imgH = baseImgH * z;
      const imgX = baseImgX - (imgW - baseImgW) / 2 + vp.panX * imgW;
      const imgY = baseImgY - (imgH - baseImgH) / 2 + vp.panY * imgH;

      // Apply CSS transform on image to match the viewport rect
      if (z !== 1 || vp.panX !== 0 || vp.panY !== 0) {
        const tx = (imgX + imgW / 2) - (baseImgX + baseImgW / 2);
        const ty = (imgY + imgH / 2) - (baseImgY + baseImgH / 2);
        image.style.transformOrigin = '50% 50%';
        image.style.transform = 'translate(' + tx + 'px, ' + ty + 'px) scale(' + z + ')';
      }

      // Render redactions (always, regardless of highlight)
      this.renderRedactions(step, imgX, imgY, imgW, imgH);

      if (!step.highlight) {
        // No highlight — show full image with subtle dim, centre tooltip
        stage.classList.add('no-highlight');
        this.positionTooltipCentered(stageW, stageH);
        tt.classList.remove('fading');
        return;
      }

      const h = step.highlight;
      const hX = imgX + h.x * imgW;
      const hY = imgY + h.y * imgH;
      const hW = h.w * imgW;
      const hH = h.h * imgH;

      ring.style.display = 'block';
      ring.style.left   = (hX - 2) + 'px';
      ring.style.top    = (hY - 2) + 'px';
      ring.style.width  = (hW + 4) + 'px';
      ring.style.height = (hH + 4) + 'px';

      this.positionTooltipNearHighlight(hX, hY, hW, hH, stageW, stageH);

      tt.classList.remove('fading');
    },

    /**
     * Position the tooltip near the highlight using a scoring approach.
     * We evaluate all four sides (below, above, right, left), score each
     * by how much breathing room it has, and pick the best fit. This
     * handles edge cases like tall highlights where 'below' is impossible
     * but 'right' is wide open.
     */
    positionTooltipNearHighlight: function (hX, hY, hW, hH, stageW, stageH) {
      const tt = this.elements.tt;
      const ttW = TOOLTIP_W;
      const ttH = tt.offsetHeight || 100;
      const margin = 16;
      const gap = TOOLTIP_GAP;

      const spaceBelow = stageH - (hY + hH);
      const spaceAbove = hY;
      const spaceRight = stageW - (hX + hW);
      const spaceLeft  = hX;

      const hCenterX = hX + hW / 2;
      const hCenterY = hY + hH / 2;

      // Compute screen-space redaction rects (for overlap avoidance)
      const step = this.config.steps[this.currentStep];
      const redactionRects = this.computeRedactionRects(step);

      // Each candidate's score = remaining room beyond what's needed.
      // Positive = fits with room to spare; negative = overflow amount.
      // Subtract a heavy penalty if the candidate overlaps a redaction.
      const candidates = [
        { name: 'below', top:  hY + hH + gap, left: hCenterX - ttW / 2, baseScore: spaceBelow - (ttH + gap + margin) },
        { name: 'above', top:  hY - gap - ttH, left: hCenterX - ttW / 2, baseScore: spaceAbove - (ttH + gap + margin) },
        { name: 'right', top:  hCenterY - ttH / 2, left: hX + hW + gap, baseScore: spaceRight - (ttW + gap + margin) },
        { name: 'left',  top:  hCenterY - ttH / 2, left: hX - gap - ttW, baseScore: spaceLeft - (ttW + gap + margin) }
      ];

      candidates.forEach(c => {
        // Clamp to stage bounds for accurate overlap check
        const cLeft = Math.max(margin, Math.min(c.left, stageW - ttW - margin));
        const cTop  = Math.max(margin, Math.min(c.top,  stageH - ttH - margin));
        const ttRect = { x: cLeft, y: cTop, w: ttW, h: ttH };
        const overlapPenalty = redactionRects.reduce((sum, r) => sum + this.rectOverlapArea(ttRect, r), 0);
        // Penalise overlap heavily — want to push tooltip elsewhere if possible
        c.score = c.baseScore - overlapPenalty * 0.05;
      });

      // Highest score = best fit. If none fit, the highest (least bad) wins.
      candidates.sort((a, b) => b.score - a.score);
      const chosen = candidates[0];

      let top  = chosen.top;
      let left = chosen.left;

      // Clamp to stage bounds
      left = Math.max(margin, Math.min(left, stageW - ttW - margin));
      top  = Math.max(margin, Math.min(top, stageH - ttH - margin));

      tt.style.left = left + 'px';
      tt.style.top  = top + 'px';
    },

    /**
     * Convert step.redactions (fractional) → array of pixel rects in stage coords.
     * Reuses the same image-fit logic as applyHighlight.
     */
    computeRedactionRects: function (step) {
      if (!step || !step.redactions || step.redactions.length === 0) return [];
      const image = this.elements.image;
      const stage = this.elements.stage;
      if (!image.naturalWidth || !stage) return [];

      const stageRect = stage.getBoundingClientRect();
      const stageW = stageRect.width, stageH = stageRect.height;
      const imgRatio = image.naturalWidth / image.naturalHeight;
      const stageRatio = stageW / stageH;
      let baseImgW, baseImgH, baseImgX, baseImgY;
      if (imgRatio > stageRatio) {
        baseImgW = stageW; baseImgH = stageW / imgRatio; baseImgX = 0; baseImgY = (stageH - baseImgH) / 2;
      } else {
        baseImgH = stageH; baseImgW = stageH * imgRatio; baseImgX = (stageW - baseImgW) / 2; baseImgY = 0;
      }
      // Apply per-step viewport
      const vp = step.viewport || { zoom: 1, panX: 0, panY: 0 };
      const z = vp.zoom;
      const imgW = baseImgW * z;
      const imgH = baseImgH * z;
      const imgX = baseImgX - (imgW - baseImgW) / 2 + vp.panX * imgW;
      const imgY = baseImgY - (imgH - baseImgH) / 2 + vp.panY * imgH;

      return step.redactions.map(r => ({
        x: imgX + r.x * imgW,
        y: imgY + r.y * imgH,
        w: r.w * imgW,
        h: r.h * imgH
      }));
    },

    /**
     * Area of overlap between two rects (0 if no overlap).
     * Used to score tooltip candidate positions against redactions.
     */
    rectOverlapArea: function (a, b) {
      const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
      const y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
      return x * y;
    },

    positionTooltipCentered: function (stageW, stageH) {
      const tt = this.elements.tt;
      const ttW = TOOLTIP_W;
      const ttH = tt.offsetHeight || 100;
      tt.style.left = (stageW / 2 - ttW / 2) + 'px';
      tt.style.top  = (stageH / 2 - ttH / 2) + 'px';
    },

    /**
     * Render redaction overlays on top of the image to hide sensitive info.
     * Each redaction is { x, y, w, h, style } in fractional image coords.
     * style: 'blur' | 'black'
     */
    renderRedactions: function (step, imgX, imgY, imgW, imgH) {
      const container = this.elements.redactions;
      if (!container) return;
      container.innerHTML = '';
      if (!step.redactions || !step.redactions.length) return;
      if (imgW === 0 || imgH === 0) return;

      step.redactions.forEach(function (r) {
        const div = document.createElement('div');
        div.className = 'hds-tour-redaction style-' + (r.style === 'black' ? 'black' : 'blur');
        div.style.left   = (imgX + r.x * imgW) + 'px';
        div.style.top    = (imgY + r.y * imgH) + 'px';
        div.style.width  = (r.w * imgW) + 'px';
        div.style.height = (r.h * imgH) + 'px';
        container.appendChild(div);
      });
    },

    escape: function (str) {
      const div = document.createElement('div');
      div.textContent = String(str || '');
      return div.innerHTML;
    },
  };

  window.HDSTour = HDSTour;
})(window, document);
