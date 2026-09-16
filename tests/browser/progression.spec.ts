import { expect, test, type Page } from '@playwright/test'
import type {} from './gameplay.spec'
async function boot(page:Page){await page.goto('/');await page.getByRole('button',{name:'New Game',exact:true}).click();await page.getByRole('button',{name:'Start exploring',exact:true}).click();await page.waitForFunction(()=>window.__breakwater?.game.getState().ready)}
async function placePlayer(page:Page,x:number,z:number){await page.evaluate(([x,z])=>{const d=window.__breakwater;d.input.clear();d.runtime.occupied=null;d.runtime.playerBody!.setEnabled(true);d.runtime.playerBody!.setTranslation({x,y:1.3,z},true);d.runtime.position=[x,1.3,z];d.game.setState({player:{...d.game.getState().player,position:[x,1.3,z]}})},[x,z]);await page.waitForTimeout(400)}
async function stopAt(page:Page,x:number,z:number){await page.evaluate(([x,z])=>{const d=window.__breakwater,v=d.runtime.vehicles.get(d.runtime.occupied!)!;d.input.clear();v.body.setTranslation({x,y:1.3,z},true);v.body.setLinvel({x:0,y:0,z:0},true);v.body.setAngvel({x:0,y:0,z:0},true)},[x,z]);await page.waitForTimeout(400)}

test('mission objectives, payouts, garage purchases, saved checkpoints and Hot Exit',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='chromium','Deep scenario coverage runs once; common controls run in every engine.')
  await boot(page)
  // Seed each location to exercise objective gates independently of long-distance navigation.
  await placePlayer(page,-9,-22);await page.evaluate(()=>window.__breakwater.dispatch({type:'mission',id:'delivery'}))
  await placePlayer(page,-6,-20);await page.keyboard.press('KeyE')
  await expect.poll(()=>page.evaluate(()=>window.__breakwater.game.getState().mission?.step)).toBe(1)
  await page.keyboard.press('KeyF')
  for(const z of [-36,-40,-44]){await placePlayer(page,-9,z);await page.keyboard.press('KeyE')}
  await expect.poll(()=>page.evaluate(()=>window.__breakwater.game.getState().mission?.step)).toBe(4)
  await page.evaluate(()=>window.__breakwater.dispatch({type:'save'}))
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('breakwater.save.v1')!).checkpoint.mission.step)).toBe(4)
  await page.evaluate(()=>{const d=window.__breakwater;d.game.setState({mission:{...d.game.getState().mission!,status:'failed',reason:'test recovery'},recovery:'injured'});d.app.getState().pause()})
  await page.getByRole('button',{name:'Restart checkpoint',exact:false}).click()
  await expect.poll(()=>page.evaluate(()=>window.__breakwater.game.getState().mission?.status)).toBe('active')
  expect(await page.evaluate(()=>window.__breakwater.game.getState().mission?.step)).toBe(4)
  for(const [x,z] of [[9,-105],[105,18],[9,22]]){
    await placePlayer(page,-6,-20);await page.keyboard.press('KeyE');await stopAt(page,x-6,z)
    await page.keyboard.press('KeyF');await placePlayer(page,x,z);await page.keyboard.press('KeyE')
    // Keep the van available at a known fixture position for the next delivery.
    await page.evaluate(()=>{const v=window.__breakwater.runtime.vehicles.get('delivery-van')!;v.body.setTranslation({x:-3.3,y:1.3,z:-20},true);v.position=[-3.3,1.3,-20];v.body.setLinvel({x:0,y:0,z:0},true)})
  }
  await placePlayer(page,-6,-20);await page.keyboard.press('KeyE');await stopAt(page,-3.3,-20)
  await expect.poll(()=>page.evaluate(()=>window.__breakwater.game.getState().completed)).toContain('delivery')
  expect(await page.evaluate(()=>window.__breakwater.game.getState().money)).toBe(1000)
  await placePlayer(page,105,18);await page.evaluate(()=>window.__breakwater.dispatch({type:'mission',id:'recovery'}))
  await placePlayer(page,102,-120);await page.waitForTimeout(800);await page.keyboard.press('KeyE')
  await expect.poll(()=>page.evaluate(()=>window.__breakwater.runtime.occupied)).toBe('recovery-car')
  await stopAt(page,99.3,20)
  await expect.poll(()=>page.evaluate(()=>window.__breakwater.game.getState().completed)).toContain('recovery')
  await placePlayer(page,105,18)
  await page.evaluate(()=>window.__breakwater.dispatch({type:'purchase',kind:'van'}))
  expect(await page.evaluate(()=>window.__breakwater.game.getState().money)).toBe(200)
  await page.evaluate(()=>window.__breakwater.dispatch({type:'purchase',kind:'van'}))
  expect(await page.evaluate(()=>window.__breakwater.game.getState().money)).toBe(200)
  await page.evaluate(()=>window.__breakwater.dispatch({type:'select-vehicle',kind:'van'}))
  await expect.poll(()=>page.evaluate(()=>window.__breakwater.runtime.vehicles.has('owned-van'))).toBe(true)
  await placePlayer(page,94,25)
  await page.evaluate(()=>{const d=window.__breakwater;d.dispatch({type:'service',service:'paint',color:d.game.getState().colors.van});d.dispatch({type:'service',service:'paint',color:'invalid'})})
  expect(await page.evaluate(()=>window.__breakwater.game.getState().money)).toBe(200)
  await page.evaluate(()=>{const d=window.__breakwater;d.dispatch({type:'service',service:'paint',color:'#123456'});d.dispatch({type:'service',service:'paint',color:'#123456'})})
  expect(await page.evaluate(()=>window.__breakwater.game.getState().money)).toBe(100)
  await placePlayer(page,-87,-178);await page.evaluate(()=>window.__breakwater.dispatch({type:'mission',id:'hot-exit'}))
  await placePlayer(page,-102,-192);await page.waitForTimeout(700);await page.keyboard.press('KeyE')
  await expect.poll(()=>page.evaluate(()=>window.__breakwater.game.getState().wanted.level)).toBe(2)
  await expect.poll(()=>page.evaluate(()=>[...window.__breakwater.runtime.vehicles.keys()].filter(k=>k.startsWith('police')).length)).toBe(2)
  // Move behind distant buildings; the real LOS/search logic must clear pursuit.
  await stopAt(page,195,210)
  await expect.poll(()=>page.evaluate(()=>window.__breakwater.game.getState().wanted.level),{timeout:35000}).toBe(0)
  await stopAt(page,99.3,20)
  await expect.poll(()=>page.evaluate(()=>window.__breakwater.game.getState().completed)).toContain('hot-exit')
  expect(await page.evaluate(()=>window.__breakwater.game.getState().unlocked)).toContain('coupe')
})
