export type Vec3 = [number, number, number]
export interface Block { position: Vec3; size: Vec3; color: string; rotation?: number }

export const buildings = [
  { x: -24, z: -18, w: 9, d: 10, h: 12, color: '#ebc388', trim: '#e0845d' },
  { x: -13, z: -19, w: 10, d: 8, h: 17, color: '#e7cfc0', trim: '#a6604c' },
  { x: -1, z: -19, w: 10, d: 8, h: 10, color: '#f3dfa8', trim: '#699085' },
  { x: 10, z: -20, w: 8, d: 9, h: 14, color: '#cfdfcb', trim: '#56877d' },
  { x: 28, z: -20, w: 9, d: 9, h: 20, color: '#e5c7a8', trim: '#af8b70' },
  { x: 28, z: -8, w: 9, d: 10, h: 9, color: '#edb292', trim: '#ba674a' },
  { x: -23, z: 6, w: 11, d: 9, h: 8, color: '#e6a581', trim: '#b25e42' },
  { x: -9, z: 6, w: 12, d: 9, h: 5.6, color: '#e7d9b6', trim: '#4e8278' },
  { x: 5, z: 7, w: 10, d: 7, h: 10, color: '#f1d896', trim: '#cd9353' },
  { x: 28, z: 8, w: 9, d: 9, h: 5, color: '#bacfc0', trim: '#53867b' },
]

export function makeBuildingBlocks(): Block[] {
  const blocks: Block[] = []
  for (const b of buildings) {
    blocks.push(
      { position: [b.x, b.h / 2 + .6, b.z], size: [b.w, b.h, b.d], color: b.color },
      { position: [b.x, b.h + .75, b.z], size: [b.w + .5, .4, b.d + .5], color: b.trim },
      { position: [b.x, b.h + 1, b.z], size: [b.w - .6, .15, b.d - .6], color: '#b4aaa0' },
      { position: [b.x - b.w / 4, b.h + 1.4, b.z - 1], size: [2, 1, 1.6], color: '#d5cbbb' },
      { position: [b.x, .9, b.z], size: [b.w + .3, .6, b.d + .3], color: b.trim },
    )
    for (let floor = 0; floor < Math.floor(b.h / 3.1); floor++) {
      const y = floor * 3.1 + 2.4
      for (let col = 0; col < Math.floor(b.w / 2.7); col++) {
        const x = b.x - b.w / 2 + 1.4 + col * 2.7
        blocks.push(
          { position: [x, y, b.z + b.d / 2 + .02], size: [1.4, 1.75, .12], color: '#41676a' },
          { position: [x, y - .98, b.z + b.d / 2 + .15], size: [1.8, .15, .4], color: '#f5e6c9' },
          { position: [x, y, b.z + b.d / 2 + .11], size: [.08, 1.75, .06], color: '#e2d6bb' },
        )
        if (floor === 1 && b.h > 11) blocks.push({ position: [x, y - 1.0, b.z + b.d / 2 + .6], size: [2.1, .5, 1.1], color: b.trim })
      }
      for (let side = -1; side <= 1; side += 2) {
        for (let col = 0; col < 3; col++) blocks.push({
          position: [b.x + side * (b.w / 2 + .03), y, b.z - b.d / 2 + 1.6 + col * 2.6],
          size: [.1, 1.7, 1.2], color: '#527576',
        })
      }
    }
  }
  return blocks
}

export function makeStreetBlocks(): Block[] {
  const blocks: Block[] = [
    { position: [0, -.9, -2], size: [75, 2, 62], color: '#d2bd97' },
    { position: [0, .16, -2], size: [73, .25, 60], color: '#d7ceb7' },
    { position: [0, .32, -4.6], size: [72, .1, 7.8], color: '#657577' },
    { position: [18.5, .33, -2], size: [7.8, .1, 58], color: '#657577' },
    { position: [0, .37, 19], size: [73, .12, 7], color: '#dbceb0' },
    { position: [0, .42, 24], size: [74, .5, 1.5], color: '#eee0c1' },
    { position: [0, .75, 25], size: [74, 1.3, .6], color: '#c6af8b' },
    { position: [0, 1.43, 25], size: [74.5, .18, .9], color: '#f4e6c7' },
  ]
  for (let x = -33; x < 36; x += 4) {
    if (x > 13 && x < 24) continue
    blocks.push({ position: [x, .39, -4.6], size: [2, .02, .13], color: '#e5d9ab' })
  }
  for (let z = -29; z < 25; z += 4) {
    if (z > -11 && z < 2) continue
    blocks.push({ position: [18.5, .4, z], size: [.13, .02, 2], color: '#e5d9ab' })
  }
  for (let i = 0; i < 6; i++) {
    blocks.push({ position: [13 - i * 1.1, .4, -4.6], size: [.5, .025, 5.8], color: '#f4e8cc' })
    blocks.push({ position: [18.5, .4, 1.5 + i * 1.1], size: [5.8, .025, .5], color: '#f4e8cc' })
  }
  for (let x = -32; x < 36; x += 6) {
    blocks.push({ position: [x, .65, 13], size: [2.7, .6, 2.7], color: '#e9dbc1' })
    blocks.push({ position: [x, .98, 13], size: [2.3, .1, 2.3], color: '#889679' })
  }
  return blocks
}
