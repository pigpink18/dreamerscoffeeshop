// TỰ SINH bởi tools/kaykit/bake.mjs – đừng sửa tay. Ảnh bếp 3D KayKit (CC0) 256x134 + điểm neo (toạ độ ảnh).
export const KART_W = 256
export const KART_H = 134
export const KART_LAYERS = ['back', 'front', 'pan', 'pot', 'bowl', 'plate'] as const
export const KANCHOR = {
  burnerL: [116.6, 80.4],
  burnerR: [140.7, 80.4],
  panIn: [116.6, 76.8],
  potIn: [140.7, 73.3],
  bowl: [164.8, 80.8],
  plate: [74.8, 79.6],
  waffle: [190.1, 86.1],
  counterTopFront: [128, 94],
  cook: [77.3, 120.5],
} as const satisfies Record<string, readonly [number, number]>
