import React, { useState } from 'react';
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
    <div className="case-section-heading visual-heading" data-reveal><h2 id="research-title">The friction<br/>in the everyday.</h2><p>Six recurring themes from the desk research and interviews.</p></div>
    <div className="finding-grid" data-reveal>{findings.map(([icon,title,description],i)=><article key={icon}><div className="finding-art"><CaseIcon name={icon}/><span>0{i+1}</span></div><h3>{title}</h3><p>{description}</p></article>)}</div>
    <div className="visual-source-row"><span>QUALITATIVE THEMES / ORIGINAL PROJECT RESEARCH</span><BookLink page={5}>Research & interviews / pp. 5–11</BookLink></div>
    <div className="method-strip" data-reveal><span className="case-label">HOW THE DIRECTION TOOK SHAPE</span><ol>{[['storage','Review the context'],['interview','Listen to cooks'],['recipe','Map the routine'],['prototype','Make & refine']].map(([icon,label],i)=><li key={label}><CaseIcon name={icon}/><span><small>0{i+1}</small>{label}</span><b aria-hidden="true">→</b></li>)}</ol><BookLink page={3}>Methodology / p. 3</BookLink></div>
  </section>;
}

const costs = [
  { state: 'Illinois', out: 20, home: 3.85 },
  { state: 'Indiana', out: 15, home: 4.50 },
  { state: 'Iowa', out: 15.50, home: 4.27 },
  { state: 'Kansas', out: 12, home: 3.58 },
];
const dollars = value => `$${value.toFixed(2)}`;

export function CostComparison() {
  const [view, setView] = useState('chart');
  return <section className="case-cost case-pad case-visuals" aria-labelledby="cost-title">
    <div className="cost-story" data-reveal><span className="case-label">THE COST OF CONVENIENCE</span><CaseIcon name="budget"/><h2 id="cost-title">A reason to<br/>cook at home.</h2><p>The original research compared eating out with preparing food at home.</p><BookLink page={9}>Cost comparison / p. 9</BookLink></div>
    <div className="cost-comparison" data-reveal>
      <div className="cost-toolbar"><span>MIDWEST COMPARISON <small>USD / ORIGINAL RESEARCH</small></span><div role="group" aria-label="Cost comparison view"><button aria-pressed={view==='chart'} onClick={()=>setView('chart')}>Chart</button><button aria-pressed={view==='table'} onClick={()=>setView('table')}>Table</button></div></div>
      {view==='chart' ? <div className="cost-chart"><div className="cost-legend"><span><i className="out-key"/>Eating out</span><span><i className="home-key"/>At home</span><span>Difference</span></div>{costs.map(row=><div className="cost-chart-row" key={row.state}><span className="cost-state">{row.state}</span><div className="cost-bars"><div><span className="out-bar" style={{width:`${row.out/20*100}%`}}/><span>{dollars(row.out)}</span></div><div><span className="home-bar" style={{width:`${row.home/20*100}%`}}/><span>{dollars(row.home)}</span></div></div><strong>{dollars(row.out-row.home)}<small>LESS AT HOME</small></strong></div>)}</div> : <div className="cost-table-wrap"><table className="cost-table"><caption className="sr-only">Historical cost comparison from the MySpice process book, in US dollars.</caption><thead><tr><th scope="col">State</th><th scope="col">Eating out</th><th scope="col">At home</th><th scope="col">Difference</th></tr></thead><tbody>{costs.map(row=><tr key={row.state}><th scope="row">{row.state}</th><td>{dollars(row.out)}</td><td>{dollars(row.home)}</td><td>{dollars(row.out-row.home)}</td></tr>)}</tbody></table></div>}
      <p className="cost-caption">Historical figures reproduced from the 2024 process book.</p>
    </div>
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
    <div className="case-section-heading visual-heading" data-reveal><h2 id="audience-title">Different days.<br/>A shared need.</h2><p>Three groups identified in the original project, all looking for an easier way to cook.</p></div>
    <div className="audience-grid" data-reveal>{people.map(([icon,n,title,need,traits])=><article key={n}><div className="audience-art"><CaseIcon name={icon}/><span>{n}</span></div><h3>{title}</h3><p>{need}</p><span className="audience-traits">{traits}</span></article>)}</div>
    <div className="visual-source-row"><span>TARGET AUDIENCE / DESIGN OPPORTUNITY</span><BookLink page={13}>Who? / p. 13</BookLink></div>
  </section>;
}

const journey = [
  {icon:'preferences',title:'Set preferences',action:'Share allergies, budget and available time.',touchpoint:'Preference survey',benefit:'A starting point that fits real constraints.'},
  {icon:'calendar',title:'Shape the week',action:'Choose meals, portions and leftover days.',touchpoint:'Editable meal plan',benefit:'Know what is happening before the week begins.'},
  {icon:'grocery',title:'Shop with a list',action:'Check the pantry and remove what is already there.',touchpoint:'Shared grocery list',benefit:'One list built from the chosen meals.'},
  {icon:'prep',title:'Get ready',action:'Prepare ingredients and set out the recipe.',touchpoint:'Phone or printed recipe',benefit:'Clear instructions with space to work.'},
  {icon:'dispenser',title:'Start cooking',action:'Follow the steps and collect a spice blend.',touchpoint:'Recipe + dispenser',benefit:'Keep ingredients and instructions together.'},
  {icon:'feedback',title:'Refine the next',action:'Rate the meal and update preferences.',touchpoint:'Lightweight feedback',benefit:'A week that gradually fits better.'},
];

export function UserJourney() {
  const [selected,setSelected] = useState(0);
  const stage=journey[selected];
  return <section className="case-user-journey case-pad case-visuals" id="user-journey" aria-labelledby="journey-title">
    <div className="case-kicker"><span className="tiny-dot"/> 03 / THE MYSPICE JOURNEY <span>INTENDED EXPERIENCE</span></div>
    <div className="case-section-heading visual-heading" data-reveal><h2 id="journey-title">From the first question<br/>to the next meal.</h2><p>Explore a week with MySpice.<br/>Select a moment to see how it connects.</p></div>
    <div className="journey-map" data-reveal><div className="journey-stages" role="group" aria-label="MySpice journey stages">{journey.map((item,i)=><button key={item.icon} onClick={()=>setSelected(i)} aria-pressed={selected===i} aria-controls="journey-detail"><CaseIcon name={item.icon}/><span className="journey-marker"><i/><small>0{i+1}</small></span><strong>{item.title}</strong></button>)}</div><div className="journey-detail" id="journey-detail" aria-live="polite"><span className="journey-detail-number">0{selected+1}</span><dl><div><dt>THE USER</dt><dd>{stage.action}</dd></div><div><dt>THE TOUCHPOINT</dt><dd>{stage.touchpoint}</dd></div><div><dt>THE INTENT</dt><dd>{stage.benefit}</dd></div></dl></div></div>
    <div className="journey-loop"><CaseIcon name="feedback"/><span>Meal feedback informs the next week.</span><a className="case-text-link" href="#app-demo">Try the app preview <span aria-hidden="true">↗</span></a></div>
  </section>;
}
