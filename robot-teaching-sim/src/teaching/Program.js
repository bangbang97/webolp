import { resetWaypointCounter } from './Waypoint.js';

export class Program {
  constructor() {
    this.name = 'Untitled Program';
    this.waypoints = [];
    this.onChange = null; // callback
  }

  addWaypoint(wp) {
    this.waypoints.push(wp);
    this._notify();
  }

  removeWaypoint(index) {
    this.waypoints.splice(index, 1);
    this._notify();
  }

  moveWaypoint(fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= this.waypoints.length) return;
    if (toIndex < 0 || toIndex >= this.waypoints.length) return;
    const [wp] = this.waypoints.splice(fromIndex, 1);
    this.waypoints.splice(toIndex, 0, wp);
    this._notify();
  }

  updateWaypoint(index, updates) {
    if (index < 0 || index >= this.waypoints.length) return;
    Object.assign(this.waypoints[index], updates);
    this._notify();
  }

  clear() {
    this.waypoints = [];
    resetWaypointCounter(0);
    this._notify();
  }

  getWaypoint(index) {
    return this.waypoints[index] || null;
  }

  get length() {
    return this.waypoints.length;
  }

  toJSON() {
    return {
      programName: this.name,
      created: new Date().toISOString(),
      waypoints: this.waypoints.map(wp => ({ ...wp })),
    };
  }

  fromJSON(data) {
    this.name = data.programName || 'Imported Program';
    this.waypoints = data.waypoints.map(wp => ({ ...wp }));
    // Update counter to max
    let maxNum = 0;
    for (const wp of this.waypoints) {
      const match = wp.id.match(/P(\d+)/);
      if (match) maxNum = Math.max(maxNum, parseInt(match[1]));
    }
    resetWaypointCounter(maxNum);
    this._notify();
  }

  _notify() {
    if (this.onChange) this.onChange(this.waypoints);
  }
}
