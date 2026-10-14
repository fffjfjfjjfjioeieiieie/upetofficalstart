import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const dir = new URL('./', import.meta.url);
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({headless:true, args:['--remote-debugging-port=9334','--remote-debugging-address=127.0.0.1']});
const context = await browser.newContext({viewport:{width:1440,height:1000}, reducedMotion:'reduce'});
const targets = [['guns-register','https://guns.lol/register'],['guns-customize','https://guns.lol/customize'],['guns-docs','https://help.guns.lol/getting-started/customization'],['swats','https://swats.bio'],['fakecrime','https://fakecrime.bio'],['ez','https://e-z.bio']];
await Promise.all(targets.map(async ([id,url])=>{
 const page=await context.newPage();
 let error='';
 try {await page.goto(url,{waitUntil:'domcontentloaded',timeout:25000}); await page.waitForTimeout(2000);}catch(e){error=e.message;}
 await page.screenshot({path:new URL(id+'.png',dir).pathname.replace(/^\/(\w:)/,'$1'),fullPage:false}).catch(()=>{});
 const observation=await page.evaluate(()=>({url:location.href,title:document.title,text:document.body.innerText.slice(0,22000),scripts:[...document.scripts].map(s=>s.src).filter(Boolean),images:[...document.images].map(i=>({alt:i.alt,src:i.src})),styles:[...document.querySelectorAll('link[rel="stylesheet"]')].map(l=>l.href),fonts:[...new Set([...document.querySelectorAll('h1,h2,button,input')].map(e=>getComputedStyle(e).fontFamily))]})).catch(()=>({}));
 await writeFile(new URL(id+'-observation.json',dir),JSON.stringify({...observation,error},null,2));
 console.log(id+' '+JSON.stringify({url:observation.url,error}));
}));
console.log('CDP ready on http://127.0.0.1:9334; press enter to close owned browser');
process.stdin.resume();
process.stdin.once('data',async()=>{await browser.close();process.exit(0)});
