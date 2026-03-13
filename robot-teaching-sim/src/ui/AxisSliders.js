import { JOINT_LIMITS } from '../utils/constants.js';

export class AxisSliders {
  constructor(container, robotController) {
    this.container = container;
    this.controller = robotController;
    this.sliders = [];
    this.valueLabels = [];
    this._build();
  }

  _build() {
    const panel = document.createElement('div');
    panel.className = 'space-y-2';

    const title = document.createElement('h3');
    title.className = 'text-sm font-bold text-cyan-400 uppercase tracking-wider mb-3';
    title.textContent = 'Joint Control';
    panel.appendChild(title);

    for (let i = 0; i < 6; i++) {
      const limit = JOINT_LIMITS[i];
      const row = document.createElement('div');
      row.className = 'axis-slider-row';

      // Label
      const label = document.createElement('div');
      label.className = 'flex justify-between items-center mb-1';
      label.innerHTML = `
        <span class="text-xs text-gray-400 font-mono">A${i + 1}</span>
        <span class="text-xs text-cyan-300 font-mono axis-value" data-axis="${i}">0.0°</span>
      `;
      row.appendChild(label);

      // Slider row with +/- buttons
      const sliderRow = document.createElement('div');
      sliderRow.className = 'flex items-center gap-1';

      const minusBtn = document.createElement('button');
      minusBtn.className = 'axis-btn';
      minusBtn.textContent = '−';
      minusBtn.addEventListener('click', () => {
        this.controller.nudgeJoint(i, -0.5);
        this.updateDisplay(this.controller.currentAngles);
      });

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = limit.min;
      slider.max = limit.max;
      slider.step = '0.1';
      slider.value = '0';
      slider.className = 'axis-slider flex-1';
      slider.addEventListener('input', () => {
        this.controller.setJointAngle(i, parseFloat(slider.value));
        this.updateDisplay(this.controller.currentAngles);
      });

      const plusBtn = document.createElement('button');
      plusBtn.className = 'axis-btn';
      plusBtn.textContent = '+';
      plusBtn.addEventListener('click', () => {
        this.controller.nudgeJoint(i, 0.5);
        this.updateDisplay(this.controller.currentAngles);
      });

      sliderRow.appendChild(minusBtn);
      sliderRow.appendChild(slider);
      sliderRow.appendChild(plusBtn);
      row.appendChild(sliderRow);

      // Min/max labels
      const rangeLabel = document.createElement('div');
      rangeLabel.className = 'flex justify-between text-[10px] text-gray-600 mt-0.5';
      rangeLabel.innerHTML = `<span>${limit.min}°</span><span>${limit.max}°</span>`;
      row.appendChild(rangeLabel);

      panel.appendChild(row);
      this.sliders.push(slider);
    }

    // Home button
    const homeBtn = document.createElement('button');
    homeBtn.className = 'w-full mt-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-bold rounded transition-colors';
    homeBtn.textContent = 'HOME POSITION (R)';
    homeBtn.addEventListener('click', () => {
      this.controller.goHome();
      this.updateDisplay(this.controller.currentAngles);
    });
    panel.appendChild(homeBtn);

    this.container.appendChild(panel);
  }

  updateDisplay(angles) {
    for (let i = 0; i < 6; i++) {
      this.sliders[i].value = angles[i].toFixed(1);
      const label = this.container.querySelector(`.axis-value[data-axis="${i}"]`);
      if (label) label.textContent = `${angles[i].toFixed(1)}°`;
    }
  }
}
