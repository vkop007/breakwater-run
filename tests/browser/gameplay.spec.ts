import { expect, test } from '@playwright/test'
import type { runtime } from '../../src/game/core/runtime'
import type { useGameStore } from '../../src/stores/gameStore'
import type { useAppStore } from '../../src/stores/appStore'
import type { dispatch } from '../../src/game/core/commands'
import type { reportCrime } from '../../src/game/core/events'
import type { input } from '../../src/game/input/input'
import type { useSettingsStore } from '../../src/stores/settingsStore'
import type { pedestrians } from '../../src/game/npcs/actors'
import type { World } from '@dimforge/rapier3d-compat'
declare global { interface Window { __breakwater: { runtime: typeof runtime; game: typeof useGameStore; app: typeof useAppStore; dispatch: typeof dispatch; reportCrime: typeof reportCrime; input: typeof input; settings: typeof useSettingsStore; pedestrians: typeof pedestrians; world: World } } }

test('play, move, jump, drive, pause, map, save and Continue', async ({ page }, testInfo) => {
  const errors: string[]=[];page.on('pageerror',e=>errors.push(e.message))
  await page.goto('/')
  await page.getByRole('button',{name:'New Game',exact:true}).click()
  await page.getByRole('button',{name:'Start exploring',exact:true}).click()
  await page.waitForFunction(()=>window.__breakwater?.game.getState().ready)
  const start=await page.evaluate(()=>window.__breakwater.runtime.position)
  await page.keyboard.down('KeyW');await page.waitForTimeout(1200);await page.keyboard.up('KeyW')
  const moved=await page.evaluate(()=>window.__breakwater.runtime.position)
  expect(start[2]-moved[2]).toBeGreaterThan(3)
  await page.keyboard.press('Space');await page.waitForTimeout(220)
  expect(await page.evaluate(()=>window.__breakwater.runtime.grounded)).toBe(false)
  await page.waitForTimeout(900)
  expect(await page.evaluate(()=>window.__breakwater.runtime.grounded)).toBe(true)
  // Return using actual player physics and camera-relative movement.
  await page.evaluate(async()=>{
    const d=window.__breakwater,p=d.runtime.position
    d.runtime.cameraYaw=Math.atan2(5-p[0],16-p[2]);d.input.held.add('KeyW')
    const start=Date.now();while(Date.now()-start<5000&&Math.hypot(d.runtime.position[0]-5,d.runtime.position[2]-16)>1)await new Promise(r=>setTimeout(r,40))
    d.input.clear()
  })
  await page.keyboard.press('KeyE')
  await expect.poll(()=>page.evaluate(()=>window.__breakwater.runtime.occupied)).toBe('player-car')
  await page.keyboard.down('KeyW');await page.waitForTimeout(3000);await page.keyboard.up('KeyW')
  expect(await page.evaluate(()=>window.__breakwater.game.getState().vehicle!.speed)).toBeGreaterThan(8)
  await page.keyboard.down('Space');await expect.poll(()=>page.evaluate(()=>Math.abs(window.__breakwater.game.getState().vehicle!.speed))).toBeLessThan(1);await page.keyboard.up('Space')
  await page.keyboard.press('KeyF')
  await expect.poll(()=>page.evaluate(()=>window.__breakwater.runtime.occupied)).toBeNull()
  await page.waitForTimeout(400)
  await page.keyboard.press('Escape')
  const step=await page.evaluate(()=>window.__breakwater.runtime.step)
  await page.waitForTimeout(500);expect(await page.evaluate(()=>window.__breakwater.runtime.step)).toBe(step)
  await page.getByRole('button',{name:'Save game',exact:false}).click()
  await expect(page.getByText('Progress saved.',{exact:true})).toBeVisible()
  await page.getByRole('button',{name:'District map',exact:false}).click()
  await expect(page.getByRole('heading',{name:'Find your own way.'})).toBeVisible()
  await page.keyboard.press('Escape');await page.getByRole('button',{name:'Return to main menu',exact:false}).click()
  await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click()
  await page.waitForFunction(()=>window.__breakwater?.game.getState().ready)
  await expect.poll(()=>page.evaluate(()=>window.__breakwater.runtime.npcCount)).toBeGreaterThan(0)
  await page.screenshot({path:`artifacts/gameplay-${testInfo.project.name}.png`})
  expect(errors).toEqual([])
})
