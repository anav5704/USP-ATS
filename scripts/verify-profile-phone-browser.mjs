import { createRequire } from 'node:module';
import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { existsSync } from 'node:fs';
import http from 'node:http';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const esbuild = createRequire(require.resolve('tsx/package.json'))('esbuild');
const scratch = await mkdtemp(path.join(tmpdir(), 'usp-phone-browser-'));
const entry = `
import React, {useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {FormProvider, useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {GeneralFields} from './components/profile/general-fields';
import {profileInputSchema} from './lib/profile/profile-schema';
function Harness() {
 const edit = new URLSearchParams(location.search).get('edit');
 const form = useForm({resolver:zodResolver(profileInputSchema),mode:'onChange',defaultValues:{phone:edit==='legacy'?'+6851234567':edit?'+6790123456':'',campuses:edit?['Laucala Campus']:[],bio:'',skills:['Python'],degrees:[{name:'BSc',gpa:3,documentType:'transcript',document:{name:'transcript.pdf',stored:'3f2504e0-4f89-41d3-9a0c-0305e82c3301.pdf',type:'application/pdf',size:100}}],certificates:[],socialLinks:[],projectLinks:[]}});
 useEffect(()=>{window.values=()=>form.getValues(); window.submit=async()=>{let saved;await form.handleSubmit(values=>{saved=values})();return saved??null}; window.ready=true},[]);
 return <main style={{maxWidth:'960px',margin:'auto',padding:'16px',width:'100%',boxSizing:'border-box'}}><FormProvider {...form}><GeneralFields user={{name:'Test Member',email:'test@example.com'}}/></FormProvider></main>
}
createRoot(document.getElementById('root')).render(<Harness/>);`;
const result = await esbuild.build({ stdin: { contents: entry, resolveDir: process.cwd(), sourcefile: 'phone-harness.tsx', loader: 'tsx' }, bundle: true, write: false, platform: 'browser', format: 'iife', define: { 'process.env.NODE_ENV': '"production"' }, tsconfig: path.join(process.cwd(), 'tsconfig.json') });
const cssDir = path.join(process.cwd(), '.next/static/chunks');
const css = (await Promise.all((await readdir(cssDir)).filter(x => x.endsWith('.css')).map(x => readFile(path.join(cssDir, x), 'utf8')))).join('\n');
const server = http.createServer((req, res) => {
    if (req.url === '/bundle.js') {
        res.setHeader('Content-Type', 'text/javascript');
        res.end(result.outputFiles[0].contents);
    }
    else if (req.url === '/styles.css') {
        res.setHeader('Content-Type', 'text/css');
        res.end(css);
    }
    else {
        res.setHeader('Content-Type', 'text/html');
        res.end('<!doctype html><html data-theme="light"><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/styles.css"></head><body style="overflow:auto"><div id="root"></div><script src="/bundle.js"></script></body></html>');
    }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browserPath = process.env.PHONE_TEST_BROWSER ?? [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/chromium', '/usr/bin/google-chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(existsSync);
if (!browserPath) {
    server.close();
    throw new Error('Set PHONE_TEST_BROWSER to a Chromium browser executable.');
}
const chrome = spawn(browserPath, ['--headless=new', '--disable-gpu', '--no-proxy-server', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${path.join(scratch, 'chrome')}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const delay = ms => new Promise(r => setTimeout(r, ms));
let ws;
try {
    let pages;
    for (let i = 0; i < 80; i++) {
        try {
            const port = (await readFile(path.join(scratch, 'chrome', 'DevToolsActivePort'), 'utf8')).split('\n')[0];
            pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
            if (pages.some(p => p.type === 'page'))
                break;
        }
        catch { }
        await delay(100);
    }
    ws = new WebSocket(pages.find(p => p.type === 'page').webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener('open', r, { once: true }));
    let id = 0;
    const pending = new Map();
    ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.method === 'Runtime.exceptionThrown')
        console.log(JSON.stringify(m.params)); if (m.id) {
        const p = pending.get(m.id);
        pending.delete(m.id);
            if (m.error) p.reject(m.error);
            else p.resolve(m.result);
    } });
    const cdp = (method, params = {}) => new Promise((resolve, reject) => { const key = ++id; pending.set(key, { resolve, reject }); ws.send(JSON.stringify({ id: key, method, params })); });
    const evaluate = async (expression) => { const r = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails)
        throw Error(JSON.stringify(r.exceptionDetails)); return r.result.value; };
    const waitFor = async (expression) => { for (let i = 0; i < 100; i++) {
        if (await evaluate(expression))
            return;
        await delay(50);
    } console.log(await evaluate('JSON.stringify({url:location.href,body:document.body?.innerHTML?.slice(0,2000),ready:document.readyState})')); throw Error('Timed out: ' + expression); };
    const navigate = async (suffix) => { const n = await cdp('Page.navigate', { url: origin + suffix }); if (n.errorText)
        throw Error(JSON.stringify(n)); await waitFor('window.ready === true'); };
    const selectCampus = async (campus) => {
        await evaluate(`document.querySelector('[aria-label="Select your campus or centre"]').click()`);
        await waitFor(`Array.from(document.querySelectorAll('[role="option"]')).some(x=>x.textContent.includes(${JSON.stringify(campus)}))`);
        await evaluate(`Array.from(document.querySelectorAll('[role="option"]')).find(x=>x.textContent.includes(${JSON.stringify(campus)})).click()`);
        await waitFor(`window.values().campuses[0]===${JSON.stringify(campus)}`);
    };
    const inputText = async (text) => { await evaluate('document.getElementById("phone").focus()'); await cdp('Input.insertText', { text }); await delay(70); };
    await cdp('Page.enable');
    await cdp('Runtime.enable');
    const layouts = [];
    for (const mode of ['', '?edit=valid', '?edit=legacy']) {
        await navigate('/' + mode);
        if (!mode) {
            assert.equal(await evaluate('document.getElementById("phone").disabled'), true);
            assert.equal(await evaluate('!!document.getElementById("phone-prefix")'), false);
            await selectCampus('Laucala Campus');
        }
        for (const theme of ['light', 'dark'])
            for (const width of [1440, 1366, 1280, 1024, 834, 768, 430, 390, 375]) {
                await cdp('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
                await evaluate(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`);
                await delay(20);
                const layout = await evaluate(`(()=>{const p=document.getElementById('phone'),r=p.getBoundingClientRect(),prefix=document.getElementById('phone-prefix').getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth,inputWidth:r.width,prefixWidth:prefix.width,right:r.right,viewport:innerWidth,label:document.querySelector('label[for="phone"]')?.textContent,errorAssociated:!document.getElementById('phone-error')||p.getAttribute('aria-describedby').includes('phone-error')}})()`);
                assert.equal(layout.overflow, false, JSON.stringify({ mode, theme, width, layout }));
                assert.ok(layout.inputWidth > 80);
                assert.ok(layout.prefixWidth > 30);
                assert.ok(layout.right <= layout.viewport);
                assert.equal(layout.label, 'Phone number (optional)');
                assert.equal(layout.errorAssociated, true);
                layouts.push({ mode: mode || 'onboarding', theme, width, ...layout });
            }
    }
    await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 900, deviceScaleFactor: 1, mobile: true });
    await navigate('/');
    await selectCampus('Laucala Campus');
    assert.equal(await evaluate('document.getElementById("phone").required'), false);
    assert.equal(await evaluate('window.submit().then(values => values?.phone)'), '');
    assert.equal(await evaluate('!!document.getElementById("phone-error")'), false);
    await selectCampus('Samoa Campus');
    assert.equal(await evaluate('window.submit().then(values => values?.phone)'), '');
    await selectCampus('Laucala Campus');
    await inputText('123');
    assert.equal(await evaluate('!!document.getElementById("phone-error")'), true);
    await inputText('4567');
    assert.equal(await evaluate('window.values().phone'), '+6791234567');
    assert.equal(await evaluate('!!document.getElementById("phone-error")'), false);
    await inputText('8');
    assert.equal(await evaluate('window.values().phone'), '+6791234567');
    await selectCampus('Lautoka Campus');
    assert.equal(await evaluate('window.values().phone'), '+6791234567');
    await selectCampus('Samoa Campus');
    assert.equal(await evaluate('window.values().phone'), '');
    assert.ok((await evaluate('document.getElementById("phone-prefix").textContent')).includes('+685'));
    await inputText('12a');
    assert.equal(await evaluate('window.values().phone'), '');
    assert.ok((await evaluate('document.getElementById("phone-error").textContent')).includes('digits only'));
    await inputText('12345');
    assert.equal(await evaluate('window.values().phone'), '+68512345');
    assert.equal(await evaluate('!!document.getElementById("phone-error")'), false);
    await navigate('/?edit=valid');
    assert.equal(await evaluate('document.getElementById("phone").value'), '0123456');
    await evaluate('document.getElementById("phone").focus();document.getElementById("phone").select()');
    await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 });
    await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 });
    await waitFor('window.values().phone === ""');
    assert.equal(await evaluate('window.submit().then(values => values?.phone)'), '');
    assert.equal(await evaluate('!!document.getElementById("phone-error")'), false);
    await inputText('0123456');
    assert.equal(await evaluate('window.submit().then(values => values?.phone)'), '+6790123456');
    await selectCampus('Labasa Campus');
    assert.equal(await evaluate('window.values().phone'), '+6790123456');
    await selectCampus('Samoa Campus');
    assert.equal(await evaluate('window.values().phone'), '');
    await navigate('/?edit=legacy');
    assert.equal(await evaluate('window.values().phone'), '+6851234567');
    assert.ok(await evaluate('!!document.getElementById("phone-error")'));
    assert.equal(await evaluate('document.getElementById("phone").value'), '');
    await inputText('0123456');
    assert.equal(await evaluate('window.values().phone'), '+6790123456');
    assert.equal(await evaluate('!!document.getElementById("phone-error")'), false);
    await cdp('Page.captureScreenshot', { format: 'png' }).then(r => writeFile(path.join(scratch, 'phone-390.png'), Buffer.from(r.data, 'base64')));
    await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    assert.equal(await evaluate('document.activeElement.id'), 'bio', 'Tab advances past the locked prefix to the next field');
    await writeFile(path.join(scratch, 'results.json'), JSON.stringify(layouts, null, 2));
    console.log(JSON.stringify({ passed: true, layoutChecks: layouts.length, widths: [1440, 1366, 1280, 1024, 834, 768, 430, 390, 375], themes: ['light', 'dark'], scratch }));
}
finally {
    ws?.close();
    chrome.kill();
    server.close();
}
