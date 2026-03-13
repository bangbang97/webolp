export class StatusBar {
  constructor(container) {
    this.container = container;
    this.tcpEl = null;
    this.jointsEl = null;
    this.fpsEl = null;
    this._frames = 0;
    this._lastFpsTime = performance.now();
    this._fps = 0;
    this._build();
  }

  _build() {
    const bar = document.createElement('div');
    bar.className = 'flex items-center justify-between gap-4 text-[10px] font-mono';

    this.tcpEl = document.createElement('span');
    this.tcpEl.className = 'text-cyan-300';
    this.tcpEl.textContent = 'TCP: --';

    this.jointsEl = document.createElement('span');
    this.jointsEl.className = 'text-gray-400 hidden sm:inline';
    this.jointsEl.textContent = 'Joints: --';

    this.fpsEl = document.createElement('span');
    this.fpsEl.className = 'text-green-400';
    this.fpsEl.textContent = 'FPS: --';

    bar.appendChild(this.tcpEl);
    bar.appendChild(this.jointsEl);
    bar.appendChild(this.fpsEl);

    this.container.appendChild(bar);
  }

  update(angles, tcpInfo) {
    if (tcpInfo) {
      const p = tcpInfo.position;
      this.tcpEl.textContent = `TCP: X${p.x.toFixed(3)} Y${p.y.toFixed(3)} Z${p.z.toFixed(3)}`;
    }
    if (angles) {
      this.jointsEl.textContent = `J: [${angles.map(a => a.toFixed(1)).join(', ')}]`;
    }

    // FPS counter
    this._frames++;
    const now = performance.now();
    if (now - this._lastFpsTime >= 1000) {
      this._fps = this._frames;
      this._frames = 0;
      this._lastFpsTime = now;
      this.fpsEl.textContent = `FPS: ${this._fps}`;
    }
  }
}
