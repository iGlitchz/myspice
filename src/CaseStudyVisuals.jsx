import React, { useEffect, useRef, useState } from 'react';
import './case-visuals.css';

const book = '/case-study/MySpice-process-book.pdf';
export function CaseIcon({ name, className = '' }) {
  return <svg className={`case-symbol ${className}`} viewBox="0 0 64 64" aria-hidden="true" focusable="false"><use href={`/case-study/graphics/symbols.svg#${name}`}/></svg>;
}
function BookLink({ page, children }) {
  return <a className="case-source" href={`${book}#page=${page}`} target="_blank" rel="noreferrer">{children}<span aria-hidden="true">↗</span></a>;
}

const findings = [
  ['counter', 'Crowded counters', 'Tools and ingredients compete for room.'],
  ['clock', 'Limited time', 'Cooking has to fit around the day.'],
  ['touch', 'Messy hands', 'Handling devices spreads the mess.'],
  ['recipe', 'Recipe juggling', 'A phone needs a place within reach.'],
  ['cleanup', 'Cleanup fatigue', 'Dishes can discourage cooking altogether.'],
  ['storage', 'Storage pressure', 'More appliances need more space.'],
];

export function ResearchFindings() {
  return <section className="case-research case-pad case-visuals" id="research" aria-labelledby="research-title">
    <div className="case-kicker"><span className="tiny-dot"/> 01 / RESEARCH FINDINGS</div>
    <div className="case-section-heading visual-heading" data-reveal><h2 id="research-title">Friction in<br/><em>everyday cooking.</em></h2><p>Six recurring themes from the desk research and interviews.</p></div>
    <div className="finding-grid" data-reveal>{findings.map(([icon,title,description],i)=><article key={icon}><div className="finding-art"><CaseIcon name={icon}/><span>0{i+1}</span></div><h3>{title}</h3><p>{description}</p></article>)}</div>
    <div className="visual-source-row"><span>QUALITATIVE THEMES / ORIGINAL PROJECT RESEARCH</span><BookLink page={5}>Research & interviews / pp. 5–11</BookLink></div>
    <div className="method-strip" data-reveal><span className="case-label">HOW THE DIRECTION TOOK SHAPE</span><ol>{[['storage','Review the context'],['interview','Listen to cooks'],['recipe','Map the routine'],['prototype','Make & refine']].map(([icon,label],i)=><li key={label}><CaseIcon name={icon}/><span><small>0{i+1}</small>{label}</span><b aria-hidden="true">→</b></li>)}</ol><BookLink page={3}>Methodology / p. 3</BookLink></div>
  </section>;
}

export function TargetMarket() {
  const people = [
    ['budget','01','Budget-conscious cooks','A practical alternative to another takeout order.','Value / Everyday meals'],
    ['family','02','Busy parents','Less coordination around an already busy day.','Time / Family routines'],
    ['routine','03','Routine seekers','A clearer path from meal planning to cooking.','Simplicity / Preparation'],
  ];
  return <section className="case-audience case-pad case-visuals" id="target-market" aria-labelledby="audience-title">
    <div className="case-kicker"><span className="tiny-dot"/> 02 / WHO IT IS FOR</div>
    <div className="case-section-heading visual-heading" data-reveal><h2 id="audience-title">Different days.<br/><em>A shared need.</em></h2><p>Three groups identified in the original project, all looking for an easier way to cook.</p></div>
    <div className="audience-grid" data-reveal>{people.map(([icon,n,title,need,traits])=><article key={n}><div className="audience-art"><CaseIcon name={icon}/><span>{n}</span></div><h3>{title}</h3><p>{need}</p><span className="audience-traits">{traits}</span></article>)}</div>
    <div className="visual-source-row"><span>TARGET AUDIENCE / DESIGN OPPORTUNITY</span><BookLink page={13}>Who? / p. 13</BookLink></div>
  </section>;
}

const journey = [
  {icon:'preferences',title:'Set preferences',action:'Choose foods to avoid and the preferences that matter to you, from high protein to high fiber. Add your budget, household size and cooking time. Revisit these choices whenever your routine changes.',benefit:'A personal starting point, with the freedom to edit meals and ingredients as you go.'},
  {icon:'calendar',title:'Shape the week',action:'Review a week of meals, adjust portions and swap recipes. Decide which days to cook and where leftovers fit, then edit any meal to suit your plans.',benefit:'A flexible plan that follows your schedule, with recipe changes carried through to the grocery list.'},
  {icon:'grocery',title:'Arrange groceries',action:'Your chosen meals become one streamlined grocery list. Ingredient quantities come together across recipes, ready to review and edit in one place.',benefit:'Planned: connect the list to a grocery partner, review the basket and order for store pickup. Then just collect your groceries when they are ready.'},
  {icon:'prep',title:'Get ready',action:'Set out the ingredients and tools listed in the recipe. Follow along on your phone or a printed page, using the optional support when you want it within reach.',benefit:'A clear worktop and a recipe that stays easy to follow while your hands are busy.'},
  {icon:'dispenser',title:'Start cooking',action:'Follow the recipe and select Dispense to collect the spice blend. Lift the removable collector to pour, and use gestures to navigate without touching your device with food-covered hands.',benefit:'Less handling between raw ingredients, spice containers and your screen.'},
  {icon:'feedback',title:'Refine next week',action:'Tell MySpice what missed the mark, what you enjoyed and what you loved. Quick meal feedback and occasional preference questions help shape the next set of recommendations.',benefit:'A curated meal plan that becomes more familiar with your tastes through use.'},
];

