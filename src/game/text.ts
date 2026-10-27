export { noEmoji } from './emoji'

import type { RecipeId } from './data'
import { recipeById, STEPS } from './data'
import type { CupLook } from './pixel'
/** Hình ly thành phẩm của một món (dựng lại từ các bước công thức) */
export function recipeCup(id: RecipeId): CupLook {
  const b: CupLook = { cup: true, layers: [], ice: false, mixed: false, foam: false, whip: false, blended: false, chunks: false, straw: true, lid: false, full: true }
  for (const step of recipeById[id].steps) {
    const info = STEPS[step]
    if (step === 'ly') continue
    if (step === 'da') b.ice = true
    else if (step === 'khuay' || step === 'lac') b.mixed = true
    else if (step === 'xay') { b.blended = true; b.ice = false }
    else if (step === 'kem') b.foam = true
    else if (step === 'kemTuoi') b.whip = true
    else if (info.color) { b.layers.push(info.color); b.mixed = false; if (step === 'dao') b.chunks = true }
  }
  return b
}
