import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameStore } from '../../src/stores/gameStore'
import { useAppStore } from '../../src/stores/appStore'
import { runtime } from '../../src/game/core/runtime'
import { advanceMission, startMission, updateMission } from '../../src/game/missions/missionSystem'
import { captureCheckpoint, restoreCheckpoint } from '../../src/game/missions/checkpoints'
import { saveGame, readSave, continueGame, validateSave } from '../../src/game/save/saveSystem'
const memory = new Map<string,string>()
beforeEach(()=>{
  memory.clear()
  vi.stubGlobal('localStorage',{getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>memory.set(k,v),removeItem:(k:string)=>memory.delete(k)})
  runtime.reset();useGameStore.getState().reset();useGameStore.setState({ready:true});runtime.grounded=true
})
describe('mission and save invariants',()=>{
  it('enforces proximity and prior mission unlocks',()=>{
    expect(startMission('delivery')).toBe(false)
    runtime.position=[-9,1,-22];expect(startMission('delivery')).toBe(true)
    expect(startMission('recovery')).toBe(false)
    useGameStore.setState({mission:null});runtime.position=[-87,1,-178]
    expect(startMission('hot-exit')).toBe(false)
  })
  it('pays completion exactly once and fails timed activity without a reward',()=>{
    useGameStore.setState({mission:{id:'delivery',step:7,elapsed:99,status:'active',reason:''}})
    advanceMission();advanceMission()
    expect(useGameStore.getState().money).toBe(1000)
    expect(useGameStore.getState().completed).toEqual(['delivery'])
    useGameStore.setState({mission:{id:'race',step:0,elapsed:120,status:'active',reason:''}})
    updateMission(.2)
    expect(useGameStore.getState().mission?.status).toBe('failed')
    expect(useGameStore.getState().money).toBe(1000)
  })
  it('restores the objective, timer, location and mission car from a checkpoint',()=>{
    useGameStore.setState({mission:{id:'delivery',step:4,elapsed:60,status:'active',reason:''}})
    runtime.position=[9,1,-105];runtime.parked.set('delivery-van',{position:[3,1,-100],yaw:1,health:72})
    captureCheckpoint()
    useGameStore.setState({mission:{id:'delivery',step:5,elapsed:90,status:'failed',reason:'destroyed'},recovery:'injured'})
    runtime.position=[50,1,50];runtime.parked.clear()
    expect(restoreCheckpoint()).toBe(true)
    expect(useGameStore.getState().mission).toMatchObject({step:4,elapsed:60,status:'active'})
    expect(runtime.parked.get('delivery-van')?.health).toBe(72)
    expect(runtime.position).toEqual([9,1,-105])
    expect(useAppStore.getState().phase).toBe('playing')
  })
  it('round-trips progression, parked vehicles and a valid checkpoint',()=>{
    runtime.parked.set('delivery-van',{position:[3,1,-100],yaw:1,health:72})
    useGameStore.setState({money:1234,mission:{id:'delivery',step:4,elapsed:60,status:'active',reason:''}})
    captureCheckpoint();expect(saveGame()).toBe(true)
    runtime.reset();useGameStore.getState().reset()
    expect(continueGame()).toBe(true)
    expect(useGameStore.getState().money).toBe(1234)
    expect(useGameStore.getState().checkpoint?.mission.step).toBe(4)
    expect(runtime.parked.get('delivery-van')?.health).toBe(72)
  })
  it('uses a known-good backup for corrupt data and migrates the original schema',()=>{
    expect(saveGame()).toBe(true)
    useGameStore.setState({money:500});expect(saveGame()).toBe(true)
    memory.set('breakwater.save.v1','{"incomplete":')
    expect(readSave()?.money).toBe(350)
    const old={...readSave()!,version:1};delete (old as Partial<typeof old>).checkpoint
    expect(validateSave(old)?.version).toBe(2)
    expect(validateSave({...old,version:99})).toBeNull()
    expect(validateSave({...old,money:-1})).toBeNull()
  })
  it('refuses unsafe saves and handles denied storage without false success',()=>{
    runtime.grounded=false;expect(saveGame()).toBe(false)
    runtime.grounded=true;useGameStore.setState({wanted:{...useGameStore.getState().wanted,level:2}})
    expect(saveGame()).toBe(false)
    useGameStore.setState({wanted:{...useGameStore.getState().wanted,level:0}})
    vi.stubGlobal('localStorage',{getItem:()=>null,setItem:()=>{throw new Error('quota')}})
    expect(saveGame()).toBe(false);expect(useGameStore.getState().saveMessage).toContain('unavailable or full')
  })
})