function FeedbackThumb({down=false,double=false}) {
  const hand=<><path d="M8 10 12 3c.5-1 2-.5 2 1v5h5c1.2 0 2 1 1.7 2.2l-1.5 7.1c-.2 1-1 1.7-2 1.7H8V10ZM3 10h5v10H3Z"/></>;
  return <svg viewBox={double?'0 0 44 28':'0 0 28 28'} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><g transform={down?'translate(25 25) rotate(180)':'translate(2 3)'}>{hand}</g>{double&&<g transform="translate(21 3)">{hand}</g>}</svg>;
}

export function UserJourney() {
  const [selected,setSelected] = useState(0);
  const [paused,setPaused] = useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [visible,setVisible] = useState(false);
  const map=useRef(null);
  const position=useRef({index:0,elapsed:0});
  const duration=9000;
  useEffect(()=>{
    const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{threshold:.25});
    observer.observe(map.current);
    return()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    if(!visible||paused) return;
    let frame;
    let previous=performance.now();
    const tick=now=>{
      const delta=Math.min(now-previous,100);
      previous=now;
      if(!document.hidden){
        position.current.elapsed+=delta;
        if(position.current.elapsed>=duration){
          position.current.elapsed=0;
          position.current.index=(position.current.index+1)%journey.length;
          setSelected(position.current.index);
        }
        map.current?.style.setProperty('--journey-time',position.current.index+position.current.elapsed/duration);
      }
      frame=requestAnimationFrame(tick);
    };
    frame=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(frame);
  },[visible,paused]);
  const choose=index=>{
    position.current={index,elapsed:0};
    map.current?.style.setProperty('--journey-time',index);
    setSelected(index);
  };
  const stage=journey[selected];
  return <section className="case-user-journey case-pad case-visuals" id="user-journey" aria-labelledby="journey-title">
    <div className="case-kicker"><span className="tiny-dot"/> 03 / THE MYSPICE JOURNEY <span>INTENDED EXPERIENCE</span></div>
    <div className="case-section-heading visual-heading" data-reveal><h2 id="journey-title">From the first question<br/>to the <em>next meal.</em></h2><p>Preferences, planning, groceries and cooking. See how each part of the routine connects.</p></div>
    <div className="journey-playback"><span>0{selected+1} / 06 <span>· {paused?'EXPLORE AT YOUR PACE':'FOLLOW THE JOURNEY'}</span></span><button type="button" onClick={()=>setPaused(value=>!value)} aria-label={paused?'Play journey':'Pause journey'}><span aria-hidden="true">{paused?'▷':'Ⅱ'}</span>{paused?'Play':'Pause'}</button></div>
    <div className="journey-map journey-autoplay" ref={map} data-reveal><div className="sr-only" role="progressbar" aria-label="MySpice journey progress" aria-valuemin={0} aria-valuemax={6} aria-valuenow={selected+1} aria-valuetext={`Step ${selected+1} of 6: ${stage.title}`}/><div className="journey-stages" role="group" aria-label="MySpice journey stages">{journey.map((item,i)=><button key={item.icon} style={{'--stage-index':i}} onClick={()=>choose(i)} aria-pressed={selected===i} aria-controls="journey-detail"><span className="journey-icon"><CaseIcon name={item.icon}/></span><span className="journey-marker"><i/><small>0{i+1}</small></span><strong>{item.title}</strong></button>)}</div><div className="journey-detail" id="journey-detail" aria-live={paused?'polite':'off'}><span className="journey-detail-number">0{selected+1}</span><dl key={selected}><div><dt>THE STEP</dt><dd>{stage.action}</dd></div><div><dt>{selected===2?'THE GROCERY CONNECTION':'WHY IT HELPS'}</dt><dd>{stage.benefit}</dd></div></dl></div></div>
    <div className="journey-loop"><p>Meal feedback informs<br/><em>the next week.</em></p><div className="journey-feedback-scale" aria-label="Meal feedback: less like this, more like this, love this"><span><FeedbackThumb down/><small>Less like this</small></span><span><FeedbackThumb/><small>More like this</small></span><span><FeedbackThumb double/><small>Love this</small></span></div><a className="case-text-link" href="#app-demo">Try the app preview <span aria-hidden="true">↗</span></a></div>
  </section>;
}
