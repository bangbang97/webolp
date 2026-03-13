export class Player {
  constructor(program, robotController) {
    this.program = program;
    this.controller = robotController;
    this.state = 'stopped'; // stopped, playing, paused
    this.currentIndex = -1;
    this.loop = false;
    this.speedMultiplier = 1.0;
    this._aborted = false;
    this.onStateChange = null;
    this.onProgress = null;
  }

  async play() {
    if (this.program.length === 0) return;
    if (this.state === 'paused') {
      this.state = 'playing';
      this._notify();
      await this._runFrom(this.currentIndex);
      return;
    }

    this.state = 'playing';
    this._aborted = false;
    this.currentIndex = 0;
    this._notify();
    await this._runFrom(0);
  }

  pause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this._aborted = true;
      this._notify();
    }
  }

  stop() {
    this.state = 'stopped';
    this._aborted = true;
    this.currentIndex = -1;
    this._notify();
  }

  async stepForward() {
    if (this.program.length === 0) return;
    const next = this.currentIndex + 1;
    if (next >= this.program.length) return;
    this.currentIndex = next;
    this.state = 'paused';
    this._notify();
    await this._moveToWaypoint(next);
  }

  async stepBackward() {
    if (this.program.length === 0) return;
    const prev = this.currentIndex - 1;
    if (prev < 0) return;
    this.currentIndex = prev;
    this.state = 'paused';
    this._notify();
    await this._moveToWaypoint(prev);
  }

  async goToWaypoint(index) {
    if (index < 0 || index >= this.program.length) return;
    this.currentIndex = index;
    this._notify();
    await this._moveToWaypoint(index);
  }

  async _runFrom(startIndex) {
    for (let i = startIndex; i < this.program.length; i++) {
      if (this._aborted) return;
      this.currentIndex = i;
      this._notify();
      await this._moveToWaypoint(i);

      // Dwell time
      const wp = this.program.getWaypoint(i);
      if (wp.dwellTime > 0 && !this._aborted) {
        await this._wait(wp.dwellTime);
      }
    }

    if (this._aborted) return;

    if (this.loop && this.state === 'playing') {
      this.currentIndex = 0;
      this._notify();
      await this._runFrom(0);
    } else {
      this.state = 'stopped';
      this.currentIndex = -1;
      this._notify();
    }
  }

  async _moveToWaypoint(index) {
    const wp = this.program.getWaypoint(index);
    if (!wp) return;

    // Calculate duration based on speed percentage and joint distance
    const currentAngles = this.controller.currentAngles;
    let maxDelta = 0;
    for (let i = 0; i < 6; i++) {
      maxDelta = Math.max(maxDelta, Math.abs(wp.joints[i] - currentAngles[i]));
    }
    // Base: 180° takes 1.5 seconds at 100% speed
    const baseDuration = (maxDelta / 180) * 1500;
    const duration = Math.max(baseDuration * (100 / wp.speed), 200);

    if (wp.moveType === 'LIN') {
      await this.controller.animateLinear(wp.joints, duration, this.speedMultiplier);
    } else {
      await this.controller.animateTo(wp.joints, duration, this.speedMultiplier);
    }
  }

  _wait(ms) {
    return new Promise(resolve => {
      const check = () => {
        if (this._aborted) { resolve(); return; }
        resolve();
      };
      setTimeout(check, ms / this.speedMultiplier);
    });
  }

  _notify() {
    if (this.onStateChange) {
      this.onStateChange({
        state: this.state,
        currentIndex: this.currentIndex,
        total: this.program.length,
      });
    }
    if (this.onProgress) {
      const progress = this.program.length > 0
        ? (this.currentIndex + 1) / this.program.length
        : 0;
      this.onProgress(progress);
    }
  }
}
