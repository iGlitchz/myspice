import React, { useState } from 'react';
import { CaseIcon } from './CaseStudyVisuals.jsx';
import CostSelect from './CostSelect.jsx';
import './cost-health.css';

const sources = {
  doordash: 'https://help.doordash.com/en-us/consumers/article/what-fees-do-i-pay',
  uber: 'https://help.uber.com/ubereats/restaurants/article/how-do-consumer-fees-work?nodeId=9e028052-ce30-4e57-b1cb-f36b8e0e9d82',
  study: 'https://doi.org/10.1371/journal.pmed.1002052',
  cdc: 'https://www.cdc.gov/salt/reduce-sodium-intake/index.html',
};
const money = (value, digits=2) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:digits,maximumFractionDigits:digits}).format(value);
const midwestCosts = [
  {value:'illinois',label:'Illinois',restaurant:20,home:3.85},
  {value:'indiana',label:'Indiana',restaurant:15,home:4.5},
  {value:'iowa',label:'Iowa',restaurant:15.5,home:4.27},
  {value:'kansas',label:'Kansas',restaurant:12,home:3.58},
];
const researchInputs = state => ({home:String(state.home),meal:String(state.restaurant),service:'3',delivery:'3',tip:'3',tax:'0',servings:'1'});
const mealOptions = [1,2,3,4,5,6,7].map(value=>({value,label:`${value} ${value===1?'meal':'meals'}`}));
const periodOptions = [{value:'day',label:'day'},{value:'week',label:'week'}];
const comparisonOptions = [{value:'delivery',label:'app delivery'},{value:'restaurant',label:'restaurant'}];
const inputFields = [
  ['home','Home ingredients / serving','$',0,100,.01],
  ['meal','Restaurant meal / serving','$',0,100,.01],
  ['service','Service fee / order','$',0,100,.25],
  ['delivery','Delivery fee / order','$',0,100,.25],
  ['tip','Optional tip / order','$',0,100,.25],
  ['tax','Additional restaurant tax','%',0,30,.1],
  ['servings','Servings per order','',1,12,1],
];

function Reference({href,children}) {
  return <a className="case-source" href={href} target="_blank" rel="noreferrer">{children} <span aria-hidden="true">↗</span></a>;
}

function HistoricalCosts() {
  return <details className="cost-archive"><summary>Midwest research <span>2024 comparison</span><b aria-hidden="true">+</b></summary><div>
    <div className="cost-table-wrap"><table className="cost-table"><caption>2024 project research. These state figures supply the chart’s home and restaurant starting costs.</caption><thead><tr><th scope="col">State</th><th scope="col">Eating out</th><th scope="col">At home</th><th scope="col">Difference</th></tr></thead><tbody>{midwestCosts.map(state=><tr key={state.value}><th scope="row">{state.label}</th><td>{money(state.restaurant)}</td><td>{money(state.home)}</td><td>{money(state.restaurant-state.home)}</td></tr>)}</tbody></table></div>
    <Reference href="/case-study/MySpice-process-book.pdf#page=9">Process book / p. 9</Reference>
  </div></details>;
}

