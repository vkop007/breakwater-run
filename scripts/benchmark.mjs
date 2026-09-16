import { chromium } from '@playwright/test'
import { writeFile, mkdir } from 'node:fs/promises'
const uncapped=process.env.BENCHMARK_UNCAPPED==='1'
const browser=await chromium.launch({channel:'chromium',args:uncapped?['--disable-frame-rate-limit','--disable-gpu-vsync']:[]})
const results=[]
try {
  for(const quality of ['low','medium','high']){
    const page=await browser.newPage({viewport:{width:1440,height:900}})
    const errors=[];page.on('pageerror',e=>errors.push(e.message))
    await page.goto('http://127.0.0.1:4173/')
    await page.getByRole('button',{name:'Settings',exact:true}).click()
    await page.getByRole('button',{name:quality,exact:true}).click()
    await page.getByRole('button',{name:'All set',exact:false}).click()
    await page.reload()
    const start=Date.now()
    await page.getByRole('button',{name:'New Game',exact:true}).click()
    await page.getByRole('button',{name:'Start exploring',exact:true}).click()
    await page.getByRole('button',{name:'Toggle performance panel',exact:true}).click()
    const stats=()=>page.locator('[aria-label="Live performance"] dl').evaluate(dl=>Object.fromEntries([...dl.children].map(r=>[r.querySelector('dt').textContent,r.querySelector('dd').textContent])))
    while(Number((await stats()).FPS)<1)await page.waitForTimeout(100)
    const readyMs=Date.now()-start
    await page.waitForTimeout(2000)
    const samples=[]
    for(let i=0;i<16;i++){await page.waitForTimeout(500);samples.push(await stats())}
    const fps=samples.map(s=>Number(s.FPS)).sort((a,b)=>a-b)
    await page.screenshot({path:`artifacts/production-${uncapped?'uncapped-':''}${quality}.png`})
    results.push({quality,viewport:'1440x900',readyMs,medianFps:fps[Math.floor(fps.length/2)],minFps:fps[0],maxFps:fps.at(-1),last:samples.at(-1),errors})
    await page.close()
  }
  await mkdir('artifacts',{recursive:true});await writeFile(`artifacts/performance${uncapped?'-uncapped':''}.json`,JSON.stringify({uncapped,recordedAt:new Date().toISOString(),browser:browser.version(),results},null,2))
  console.log(JSON.stringify(results,null,2))
} finally {await browser.close()}
