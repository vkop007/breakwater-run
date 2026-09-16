import { chromium } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
const browser=await chromium.launch({channel:'chromium'})
const samples=[],errors=[]
const minutes=Number(process.env.SOAK_MINUTES||10)
try{
  const page=await browser.newPage({viewport:{width:1280,height:720}})
  page.on('pageerror',e=>errors.push(e.message))
  await page.goto('http://127.0.0.1:5173/')
  await page.getByRole('button',{name:'New Game',exact:true}).click();await page.getByRole('button',{name:'Start exploring',exact:true}).click()
  await page.waitForFunction(()=>window.__breakwater?.game.getState().ready)
  const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable')
  const start=Date.now()
  for(let i=0;i<minutes*12;i++){
    await page.evaluate(i=>{const d=window.__breakwater;if(d.game.getState().recovery)d.dispatch({type:'safehouse'});d.input.clear();d.app.getState().resume();const x=(i%5-2)*96+8,z=(Math.floor(i/5)%5-2)*96+20;d.runtime.playerBody.setTranslation({x,y:1.3,z},true);d.runtime.position=[x,1.3,z]},i)
    await page.waitForTimeout(5000)
    if(i%6===0)await cdp.send('HeapProfiler.collectGarbage')
    const state=await page.evaluate(()=>{const d=window.__breakwater;return {position:d.runtime.position,bodies:d.world.bodies.len(),colliders:d.world.colliders.len(),vehicles:d.runtime.vehicles.size,pedestrians:d.pedestrians.length,phase:d.app.getState().phase,step:d.runtime.step}})
    const metrics=await cdp.send('Performance.getMetrics'),heap=metrics.metrics.find(m=>m.name==='JSHeapUsedSize').value
    samples.push({seconds:Math.round((Date.now()-start)/1000),heapBytes:heap,...state})
    if(state.bodies>70||state.colliders>360||state.vehicles>15||state.pedestrians>20)throw Error(`Residency exceeded: ${JSON.stringify(state)}`)
    await writeFile('artifacts/soak.json',JSON.stringify({status:'running',minutes,errors,samples},null,2))
    if(i%12===11)console.log(JSON.stringify(samples.at(-1)))
  }
  await writeFile('artifacts/soak.json',JSON.stringify({status:'complete',minutes,errors,samples},null,2))
  if(errors.length)throw Error(errors.join('\n'))
  console.log(`Completed ${minutes} minutes and ${samples.length} residency transitions without runtime errors or actor-count growth.`)
}finally{await browser.close()}