export function CostComparison() {
  const [region,setRegion]=useState('illinois');
  const [inputs,setInputs]=useState(()=>researchInputs(midwestCosts[0]));
  const [meals,setMeals]=useState(1);
  const [period,setPeriod]=useState('day');
  const [baseline,setBaseline]=useState('delivery');
  const [view,setView]=useState('chart');
  const values=Object.fromEntries(inputFields.map(([key,, ,min,max])=>[key,Math.min(max,Math.max(min,Number(inputs[key])||0))]));
  const servings=Math.round(values.servings);
  const food=values.meal;
  const tax=food*values.tax/100;
  const extras=(values.service+values.delivery+values.tip)/servings;
  const restaurant=food+tax;
  const delivered=restaurant+extras;
  const difference=(baseline==='delivery'?delivered:restaurant)-values.home;
  const periodsPerYear=period==='day'?365:52;
  const annual=difference*meals*periodsPerYear;
  const maximum=Math.max(values.home,restaurant,delivered,1);
  const selectedRegion=midwestCosts.find(state=>state.value===region);
  const editedBase=values.home!==selectedRegion.home||food!==selectedRegion.restaurant||tax!==0;
  const changeRegion=value=>{
    const next=midwestCosts.find(state=>state.value===value);
    setRegion(value);
    setInputs(previous=>({...previous,home:String(next.home),meal:String(next.restaurant),tax:'0'}));
  };
  const rows=[
    {id:'home',name:'Cook at home',note:editedBase?'Edited ingredient cost':`${selectedRegion.label} · 2024 research`,total:values.home,parts:[['Ingredients',values.home,'home']]},
    {id:'restaurant',name:'Restaurant',note:editedBase?'Meal + additional tax':`${selectedRegion.label} · 2024 research`,total:restaurant,parts:[['Restaurant meal',food,'food'],['Additional tax',tax,'tax']]},
    {id:'delivery',name:'App delivery',note:'DoorDash / Uber Eats example',total:delivered,parts:[['Food',food,'food'],['Tax',tax,'tax'],['Service',values.service/servings,'service'],['Delivery',values.delivery/servings,'delivery'],['Tip',values.tip/servings,'tip']]},
  ];
  const normalize=(key,min,max)=>setInputs(previous=>({...previous,[key]:String(key==='servings'?Math.round(Math.min(max,Math.max(min,Number(previous[key])||min))):Math.min(max,Math.max(min,Number(previous[key])||0)))}));

  return <section className="case-economics case-pad case-visuals" id="cost-savings" aria-labelledby="cost-title">
    <div className="case-kicker"><span className="tiny-dot"/> THE COST OF CONVENIENCE <span>MIDWEST RESEARCH / 2024</span></div>
    <div className="case-section-heading" data-reveal><h2 id="cost-title">A little cooking.<br/><em>A lot of possibility.</em></h2></div>
    <div className="spending-comparison" data-reveal>
      <div className="spending-toolbar"><span>COST PER SERVING <small>Research in the Midwest</small></span><div role="group" aria-label="Meal cost comparison view"><button aria-pressed={view==='chart'} onClick={()=>setView('chart')}>Chart</button><button aria-pressed={view==='table'} onClick={()=>setView('table')}>Table</button></div></div>
      <div className="research-cost-location"><div><span>RESEARCH LOCATION</span><CostSelect label="Research location" value={region} options={midwestCosts} onChange={changeRegion}/></div><Reference href="/case-study/MySpice-process-book.pdf#page=9">Process book / p. 9</Reference></div>
      {view==='chart'?<div className="spending-chart">{rows.map(row=><div className={`spending-row spending-${row.id}`} key={row.id}><div className="spending-row-label"><strong>{row.name}</strong><span>{row.note}</span></div><div className="spending-track"><div style={{width:`${row.total/maximum*100}%`}}>{row.parts.map(([label,amount,tone])=><span className={`spend-${tone}`} key={label} style={{flexGrow:amount}} title={`${label}: ${money(amount)}`} />)}</div></div><strong className="spending-total">{money(row.total)}</strong></div>)}<div className="spending-legend">{[['home','Home ingredients'],['food','Restaurant meal'],['tax','Additional tax'],['service','Service'],['delivery','Delivery'],['tip','Tip']].map(([tone,label])=><span key={tone}><i className={`spend-${tone}`}/>{label}</span>)}</div></div>:<div className="spending-table-wrap"><table className="spending-table"><caption className="sr-only">Costs per serving in US dollars, starting with {selectedRegion.label} figures from the original 2024 Midwest research and editable delivery assumptions.</caption><thead><tr><th scope="col">Per serving</th><th scope="col">Home</th><th scope="col">Restaurant</th><th scope="col">Delivery</th></tr></thead><tbody>{[
        ['Meal / ingredients',values.home,food,food],['Additional tax',0,tax,tax],['Service fee',0,0,values.service/servings],['Delivery fee',0,0,values.delivery/servings],['Optional tip',0,0,values.tip/servings],['Total',values.home,restaurant,delivered],
      ].map(([label,...amounts])=><tr key={label}><th scope="row">{label}</th>{amounts.map((amount,i)=><td key={i}>{money(amount)}</td>)}</tr>)}</tbody></table></div>}
      <p className="example-caption">{editedBase&&'Home or restaurant costs have been edited. '}Delivery includes estimated fees and tips.</p>
      <details className="cost-assumptions"><summary>Adjust the costs <span aria-hidden="true">+</span></summary><div className="assumption-fields">{inputFields.map(([key,label,unit,min,max,step])=><label key={key}><span>{label}</span><div><span aria-hidden="true">{unit==='$'?'$':''}</span><input type="number" aria-label={label} inputMode="decimal" min={min} max={max} step={step} value={inputs[key]} onChange={e=>setInputs(p=>({...p,[key]:e.target.value}))} onBlur={()=>normalize(key,min,max)}/><span aria-hidden="true">{unit==='%'?'%':''}</span></div></label>)}</div><p>The original research does not itemize tax, so no additional tax is added by default. Any tax entered applies to the restaurant meal. Delivery fees and tips are split across servings. Utilities, equipment, travel, subscriptions, promotions and extra local fees are excluded.</p><button className="reset-example" onClick={()=>setInputs(researchInputs(selectedRegion))}>Reset to {selectedRegion.label} research</button></details>
    </div>
    <div className="savings-controls" role="group" aria-label="Savings scenario"><span>Swap</span><CostSelect label="Meals replaced" value={meals} options={mealOptions} onChange={setMeals}/><span>a</span><CostSelect label="Meal frequency" value={period} options={periodOptions} onChange={setPeriod}/><span>from</span><CostSelect label="Savings comparison" value={baseline} options={comparisonOptions} onChange={setBaseline}/><span>to home cooking.</span></div>
    <div className="savings-results" aria-live="polite"><div><span>{difference>=0?'SAVED PER MEAL':'MORE PER HOME MEAL'}</span><strong>{money(Math.abs(difference))}</strong><p>{editedBase?'With your edited costs.':`Based on ${selectedRegion.label} research`}{!editedBase&&baseline==='delivery'?' + delivery assumptions.':!editedBase?'.':''}</p></div><div><span>{annual>=0?'ESTIMATED YEARLY SAVINGS':'ESTIMATED YEARLY EXTRA COST'}</span><strong>{money(Math.abs(annual),0)}<em> / year</em></strong><p>{money(Math.abs(difference))} × {meals} {meals===1?'meal':'meals'} / {period} × {periodsPerYear} {period==='day'?'days':'weeks'}. Rounded to the nearest dollar.</p></div></div>
    <div className="delivery-evidence"><p><strong>Why the extra layers?</strong> DoorDash and Uber Eats describe delivery and service fees that vary by order, location or membership. Optional tips add to the checkout total.</p><div><Reference href={sources.doordash}>DoorDash fee guide</Reference><Reference href={sources.uber}>Uber Eats fee guide</Reference><span>Sources checked October 21, 2026.</span></div></div>
    <HistoricalCosts/>
  </section>;
}

