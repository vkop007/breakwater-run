import { describe, it, expect } from 'vitest'
import { policeSpawns } from '../../src/game/police/spawning'
import { roadPath } from '../../src/game/traffic/steering'
import { distance } from '../../src/data/district'
import type { Point } from '../../src/types/game'
describe('police arrival and road routes',()=>{
  it('spawns all three levels off camera at the center and district corners',()=>{
    for(const p of [[9,1,20],[-230,1,-230],[-230,1,230],[230,1,-230],[230,1,230]] as Point[]) for(let yaw=0;yaw<Math.PI*2;yaw+=Math.PI/4) for(const level of [1,2,3]) {
      const spawns=policeSpawns(level,p,yaw,()=>true)
      expect(spawns,`${p}/${yaw}/${level}`).toHaveLength(level)
      for(const s of spawns){expect(distance(p,s.position)).toBeGreaterThan(60);expect(Math.abs(s.position[0])).toBeLessThan(238);expect(Math.abs(s.position[2])).toBeLessThan(238)}
      expect(new Set(spawns.map(s=>s.position.join(','))).size).toBe(level)
    }
  })
  it('keeps visible arrivals outside the forward camera cone',()=>{
    const player: Point = [9,1,20]
    for (let yaw=0;yaw<Math.PI*2;yaw+=Math.PI/4) for(const s of policeSpawns(3,player,yaw)) {
      const dot=((s.position[0]-player[0])*Math.sin(yaw)+(s.position[2]-player[2])*Math.cos(yaw))/distance(player,s.position)
      expect(dot).toBeLessThan(.7)
    }
  })
  it('keeps intermediate pursuit segments on the connected Manhattan road graph',()=>{
    const path=roadPath([3,1,20],[195,1,-185],0)
    expect(path.length).toBeGreaterThan(3)
    for(let i=1;i<path.length-1;i++) expect(path[i][0]===path[i-1][0]||path[i][2]===path[i-1][2]).toBe(true)
    expect(path.at(-1)).toEqual([195,1,-185])
  })
})
