let waypointCounter = 0;

export function createWaypoint(joints, tcp, options = {}) {
  waypointCounter++;
  return {
    id: `P${waypointCounter}`,
    name: options.name || `P${waypointCounter}`,
    joints: [...joints],
    tcp: { ...tcp.position, ...tcp.rotation },
    speed: options.speed ?? 100,
    moveType: options.moveType || 'PTP',
    dwellTime: options.dwellTime ?? 0,
  };
}

export function resetWaypointCounter(val = 0) {
  waypointCounter = val;
}

export function getNextId() {
  return `P${waypointCounter + 1}`;
}
