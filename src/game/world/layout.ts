import type { Block } from '../../scenes/sceneData'
import type { Point } from '../../types/game'
import { CHUNK_SIZE } from '../../data/district'
export interface Solid { id: string; position: Point; size: Point; color: string }
export interface ChunkData { id: string; x: number; z: number; solids: Solid[]; details: Block[]; trees: Point[] }
const colors = ['#e8c691', '#e2b396', '#d2d7bb', '#e8d9b3', '#c6d9d1']
export function makeChunk(cx: number, cz: number): ChunkData {
  const x = cx * CHUNK_SIZE, z = cz * CHUNK_SIZE
  const id = `${cx},${cz}`
  const solids: Solid[] = []
  const details: Block[] = []
  const trees: Point[] = []
  const add = (key: string, position: Point, size: Point, color: string) => solids.push({ id: `${id}/${key}`, position, size, color })
  add('ground', [x, -.6, z], [96, 1.2, 96], '#d6ceb7')
  details.push({ position: [x, .015, z], size: [12, .02, 96], color: '#596b70' }, { position: [x, .025, z], size: [96, .02, 12], color: '#596b70' })
  for (const sign of [-1, 1]) {
    for (const side of [-1, 1]) {
      add(`pavement-v${sign}${side}`, [x + sign * 8, .09, z + side * 27], [4, .18, 42], '#e5dcc3')
      add(`pavement-h${sign}${side}`, [x + side * 29, .09, z + sign * 8], [38, .18, 4], '#e5dcc3')
    }
  }
  for (let i = -44; i <= 44; i += 6) if (Math.abs(i) > 8) {
    details.push({ position: [x + i, .055, z], size: [2.5, .02, .14], color: '#ece0b0' }, { position: [x, .055, z + i], size: [.14, .02, 2.5], color: '#ece0b0' })
  }
  for (let i = -4; i <= 4; i++) for (const side of [-1, 1]) {
    details.push({ position: [x + i, .06, z + side * 12], size: [.6, .02, 3], color: '#eae6cf' }, { position: [x + side * 12, .06, z + i], size: [3, .02, .6], color: '#eae6cf' })
  }
  for (let i = 0; i < 4; i++) {
    const bx = x + (i % 2 ? 1 : -1) * 27, bz = z + (i < 2 ? -1 : 1) * 27
    const park = cx === 0 && cz === 0 && i === 3
    const service = (cx === -1 && cz === 0 && i === 3) || (cx === 1 && cz === 0 && i === 3)
    if (park) {
      add('park', [bx, .1, bz], [31, .2, 31], '#94aa79')
      details.push({ position: [bx, .22, bz], size: [3, .03, 31], color: '#dcd4b5' }, { position: [bx, .23, bz], size: [31, .03, 3], color: '#dcd4b5' })
      for (const dx of [-10, 10]) for (const dz of [-10, 10]) trees.push([bx + dx, .2, bz + dz])
      add('bench', [bx + 5, .7, bz + 2], [2, 1.2, .65], '#b89d70')
      continue
    }
    if (service) {
      add('service-slab', [bx, .04, bz], [30, .08, 30], '#bcbda9')
      if (cx === -1) {
        for (const dx of [-8, 8]) add(`canopy-${dx}`, [bx + dx, 2.5, bz], [.4, 5, .4], '#e9dcc0')
        add('canopy', [bx, 5, bz], [23, .6, 15], '#bf7957')
        for (const dx of [-5, 5]) add(`pump-${dx}`, [bx + dx, .9, bz], [.8, 1.8, .65], '#e4bf69')
      } else {
        add('garage-back', [bx, 3, bz + 13], [28, 6, 1], '#78a29a')
        for (const dx of [-13.5, 13.5]) add(`garage-side${dx}`, [bx + dx, 3, bz], [1, 6, 26], '#78a29a')
        add('garage-roof', [bx, 6, bz], [29, .4, 28], '#adc0ac')
      }
      continue
    }
    const seed = Math.abs(cx * 37 + cz * 13 + i * 17)
    const h = 8 + seed % 6 * 2.4, width = 24 + seed % 3 * 2, depth = 24
    add(`building-${i}`, [bx, h / 2, bz], [width, h, depth], colors[seed % colors.length])
    details.push({ position: [bx, h + .2, bz], size: [width + .5, .4, depth + .5], color: '#b59f80' }, { position: [bx - 4, h + .8, bz - 4], size: [3, 1, 2], color: '#bcb8a3' })
    for (let floor = 0; floor < Math.floor(h / 3); floor++) {
      for (let w = -8; w <= 8; w += 4) for (const side of [-1, 1]) {
        details.push({ position: [bx + w, 2 + floor * 3, bz + side * (depth / 2 + .03)], size: [1.5, 1.6, .1], color: '#466b70' }, { position: [bx + side * (width / 2 + .03), 2 + floor * 3, bz + w], size: [.1, 1.6, 1.5], color: '#466b70' })
      }
    }
    trees.push([x + (i % 2 ? 11 : -11), .2, z + (i < 2 ? -34 : 34)])
  }
  for (const side of [-1, 1]) {
    add(`lamp${side}`, [x + side * 8, 2.7, z + side * 13], [.15, 5.3, .15], '#4e6a66')
    details.push({ position: [x + side * 8, 5.4, z + side * 13], size: [.8, .2, .8], color: '#f0dea6' })
  }
  return { id, x, z, solids, details, trees }
}
export function visibleChunks(position: Point, radius = 1): string[] {
  const cx = Math.max(-2, Math.min(2, Math.round(position[0] / 96))), cz = Math.max(-2, Math.min(2, Math.round(position[2] / 96)))
  const chunks: string[] = []
  for (let x = Math.max(-2, cx - radius); x <= Math.min(2, cx + radius); x++) for (let z = Math.max(-2, cz - radius); z <= Math.min(2, cz + radius); z++) chunks.push(`${x},${z}`)
  return chunks
}