export function HealthComparison() {
  return <section className="case-health case-pad case-visuals" id="health-benefits" aria-labelledby="health-title">
    <div className="case-kicker"><span className="tiny-dot"/> MORE THAN WHAT YOU SAVE <span>HOME COOKING & HEALTH</span></div>
    <div className="case-section-heading" data-reveal><h2 id="health-title">Know what<br/><em>goes into you.</em></h2><p>Cooking brings the decisions closer: the <em>ingredients,</em> the seasoning, and the portions on your plate.</p></div>
    <div className="health-benefits" data-reveal>
      <article><CaseIcon name="recipe"/><h3>See the <em>ingredients.</em></h3><p>Read labels and choose the oils, sauces and portions in your meal.</p></article>
      <article><CaseIcon name="dispenser"/><h3>Season with <em>intention.</em></h3><p>The CDC suggests herbs, spices and citrus as alternatives to some of the salt used in cooking.</p><Reference href={sources.cdc}>CDC / reducing sodium</Reference></article>
      <article><CaseIcon name="grocery"/><h3>Start with <em>the basics.</em></h3><p>Build meals around vegetables, fruit, beans and basic ingredients, with fewer ready-made sauces and mixes.</p><Reference href={sources.cdc}>CDC / choices at home</Reference></article>
    </div>
    <div className="health-evidence" data-reveal>
      <div className="health-evidence-copy"><span className="case-label">HEALTH OVER TIME</span><h3>More home cooking.<br/><em>Lower diabetes risk.</em></h3><p>Researchers followed <strong>99,727 US health professionals</strong> for up to 26 years. Eating more home-prepared meals was associated with a lower risk of developing <strong>type 2 diabetes and obesity.</strong></p><Reference href={sources.study}>Zong et al. / PLOS Medicine, 2016</Reference></div>
      <div className="health-data"><table className="health-study-table health-outcomes-table"><caption className="sr-only">Adjusted relative health risks comparing 11–14 with 0–6 home-prepared lunches and dinners per week, from two prospective cohort studies.</caption><thead><tr><th scope="col">Health outcome</th><th scope="col"><b>0–6</b><small>home-prepared<br/>meals / week</small></th><th scope="col"><b>11–14</b><small>home-prepared<br/>meals / week</small></th></tr></thead><tbody>{['Developing type 2 diabetes','Developing obesity'].map(label=><tr key={label}><th scope="row">{label}</th><td><span className="health-reference">Comparison<br/>group</span></td><td><strong>14%</strong><small>lower relative risk</small></td></tr>)}</tbody></table><p>Counts include lunches and dinners prepared at home. Percentages are relative comparisons, not percentage-point differences. The obesity analysis included people without obesity at the start.</p></div>
    </div>
    <p className="health-context">These associations do not prove cause and effect. Weight differences partly explained the diabetes finding. The participants were health professionals, and the study did not test MySpice.</p>
  </section>;
}
