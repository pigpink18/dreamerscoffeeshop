// Sự kiện theo mùa – tính theo đồng hồ thật của máy (không theo ngày trong game) nên tự bật/tắt, không cần cập nhật app.
//  Giáng Sinh: cây thông, món Noel, khách đội mũ Noel, Cáo quàng khăn đỏ, nhạc Noel… tự tắt từ 0h ngày 3/1/2027.
export const XMAS_END = new Date(2027, 0, 3).getTime()

export function isXmasSeason(now = Date.now()): boolean {
  return now < XMAS_END
}
