import { expect, test } from '@playwright/test'
import type {} from './gameplay.spec'

test('three vehicle types accelerate and brake; race failure, restart and reward',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='chromium','Physics scenarios run once.')
  await page.goto('/');await page.getByRole('button',{name:'New Game',exact:true}).click();await page.getByRole('button',{name:'Start exploring',exact:true}).click();await page.waitForFunction(()=>window.__breakwater?.game.getState().ready)
  for(const [id,x] of [['player-car',0],['parked-coupe',96],['delivery-van',-96]] as const){
    await page.evaluate(([id,x])=>{const d=window.__breakwater,v=d.runtime.vehicles.get(id)!;d.runtime.occupied=null;d.input.clear();d.runtime.playerBody!.setEnabled(true);d.runtime.playerBody!.setTranslation({x:x+3,y:1.3,z:44},true);d.runtime.position=[x+3,1.3,44];v.body.setTranslation({x,y:1.3,z:44},true);v.body.setRotation({x:0,y:1,z:0,w:0},true);v.body.setLinvel({x:0,y:0,z:0},true);v.position=[x,1.3,44];v.legal=true},[id,x] as const)
    await page.waitForTimeout(500);await page.keyboard.press('KeyE')
    await expect.poll(()=>page.evaluate(()=>window.__breakwater.runtime.occupied)).toBe(id)
    await page.keyboard.down('KeyW');await page.waitForTimeout(1800);await page.keyboard.up('KeyW')
    expect(await page.evaluate(()=>window.__breakwater.game.getState().vehicle!.speed)).toBeGreaterThan(4)
    await page.evaluate(async()=>{const d=window.__breakwater;d.input.held.add('KeyS');const start=Date.now();while(Date.now()-start<4000&&d.runtime.vehicles.get(d.runtime.occupied!)!.speed>1)await new Promise(r=>setTimeout(r,20));d.input.clear()});expect(await page.evaluate(()=>Math.abs(window.__breakwater.runtime.vehicles.get(window.__breakwater.runtime.occupied!)!.speed))).toBeLessThan(2)
    await page.keyboard.press('KeyC');expect(await page.evaluate(()=>window.__breakwater.runtime.cameraMode)).toBe(1)
    await page.keyboard.press('KeyH');await expect.poll(()=>page.evaluate(()=>window.__breakwater.game.getState().vehicle!.headlights)).toBe(true)
  }
  // Start a race in the legal van, check the timeout gate, then restart and finish all checkpoints.
  await page.evaluate(()=>{const d=window.__breakwater,v=d.runtime.vehicles.get(d.runtime.occupied!)!;v.body.setTranslation({x:3,y:1.3,z:96},true);v.body.setLinvel({x:0,y:0,z:0},true);v.position=[3,1.3,96];d.runtime.position=[3,1.3,96];d.dispatch({type:'mission',id:'race'})})
  await expect.poll(()=>page.evaluate(()=>window.__breakwater.game.getState().mission?.id)).toBe('race')
  await page.evaluate(()=>{const d=window.__breakwater,m=d.game.getState().mission!;d.game.setState({mission:{...m,elapsed:121}})})
  await expect.poll(()=>page.evaluate(()=>window.__breakwater.game.getState().mission?.status)).toBe('failed')
  // Also wreck and overturn the chassis: a whole-job restart must restore a drivable car.
  await page.evaluate(()=>{const d=window.__breakwater,v=d.runtime.vehicles.get(d.runtime.occupied!)!;v.health=0;v.body.setRotation({x:1,y:0,z:0,w:0},true);v.body.setAngvel({x:3,y:2,z:1},true)})
  await page.evaluate(()=>window.__breakwater.dispatch({type:'restart-mission'}))
  await expect.poll(()=>page.evaluate(()=>window.__breakwater.game.getState().mission?.status)).toBe('active')
  expect(await page.evaluate(()=>{const d=window.__breakwater,v=d.runtime.vehicles.get(d.runtime.occupied!)!;return {health:v.health,upright:Math.abs(v.body.rotation().x)<.1&&Math.abs(v.body.rotation().z)<.1,nearStart:Math.hypot(v.position[0]-3,v.position[2]-96)<3}})).toEqual({health:100,upright:true,nearStart:true})
  for(const [x,z] of [[96,96],[96,0],[0,0],[-96,0],[-96,96],[0,96]]){
    await page.evaluate(([x,z])=>{const d=window.__breakwater,v=d.runtime.vehicles.get(d.runtime.occupied!)!;v.body.setTranslation({x,y:1.4,z},true);v.body.setLinvel({x:0,y:0,z:0},true)},[x,z]);await page.waitForTimeout(250)
  }
  await expect.poll(()=>page.evaluate(()=>window.__breakwater.game.getState().completed)).toContain('race')
  expect(await page.evaluate(()=>window.__breakwater.game.getState().money)).toBe(850)
  expect(await page.evaluate(()=>window.__breakwater.game.getState().bestRace)).toBeGreaterThan(0)
})
