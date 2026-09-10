/* Wahb counter reveal. No dependencies. */
(() => {
  'use strict';
  if (customElements.get('wahb-counter')) return;
  const PATHS = ["M544.11,352.37v216.21c0,90.57,40.18,128.95,94.16,128.95,59.98,0,98.36-39.58,98.36-128.95v-218.66c0-12.83,52.78-12.83,52.78,2.45v212.62c0,124.15-65.37,175.12-152.93,175.12-82.77,0-145.14-47.38-145.14-172.72v-219.89c0-10.42,52.78-10.42,52.78,4.87", "M856.54,634.57c0-49.19,29.39-83.97,77.37-104.36l-.6-1.79c-43.18-20.39-61.77-53.99-61.77-87.57,0-61.77,52.18-103.76,120.55-103.76,75.57,0,113.35,47.38,113.35,95.96,0,32.99-16.2,68.38-64.18,91.16v1.8c48.58,19.18,78.57,53.37,78.57,100.75,0,67.77-58.18,113.34-132.54,113.34-81.56,0-130.75-48.57-130.75-105.54M1066.45,632.17c0-47.38-32.99-70.17-85.76-85.17-45.58,13.2-70.17,43.18-70.17,80.36-1.8,39.59,28.19,74.37,77.96,74.37s77.97-29.38,77.97-69.56M921.31,437.25c0,38.98,29.39,59.97,74.37,71.97,33.59-11.4,59.37-35.38,59.37-70.77,0-31.18-18.59-63.57-65.97-63.57-43.78,0-67.77,28.79-67.77,62.37", "M1215.51,696.69c7.69-.31,16.39-1.14,26.64-2.16,30.59-4.2,59.37-16.8,81.56-37.78,25.79-23.39,44.38-57.57,51.58-103.76h-1.8c-21.6,26.39-52.78,41.98-91.76,41.98-70.17,0-115.15-52.78-115.15-119.34,0-73.77,53.38-138.54,133.14-138.54s128.95,64.77,128.95,164.33c0,85.76-28.79,145.73-67.17,182.91-30,29.39-71.38,47.38-113.35,52.18-10.98,1.71-21.16,2.65-30.23,3.01-6.79.28-8.21-42.61-2.41-42.84M1218.76,472.04c0,48.57,29.39,82.76,74.97,82.76,35.39,0,62.97-17.39,76.77-40.78,3-4.81,4.8-10.8,4.8-19.2,0-66.56-24.59-117.54-79.77-117.54-44.98,0-76.77,39.58-76.77,94.76", "M616.73,830.9c0-17.75,11.99-30.22,28.78-30.22s28.31,12.47,28.31,30.22-11.04,30.22-28.78,30.22c-16.79,0-28.31-12.94-28.31-30.22"];
  const NS = 'http://www.w3.org/2000/svg';
  let sequence = 0;
  class WahbCounter extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.frame = 0;
      this.failsafe = 0;
      this.dismissTimer = 0;
    }
    connectedCallback() {
      this.intro = this.hasAttribute('intro');
      this.storageKey = this.getAttribute('storage-key') || 'wahb-counter-intro-v1';
      this.setAttribute('role', 'img');
      this.setAttribute('aria-label', 'وهب');
      if (this.intro) this.setAttribute('aria-hidden', 'true');
      const id = 'wahb-' + (++sequence);
      const css = document.createElement('style');
      css.textContent = `
        :host { display:block; width:100%; color:var(--wahb-ink,#404041); }
        :host([hidden]) { display:none !important; }
        svg { display:block; width:100%; height:auto; overflow:visible; }
        :host([intro]) { position:fixed; inset:0; width:auto; z-index:var(--wahb-z,9999);
          display:grid; place-items:center; background:var(--wahb-background,#fff);
          pointer-events:none; transition:opacity .35s ease; }
        :host([intro]) svg { width:min(76vw,var(--wahb-size,520px)); }
        :host([intro][data-finished]) { opacity:0; }
        @media(prefers-reduced-motion:reduce) { :host([intro]) { transition:none; } }
      `;
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', '410 260 1100 680');
      svg.setAttribute('aria-hidden', 'true');
      this.shadowRoot.replaceChildren(css, svg);
      const make = (tag, attrs, parent = svg) => {
        const node = document.createElementNS(NS, tag);
        Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, String(v)));
        parent.appendChild(node);
        return node;
      };
      const defs = make('defs', {});
      const clip = make('clipPath', { id: id + '-window' }, defs);
      make('rect', { x: 450, y: 328, width: 1010, height: 420 }, clip);
      const reels = make('g', { 'clip-path': 'url(#' + id + '-window)', fill: 'currentColor' });
      const chars = ['0','B','3','W','6','H','2','7','A','5','U','4','8','1','9','V','6'];
      this.steps = [17, 15, 13];
      this.groups = this.steps.map((count, i) => {
        const group = make('g', {}, reels);
        for (let j = 0; j < count; j++) {
          const symbol = make('text', {
            x: [642, 988, 1300][i], y: 733 + j * 460,
            'text-anchor': 'middle', 'font-family': 'Arial, sans-serif',
            'font-size': 548, 'font-weight': 400
          }, group);
          symbol.textContent = chars[(j + i * 5) % chars.length];
        }
        make('path', { d: PATHS[i], transform: 'translate(0 ' + count * 460 + ')' }, group);
        return group;
      });
      this.dot = make('path', { d: PATHS[3], fill: 'var(--wahb-dot,#9eb555)' });
      this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.motionChanged = () => {
        if (this.reduced.matches) this.finish();
      };
      this.reduced.addEventListener('change', this.motionChanged);
      let seen = false;
      try { seen = sessionStorage.getItem(this.storageKey) === '1'; } catch (_) {}
      if (this.intro && this.hasAttribute('once') && seen) {
        this.hidden = true;
        return;
      }
      this.replay();
    }
    render(seconds) {
      const clamp = x => Math.max(0, Math.min(1, x));
      this.groups.forEach((group, i) => {
        const start = .1 + (2 - i) * .09;
        const duration = 2.15 + (2 - i) * .34;
        const progress = clamp((seconds - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        group.setAttribute('transform', 'translate(0 ' + (-this.steps[i] * 460 * eased) + ')');
        group.setAttribute('opacity', clamp(seconds / .18));
      });
      const p = clamp((seconds - 3.12) / .5);
      const scale = p === 1 ? 1 : Math.max(0, 1 + 2.70158 * (p - 1) ** 3 + 1.70158 * (p - 1) ** 2);
      this.dot.setAttribute('opacity', p > 0 ? '1' : '0');
      this.dot.setAttribute('transform', 'translate(645.2 830.9) scale(' + scale + ') translate(-645.2 -830.9)');
    }
    replay() {
      this.clearTimers();
      this.hidden = false;
      this.removeAttribute('data-finished');
      this.completed = false;
      if (this.reduced.matches) {
        this.finish();
        return;
      }
      this.render(0);
      const start = performance.now();
      const tick = now => {
        if (!this.isConnected || this.completed) return;
        const seconds = (now - start) / 1000;
        this.render(seconds);
        if (seconds >= 4.05) this.finish();
        else this.frame = requestAnimationFrame(tick);
      };
      this.frame = requestAnimationFrame(tick);
      // Dismiss even when animation frames are throttled in a background tab.
      this.failsafe = setTimeout(() => this.finish(), 5000);
    }
    finish() {
      if (this.completed) return;
      this.completed = true;
      this.clearTimers();
      this.render(4.05);
      if (this.intro) {
        if (this.hasAttribute('once')) {
          try { sessionStorage.setItem(this.storageKey, '1'); } catch (_) {}
        }
        if (this.reduced.matches) this.hidden = true;
        else {
          this.setAttribute('data-finished', '');
          this.dismissTimer = setTimeout(() => { this.hidden = true; }, 360);
        }
      }
      this.dispatchEvent(new CustomEvent('wahb-complete', { bubbles: true, composed: true }));
    }
    clearTimers() {
      cancelAnimationFrame(this.frame);
      clearTimeout(this.failsafe);
      clearTimeout(this.dismissTimer);
    }
    disconnectedCallback() {
      this.clearTimers();
      if (this.reduced && this.motionChanged) this.reduced.removeEventListener('change', this.motionChanged);
    }
  }
  customElements.define('wahb-counter', WahbCounter);
})();
