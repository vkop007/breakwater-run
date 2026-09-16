import { expect, test } from '@playwright/test'
import type {} from './gameplay.spec'

test('witness cancellation, three wanted levels, arrest and safehouse recovery',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='chromium','Police scenario runs once against real Rapier/LOS.')
  await page.goto('/');await page.getByRole('button',{name:'New Game',exact:true}).click();await page.getByRole('button',{name:'Start exploring',exact:true}).click();await page.waitForFunction(()=>window.__breakwater?.game.getState().ready)
  const witness=async()=>page.evaluate(()=>{const d=window.__breakwater,n=d.pedestrians[4];n.position=[11,1,20];n.heading=-Math.PI/2;n.state='idle';n.timer=10;d.reportCrime({type:'theft',position:[...d.runtime.position],severity:1})})
  await witness();await expect.poll(()=>page.evaluate(()=>window.__breakwater.game.getState().wanted.state)).toBe('reporting')
  // Put a solid facade between the player and the reporting witness.
  await page.evaluate(()=>{const d=window.__breakwater;d.runtime.playerBody!.setTranslation({x:44,y:1.2,z:-44},true);d.runtime.position=[44,1.2,-44]})
  await expect.poll(()=>page.evaluate(()=>window.__breakwater.game.getState().wanted.state)).toBe('clear')
  await page.evaluate(()=>{const d=window.__breakwater;d.runtime.playerBody!.setTranslation({x:9,y:1.2,z:20},true);d.runtime.position=[9,1.2,20]})
  await page.waitForTimeout(200);await witness()
  await expect.poll(()=>page.evaluate(()=>window.__breakwater.game.getState().wanted.level)).toBe(1)
  await expect.poll(()=>page.evaluate(()=>window.__breakwater.runtime.vehicles.has('police-0'))).toBe(true)
  // An officer with a clear line of sight witnesses two further offences.
  await page.evaluate(()=>{const d=window.__breakwater,v=d.runtime.vehicles.get('police-0')!;v.body.setTranslation({x:3,y:1.3,z:13},true);v.body.setLinvel({x:0,y:0,z:0},true);v.position=[3,1.3,13]})
  for(const level of [2,3]){await page.evaluate(()=>{const d=window.__breakwater;d.reportCrime({type:'theft',position:[...d.runtime.position],severity:1})});await expect.poll(()=>page.evaluate(()=>window.__breakwater.game.getState().wanted.level)).toBe(level)}
  await expect.poll(()=>page.evaluate(()=>[...window.__breakwater.runtime.vehicles.keys()].filter(k=>k.startsWith('police')).length)).toBe(3)
  // Hold one officer in arrest range to test the full four-second capture timer.
  await page.evaluate(()=>{const d=window.__breakwater,v=d.runtime.vehicles.get('police-0')!;v.body.setTranslation({x:6,y:1.3,z:20},true);v.body.setLinvel({x:0,y:0,z:0},true);v.body.setBodyType(2,true);v.position=[6,1.3,20]})
  await expect(page.getByRole('heading',{name:'The road caught up with you.'})).toBeVisible()
  expect(await page.evaluate(()=>window.__breakwater.game.getState().money)).toBe(250)
  await page.evaluate(()=>window.__breakwater.app.getState().resume())
  expect(await page.evaluate(()=>window.__breakwater.app.getState().phase)).toBe('paused')
  await page.getByRole('button',{name:'Return to apartment',exact:false}).click()
  await expect.poll(()=>page.evaluate(()=>window.__breakwater.game.getState().wanted.level)).toBe(0)
  expect(await page.evaluate(()=>window.__breakwater.game.getState().recovery)).toBeNull()
})
