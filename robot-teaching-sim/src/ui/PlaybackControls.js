export class PlaybackControls {
  constructor(container, player) {
    this.container = container;
    this.player = player;
    this.progressBar = null;
    this.stateLabel = null;
    this.speedLabel = null;
    this._build();
  }

  _build() {
    const panel = document.createElement('div');
    panel.className = 'space-y-2 mt-3';

    // Divider
    const divider = document.createElement('div');
    divider.className = 'border-t border-gray-700 pt-2';

    const title = document.createElement('h3');
    title.className = 'text-sm font-bold text-cyan-400 uppercase tracking-wider mb-2';
    title.textContent = 'Playback';
    divider.appendChild(title);
    panel.appendChild(divider);

    // Progress bar
    const progressWrapper = document.createElement('div');
    progressWrapper.className = 'w-full h-1.5 bg-gray-700 rounded-full overflow-hidden';
    this.progressBar = document.createElement('div');
    this.progressBar.className = 'h-full bg-cyan-500 transition-all duration-300';
    this.progressBar.style.width = '0%';
    progressWrapper.appendChild(this.progressBar);
    panel.appendChild(progressWrapper);

    // State label
    this.stateLabel = document.createElement('div');
    this.stateLabel.className = 'text-[10px] text-gray-400 text-center';
    this.stateLabel.textContent = 'STOPPED';
    panel.appendChild(this.stateLabel);

    // Transport buttons
    const transport = document.createElement('div');
    transport.className = 'flex gap-1 justify-center';

    const btns = [
      { icon: '⏮', action: () => this.player.stepBackward(), title: 'Step Back' },
      { icon: '⏹', action: () => this.player.stop(), title: 'Stop' },
      { icon: '▶', action: () => this._togglePlay(), title: 'Play/Pause (Space)', cls: 'play-btn' },
      { icon: '⏭', action: () => this.player.stepForward(), title: 'Step Forward' },
    ];

    btns.forEach(b => {
      const btn = document.createElement('button');
      btn.className = `transport-btn ${b.cls || ''}`;
      btn.textContent = b.icon;
      btn.title = b.title;
      btn.addEventListener('click', b.action);
      transport.appendChild(btn);
    });

    panel.appendChild(transport);

    // Speed control
    const speedRow = document.createElement('div');
    speedRow.className = 'flex items-center gap-2';
    const speedLabel = document.createElement('span');
    speedLabel.className = 'text-[10px] text-gray-400';
    speedLabel.textContent = 'Speed:';
    this.speedLabel = document.createElement('span');
    this.speedLabel.className = 'text-[10px] text-cyan-300 font-mono w-8';
    this.speedLabel.textContent = '100%';

    const speedSlider = document.createElement('input');
    speedSlider.type = 'range';
    speedSlider.min = '10';
    speedSlider.max = '200';
    speedSlider.step = '10';
    speedSlider.value = '100';
    speedSlider.className = 'axis-slider flex-1';
    speedSlider.addEventListener('input', () => {
      const val = parseInt(speedSlider.value);
      this.player.speedMultiplier = val / 100;
      this.speedLabel.textContent = `${val}%`;
    });

    speedRow.appendChild(speedLabel);
    speedRow.appendChild(speedSlider);
    speedRow.appendChild(this.speedLabel);
    panel.appendChild(speedRow);

    // Loop toggle
    const loopRow = document.createElement('div');
    loopRow.className = 'flex items-center gap-2';
    const loopCb = document.createElement('input');
    loopCb.type = 'checkbox';
    loopCb.id = 'loop-toggle';
    loopCb.className = 'accent-cyan-500';
    loopCb.addEventListener('change', () => {
      this.player.loop = loopCb.checked;
    });
    const loopLabel = document.createElement('label');
    loopLabel.htmlFor = 'loop-toggle';
    loopLabel.className = 'text-[10px] text-gray-400';
    loopLabel.textContent = 'Loop mode';
    loopRow.appendChild(loopCb);
    loopRow.appendChild(loopLabel);
    panel.appendChild(loopRow);

    this.container.appendChild(panel);
  }

  _togglePlay() {
    if (this.player.state === 'playing') {
      this.player.pause();
    } else {
      this.player.play();
    }
  }

  updateState(info) {
    this.stateLabel.textContent = `${info.state.toUpperCase()} ${info.currentIndex >= 0 ? `(${info.currentIndex + 1}/${info.total})` : ''}`;
  }

  updateProgress(progress) {
    this.progressBar.style.width = `${(progress * 100).toFixed(0)}%`;
  }
}
