import { expect, test } from '@playwright/test'
import type {} from './gameplay.spec'
declare global { interface Window { __audio: AudioContext[]; __gains: GainNode[] } }
test('audio gesture, channel volume, pause/disposal and changing weather',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='chromium','Audio instrumentation runs once.')
  await page.addInitScript(()=>{
    window.__audio=[];window.__gains=[]
    const Native=window.AudioContext, create=Native.prototype.createGain
    Native.prototype.createGain=function(){const node=create.call(this);window.__gains.push(node);return node}
    window.AudioContext=class extends Native {constructor(){super();window.__audio.push(this)}}
  })
  await page.goto('/');await page.getByRole('button',{name:'New Game',exact:true}).click();await page.getByRole('button',{name:'Start exploring',exact:true}).click();await page.waitForFunction(()=>window.__breakwater?.game.getState().ready)
  expect(await page.evaluate(()=>window.__audio.length)).toBe(0)
  await page.keyboard.press('KeyW')
  await expect.poll(()=>page.evaluate(()=>window.__audio[0]?.state)).toBe('running')
  await page.evaluate(()=>window.__breakwater.settings.getState().updateSettings({masterVolume:0}))
  await expect.poll(()=>page.evaluate(()=>window.__gains[0].gain.value)).toBeLessThan(.001)
  await page.evaluate(()=>{const d=window.__breakwater;d.runtime.elapsed=361;d.game.setState({time:1300})})
  await expect.poll(()=>page.evaluate(()=>window.__breakwater.game.getState().weather)).toBe('rain')
  await page.screenshot({path:'artifacts/night-rain.png'})
  await page.keyboard.press('Escape');await expect.poll(()=>page.evaluate(()=>window.__audio[0].state)).toBe('suspended')
  await page.getByRole('button',{name:'Resume game',exact:false}).click();await expect.poll(()=>page.evaluate(()=>window.__audio[0].state)).toBe('running')
  await page.keyboard.press('Escape');await page.getByRole('button',{name:'Return to main menu',exact:false}).click();await expect.poll(()=>page.evaluate(()=>window.__audio[0].state)).toBe('closed')
})
