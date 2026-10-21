import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import PhoneDemo from './PhoneDemo.jsx';
import CaseStudy from './CaseStudy.jsx';
const ProductScene = lazy(() => import('./ProductScene.jsx'));

function SpiceMark({ className = '' }) {
  return <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 2v28M2 16h28M6.1 6.1l19.8 19.8M6.1 25.9 25.9 6.1" stroke="currentColor" strokeWidth="3"/><circle cx="16" cy="16" r="6" fill="currentColor"/></svg>;
}

export default function App() {
  const [mode,setMode] = useState('closed');
  const [detail,setDetail] = useState(false);
  const [replay,setReplay] = useState(0);
  const [dispensing,setDispensing] = useState(false);
  const [toast,setToast] = useState('');
  const timer = useRef();
  const notifyTimer = useRef();
  useEffect(() => () => { clearTimeout(timer.current); clearTimeout(notifyTimer.current); }, []);
  const tryDispense = () => {
    clearTimeout(timer.current);
    clearTimeout(notifyTimer.current);
    setDispensing(true);
    setToast('Sample spice blend ready in the collector.');
    timer.current = setTimeout(() => setDispensing(false),2400);
    notifyTimer.current = setTimeout(() => setToast(''),5000);
  };

  return <>
    <a href="#app-demo" className="skip-link">Skip to the app demo</a>
    <header className="site-nav">
      <a href="#top" className="brand" aria-label="MySpice home"><SpiceMark/><span>myspice<span className="brand-period">.</span></span></a>
      <nav aria-label="Page"><a href="#the-object">The object</a><a href="#app-demo">The experience</a><a href="#the-process">The process</a></nav>
      <a className="nav-cta" href="#app-demo">Try MySpice <span aria-hidden="true">↗</span></a>
    </header>

    <main>
      <section className="hero" id="top" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow"><span className="tiny-dot"/> A little less effort.</p>
          <h1 id="hero-title">Make room<br/>for <span>flavor.</span></h1>
          <p className="hero-description">Your spices, beautifully in reach.<br/>Your cooking, a little more effortless.</p>
          <a href="#the-object" className="text-link">Meet MySpice <span aria-hidden="true">↓</span></a>
        </div>
        <div className="hero-stage" id="the-object">
          <Suspense fallback={<div className="product-scene"><img className="scene-poster" src="/previews/closed.png" alt="Satin silver MySpice with the holder closed"/></div>}><ProductScene mode={mode} detail={detail} replay={replay} dispensing={dispensing}/></Suspense>
          <div className="stage-corner top-left"/><div className="stage-corner bottom-right"/>
          <div className="stage-topline"><span>MYSPICE / FORM STUDY 02</span><span>SATIN SILVER</span></div>
          <button className="replay-button" onClick={() => { setMode('closed'); setDetail(false); setReplay(n=>n+1); }} aria-label="Replay the cinematic product film">↻ <span>Replay film</span></button>
          <div className="product-controls" aria-label="Optional holder configuration">
            {[['closed','Closed'],['phone','With a phone'],['paper','With a recipe']].map(([id,label]) => <button key={id} aria-pressed={mode===id} className={mode===id?'active':''} onClick={()=>{setMode(id);setDetail(false);}}>{label}</button>)}
          </div>
          <p className="scene-instruction"><button className="detail-view-button" aria-pressed={detail} onClick={()=>setDetail(v=>!v)}>{detail?'Full product ↙':'Inspect details ↗'}</button><span>·</span>Drag to explore</p>
        </div>
        <div className="hero-bottom"><span>DESIGNED AROUND THE WAY YOU COOK.</span><a href="#app-demo">Explore the experience <span aria-hidden="true">↘</span></a><span>01 — 02</span></div>
      </section>

      <section className="app-section" id="app-demo" aria-labelledby="app-title">
        <div className="app-story">
          <p className="eyebrow dark"><span className="tiny-dot"/> A little more you.</p>
          <h2 id="app-title">Your week.<br/>Your taste.</h2>
          <p className="story-intro">A kitchen companion that starts by listening.</p>
          <p>What you enjoy. What you avoid. How much time you have. MySpice brings it together into a week that works for you.</p>
          <div className="experience-steps">
            <div><span>01</span><p>Tell us what matters.<small>A few questions to find your starting point.</small></p></div>
            <div><span>02</span><p>Make the week yours.<small>Meals, leftovers, and one shared grocery list.</small></p></div>
            <div><span>03</span><p>A little better each time.<small>Quick feedback helps refine what comes next.</small></p></div>
          </div>
          <p className="demo-caption"><span className="tiny-dot"/> Explore the small interactive preview <span aria-hidden="true">→</span></p>
        </div>
        <PhoneDemo onDispense={tryDispense}/>
      </section>
      <CaseStudy/>
      <footer className="site-footer"><a href="#top" className="brand"><SpiceMark/><span>myspice.</span></a><p>An exploration in connected cooking.<br/><span>Industrial design by Carlos Ocasio Milanes</span></p><a href="#top">Back to the object ↑</a></footer>
    </main>
    {toast && <div className="global-toast" role="status"><SpiceMark/>{toast}<small>Concept simulation</small></div>}
  </>;
}
