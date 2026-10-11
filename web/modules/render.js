// TODO brauchen wir diese Konvertierung überhaupt?
export function rad2deg(coordinates) {
    return Object.fromEntries(
        Object.entries(coordinates).map(([ key, value ]) => [ key, value * 180 / Math.PI ])
    );
}

// export function createCameraPolygon(pos, fov) {
//     const halfHorizontal = fov.horizontal / 2;
//     const halfVertical = fov.vertical / 2;
//     return [
//         [ `${pos.yaw - halfHorizontal}deg`, `${pos.pitch - halfVertical}deg` ],
//         [ `${pos.yaw - halfHorizontal}deg`, `${pos.pitch + halfVertical}deg` ],
//         [ `${pos.yaw + halfHorizontal}deg`, `${pos.pitch + halfVertical}deg` ],
//         [ `${pos.yaw + halfHorizontal}deg`, `${pos.pitch - halfVertical}deg` ]
//     ];
// }

export function createCameraPolygon(viewer, fov) {
  const rad = (d) => (d * Math.PI) / 180;
  const { width, height } = viewer.getSize();

  // Brennweite in Pixeln aus dem aktuellen vertikalen FOV (Grad)
  const f = (height / 2) / Math.tan(rad(viewer.state.vFov) / 2);
  const dx = f * Math.tan(rad(fov.horizontal / 2));
  const dy = f * Math.tan(rad(fov.vertical / 2));
  const cx = width / 2;
  const cy = height / 2;

  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => {
    const { yaw, pitch } = viewer.dataHelper.viewerCoordsToSphericalCoords({
      x: cx + sx * dx,
      y: cy + sy * dy,
    });
    return [yaw, pitch]; // Radiant
  });
}