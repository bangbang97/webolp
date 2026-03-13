import { COLORS } from '../utils/constants.js';

export class WaypointList {
  constructor(container, program, player) {
    this.container = container;
    this.program = program;
    this.player = player;
    this.listEl = null;
    this.onGoToWaypoint = null;
    this.dragSrcIndex = null;
    this._build();
  }

  _build() {
    const wrapper = document.createElement('div');
    wrapper.className = 'space-y-2';

    const title = document.createElement('h3');
    title.className = 'text-sm font-bold text-cyan-400 uppercase tracking-wider mb-2';
    title.textContent = 'Waypoints';
    wrapper.appendChild(title);

    this.listEl = document.createElement('div');
    this.listEl.className = 'waypoint-list space-y-1 max-h-[40vh] overflow-y-auto pr-1';
    wrapper.appendChild(this.listEl);

    this.container.appendChild(wrapper);
  }

  render(waypoints, activeIndex = -1) {
    this.listEl.innerHTML = '';

    if (waypoints.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'text-xs text-gray-500 italic py-4 text-center';
      empty.textContent = 'No waypoints yet. Use "Teach Point" to add.';
      this.listEl.appendChild(empty);
      return;
    }

    waypoints.forEach((wp, idx) => {
      const item = document.createElement('div');
      const isActive = idx === activeIndex;
      const typeColor = wp.moveType === 'LIN' ? COLORS.linHex : COLORS.ptpHex;

      item.className = `waypoint-item ${isActive ? 'waypoint-active' : ''}`;
      item.draggable = true;
      item.dataset.index = idx;

      item.innerHTML = `
        <div class="flex items-center gap-2 w-full">
          <span class="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style="background: ${typeColor}22; color: ${typeColor}">
            ${wp.moveType}
          </span>
          <div class="flex-1 min-w-0">
            <div class="text-xs font-medium text-gray-200 truncate">${wp.name}</div>
            <div class="text-[10px] text-gray-500">${wp.id} · ${wp.speed}%</div>
          </div>
          <div class="flex gap-1">
            <button class="wp-btn wp-goto" title="Go to point">▶</button>
            <button class="wp-btn wp-edit" title="Edit">✎</button>
            <button class="wp-btn wp-delete" title="Delete">✕</button>
          </div>
        </div>
      `;

      // Go to waypoint
      item.querySelector('.wp-goto').addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onGoToWaypoint) this.onGoToWaypoint(idx);
      });

      // Edit waypoint
      item.querySelector('.wp-edit').addEventListener('click', (e) => {
        e.stopPropagation();
        this._editWaypoint(idx, wp);
      });

      // Delete waypoint
      item.querySelector('.wp-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        this.program.removeWaypoint(idx);
      });

      // Drag & drop
      item.addEventListener('dragstart', (e) => {
        this.dragSrcIndex = idx;
        e.dataTransfer.effectAllowed = 'move';
        item.classList.add('opacity-50');
      });
      item.addEventListener('dragend', () => {
        item.classList.remove('opacity-50');
      });
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        if (this.dragSrcIndex !== null && this.dragSrcIndex !== idx) {
          this.program.moveWaypoint(this.dragSrcIndex, idx);
        }
        this.dragSrcIndex = null;
      });

      this.listEl.appendChild(item);
    });
  }

  _editWaypoint(index, wp) {
    const name = prompt('Waypoint name:', wp.name);
    if (name === null) return;

    const speed = prompt('Speed (1-100):', wp.speed);
    if (speed === null) return;

    const moveType = prompt('Move type (PTP or LIN):', wp.moveType);
    if (moveType === null) return;

    const dwellTime = prompt('Dwell time (ms):', wp.dwellTime);
    if (dwellTime === null) return;

    this.program.updateWaypoint(index, {
      name: name || wp.name,
      speed: Math.max(1, Math.min(100, parseInt(speed) || wp.speed)),
      moveType: (moveType.toUpperCase() === 'LIN') ? 'LIN' : 'PTP',
      dwellTime: Math.max(0, parseInt(dwellTime) || 0),
    });
  }
}
