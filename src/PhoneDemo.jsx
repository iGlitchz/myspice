import React, { useEffect, useMemo, useRef, useState } from 'react';
import Wordmark from './Wordmark.jsx';
import { RECIPES, DEFAULT_PREFS, AVOID_OPTIONS, NUTRITION_PREFERENCES, normalizePreferences, createPlan, eligibleRecipes, groceriesFor, quantity } from './demoData.js';

function Icon({name,...props}) {
  const shapes = {
    home:<><path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/></>,
    survey:<><path d="M5 5h14v16H5Z"/><path d="M9 3h6v4H9ZM8 12h8M8 16h5"/></>,
    plan:<><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18M7 15h2m3 0h2m3 0h1M7 18h2m3 0h2"/></>,
    grocery:<><path d="M5 8h14l2 13H3ZM8 9V6a4 4 0 0 1 8 0v3"/></>,
    arrow:<path d="M4 12h16m-6-6 6 6-6 6"/>,
    check:<path d="m5 12 4 4L19 6"/>,
    clock:<><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></>,
    plus:<path d="M12 4v16M4 12h16"/>,
    back:<path d="M20 12H4m6-6-6 6 6 6"/>,
    spark:<><path d="m12 2 2.7 7.3L22 12l-7.3 2.7L12 22l-2.7-7.3L2 12l7.3-2.7Z"/></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{shapes[name]||shapes.spark}</svg>;
}

function Dish({ recipe, large=false }) {
  return <div className={`dish-art ${large?'large':''}`} style={{'--dish-color':recipe.color}} aria-hidden="true"><div className="dish-plate"><i/><i/><i/><i/><i/><i/><i/><i/><i/></div><span>{recipe.plant?'PLANT GOODNESS':'EVERYDAY FAVORITE'}</span></div>;
}

function readSaved() {
  try {
    const data = JSON.parse(localStorage.getItem('myspice-study-v1'));
    if (!data || ![1,2].includes(data.version)) return null;
    // Accept only the current fixture-backed plan. Older/invalid data starts fresh.
    if (data.plan && (!Array.isArray(data.plan) || data.plan.length !== 7 || data.plan.some(d=>!RECIPES.some(r=>r.id===d.dinner)||!RECIPES.some(r=>r.id===d.lunch)))) return null;
    return data;
  } catch { return null; }
}

export default function PhoneDemo({onDispense,recipePreview=0}) {
  const [saved] = useState(readSaved);
  const [tab,setTab] = useState('survey');
  const [prefs,setPrefs] = useState(()=>normalizePreferences(saved?.prefs||DEFAULT_PREFS));
  const [draft,setDraft] = useState(()=>normalizePreferences(saved?.prefs||DEFAULT_PREFS));
  const [plan,setPlan] = useState(saved?.plan||null);
  const [ratings,setRatings] = useState(saved?.ratings||{});
  const [tasteNotes,setTasteNotes] = useState(saved?.tasteNotes||{});
  const [recipes,setRecipes] = useState(saved?.recipes||RECIPES);
  const [checked,setChecked] = useState(saved?.checked||{});
  const [customItems,setCustomItems] = useState(saved?.customItems||[]);
  const [step,setStep] = useState(0);
  const [busy,setBusy] = useState(false);
  const [progress,setProgress] = useState(0);
  const [error,setError] = useState('');
  const [selected,setSelected] = useState(null);
  const [servings,setServings] = useState(prefs.people);
  const [editing,setEditing] = useState(false);
  const [copyStatus,setCopyStatus] = useState('');
  const [followUp,setFollowUp] = useState(null);
  const [message,setMessage] = useState('');
  const [newItem,setNewItem] = useState('');
  const [itemEdits,setItemEdits] = useState(saved?.itemEdits||{});
  const [editingList,setEditingList] = useState(false);
  const [editDraft,setEditDraft] = useState(null);
  const [breakfastNote,setBreakfastNote] = useState('Seasonal fruit · keep it simple');
  const scroller = useRef(null);
  const timers = useRef([]);
  const previewSeen=useRef(0);
  const groceryItems = useMemo(()=>[...groceriesFor(plan,prefs,recipes),...customItems].map(item=>({...item,name:itemEdits[item.key]||item.name})),[plan,prefs,recipes,customItems,itemEdits]);
  const estimate = groceryItems.filter(i=>!checked[i.key]).reduce((sum,i)=>sum+i.price,0);
  const available = useMemo(()=>eligibleRecipes(prefs,ratings,recipes),[prefs,ratings,recipes]);
  const selectedRecipe = recipes.find(r=>r.id===selected);

  useEffect(() => {
    try { localStorage.setItem('myspice-study-v1',JSON.stringify({version:2,prefs,plan,ratings,tasteNotes,recipes,checked,customItems,itemEdits})); } catch { /* The preview also works without browser storage. */ }
  },[prefs,plan,ratings,tasteNotes,recipes,checked,customItems,itemEdits]);
  useEffect(()=>{scroller.current?.scrollTo({top:0,behavior:'instant'});},[tab,selected,step,busy]);
  useEffect(()=>()=>timers.current.forEach(clearTimeout),[]);
  useEffect(()=>{
    if(recipePreview<=previewSeen.current) return;
    previewSeen.current=recipePreview;
    const recipe=eligibleRecipes(prefs,{},recipes)[0];
    if(recipe){setTab('home');setSelected(recipe.id);setServings(prefs.people);setEditing(false);setMessage('');}
  },[recipePreview,prefs,recipes]);

  const go = id => { setTab(id); setSelected(null); setEditing(false); setFollowUp(null); setMessage(''); };
  const openRecipe = id => { setSelected(id); setServings(prefs.people); setEditing(false); setMessage(''); };
  const setChoice = (key,value) => setDraft(p=>({...p,[key]:value}));
  const avoid = value => setDraft(p=>({...p,avoidAnswered:true,avoid:value==='None'?[]:p.avoid.includes(value)?p.avoid.filter(v=>v!==value):[...p.avoid,value]}));
  const preference = value => setDraft(p=>({...p,preferences:p.preferences.includes(value)?p.preferences.filter(item=>item!==value):[...p.preferences,value]}));

  const generate = () => {
    const next = createPlan(draft,ratings,recipes);
    if (!next) { setError('No sample recipes match every choice yet. Try a longer cooking time or revisit a skipped meal.'); return; }
    setError(''); setBusy(true); setProgress(0);
    timers.current.push(setTimeout(()=>setProgress(1),600));
    timers.current.push(setTimeout(()=>setProgress(2),1250));
    timers.current.push(setTimeout(()=>{
      setPrefs({...draft}); setPlan(next); setChecked({}); setBusy(false); setTab('plan'); setStep(0); setSelected(null);
    },2000));
  };

  const swapBatch = index => {
    const current = plan[index];
    const alternatives = eligibleRecipes(prefs,ratings,recipes).filter(r=>r.id!==current.dinner);
    if (!alternatives.length) { setMessage('This is the only sample meal matching your preferences.'); return; }
    const next = alternatives[0].id;
    setPlan(p=>p.map((day,i)=>({...day,dinner:day.batch===current.batch?next:day.dinner,lunch:(i===0?day.batch:p[i-1].batch)===current.batch?next:day.lunch})));
    setMessage('Meal and its leftovers updated. Your grocery list is up to date.');
  };

  const saveRecipe = () => {
    const next = {...selectedRecipe,title:editDraft.title.trim()||selectedRecipe.title,ingredients:editDraft.ingredients.map((i,index)=>{const amount=Math.max(0,Number(i.amount)||0);const old=selectedRecipe.ingredients[index];return {...i,amount,price:old.amount?old.price*amount/old.amount:old.price};}),steps:editDraft.steps.map(s=>s.trim()).filter(Boolean)};
    if (!next.steps.length) { setMessage('Keep at least one recipe step.'); return; }
    setRecipes(all=>all.map(r=>r.id===selectedRecipe.id?next:r)); setEditing(false); setMessage('Recipe saved. Grocery quantities updated.');
  };

  const copyGroceries = async () => {
    const text = groceryItems.filter(i=>!checked[i.key]).map((i,n)=>`${n+1}. [ ] ${i.name} — ${quantity(i.amount)} ${i.unit}`.trim()).join('\n');
    try { await navigator.clipboard.writeText(text||'Your grocery list is complete.'); setCopyStatus('Copied!'); }
    catch { setCopyStatus('Copy the list below'); setMessage(text); }
    timers.current.push(setTimeout(()=>setCopyStatus(''),2500));
  };

  const startEdit = () => {setEditDraft({title:selectedRecipe.title,ingredients:selectedRecipe.ingredients.map(i=>({...i})),steps:[...selectedRecipe.steps]});setEditing(true);};

  const renderSurvey = () => <>
    <div className="phone-eyebrow">YOUR STARTING POINT <span>0{step+1} / 03</span></div>
    <div className="survey-progress">{[0,1,2].map(n=><span key={n} className={n<=step?'filled':''}/>)}</div>
    {step===0 && <>
      <h3>Good food.<br/>Made for <em>you.</em></h3>
      <p className="phone-lead">First, anything we should leave out?</p>
      <fieldset className="allergy-field"><legend>Avoid <span>Choose any · or None</span></legend><div className="chip-grid">{AVOID_OPTIONS.map(value=><button type="button" key={value} className={`choice-chip ${(value==='None'?draft.avoidAnswered&&!draft.avoid.length:draft.avoid.includes(value))?'chosen':''}`} aria-pressed={value==='None'?draft.avoidAnswered&&!draft.avoid.length:draft.avoid.includes(value)} onClick={()=>avoid(value)}>{value}{(value==='None'?draft.avoidAnswered&&!draft.avoid.length:draft.avoid.includes(value))&&<Icon name="check"/>}</button>)}</div></fieldset>
      <p className="field-help">Foods to leave out, including allergens.</p>
      <fieldset className="choice-field"><legend>Preferences <span className="sr-only">Choose multiple</span></legend><div>{NUTRITION_PREFERENCES.map(value=><button type="button" key={value} className={draft.preferences.includes(value)?'chosen':''} aria-pressed={draft.preferences.includes(value)} onClick={()=>preference(value)}>{value}</button>)}</div></fieldset>
      <p className="field-help">Choose any that fit. Preferences help rank the sample meals.</p>
    </>}
    {step===1 && <>
      <h3>What matters<br/><em>this week?</em></h3>
      <p className="phone-lead">A starting point, never a fixed routine.</p>
      <Choice label="My main goal" values={['Save time','Spend less','Eat more plants']} value={draft.goal} onChange={v=>setChoice('goal',v)}/>
      <Choice label="My budget" values={['Keep it low','Balanced','Flexible']} value={draft.budget} onChange={v=>setChoice('budget',v)}/>
      <Choice label="People at the table" values={[1,2,4]} value={draft.people} onChange={v=>setChoice('people',v)}/>
    </>}
    {step===2 && <>
      <h3>A plan that fits<br/><em>real life.</em></h3>
      <p className="phone-lead">A little cooking. Some good leftovers.</p>
      <Choice label="Time for each cook" values={[15,30,45]} labels={['15 min','30 min','45 min']} value={draft.minutes} onChange={v=>setChoice('minutes',v)}/>
      <Choice label="How often do you want to cook?" values={[3,5,7]} labels={['3× / week','5× / week','Every day']} value={draft.cooks} onChange={v=>setChoice('cooks',v)}/>
      <div className="little-insight"><Icon name="spark"/><p>{draft.cooks===7?'Fresh dinners each day. Lunches use the previous dinner.':'We’ll plan larger batches and make room for leftovers.'}</p></div>
    </>}
    {error&&<p className="form-error" role="alert">{error}</p>}
    <div className="survey-actions">{step>0&&<button className="outline-square" aria-label="Previous survey step" onClick={()=>{setStep(s=>s-1);setError('');}}><Icon name="back"/></button>}<button className="orange-button" disabled={step===0&&!draft.avoidAnswered} onClick={()=>step<2?setStep(s=>s+1):generate()}>{step===2?'Make my sample week':'Keep going'}<Icon name="arrow"/></button></div>
    <p className="sample-note">Interactive concept · sample meal planning</p>
  </>;

  const renderLoading = () => <div className="plan-loading" role="status"><div className="loading-mark"><Icon name="spark"/></div><div className="phone-eyebrow">A WEEK, A LITTLE MORE YOU.</div><h3>Finding<br/>your flavor.</h3><p>{['Checking your preferences…','Making room for leftovers…','Bringing your week together…'][progress]}</p><div className="loading-line"><span style={{width:`${(progress+1)/3*100}%`}}/></div><small>Arranging sample recipes for this preview.</small></div>;

  const renderHome = () => <>
    <div className="phone-eyebrow">YOUR KITCHEN, IN SYNC <Icon name="spark"/></div>
    <h3>A little more<br/><em>your taste.</em></h3>
    {!plan?<><p className="phone-lead">A few good questions. A week of possibilities.</p><Dish recipe={RECIPES[1]} large/><button className="orange-button" onClick={()=>go('survey')}>Find my starting point<Icon name="arrow"/></button></>:<>
      <p className="phone-lead">Your starting point is set. Let’s keep refining it.</p>
      <div className="home-summary"><button onClick={()=>go('survey')}><Icon name="survey"/><span>Your preferences<small className="preference-summary">{prefs.preferences.length?prefs.preferences.join(' · '):'Your starting point'} · {prefs.minutes} min · {prefs.people} people</small></span><span>↗</span></button><button onClick={()=>go('plan')}><Icon name="plan"/><span>This week<small>{prefs.cooks} cooking days, with leftovers</small></span><span>↗</span></button><button onClick={()=>go('grocery')}><Icon name="grocery"/><span>Your grocery list<small>{groceryItems.filter(i=>!checked[i.key]).length} items · about ${Math.round(estimate)}</small></span><span>↗</span></button></div>
      <div className="small-heading"><h4>Curated for you</h4><span>SAMPLE PICKS</span></div>
      <p className="field-help">{Object.values(ratings).includes('like')?'Your liked meals move to the front.':'Try a meal, then tell us what worked.'}</p>
      {available.slice(0,3).map(recipe=><button className="recommendation" key={recipe.id} onClick={()=>openRecipe(recipe.id)}><Dish recipe={recipe}/><span><strong>{recipe.title}</strong><small>{recipe.time} min · {recipe.plant?'Plant-based':'Everyday cooking'}</small></span><span>↗</span></button>)}
      {!available.length&&<p className="empty-copy">You’ve skipped every matching sample. Revisit a meal in your plan to like it again.</p>}
    </>}
  </>;

  const renderPlan = () => !plan?<Empty title="Your week starts here." copy="Tell us a little about yourself to make a sample plan." onClick={()=>go('survey')}/>:<>
    <div className="phone-eyebrow">A WEEK AT YOUR PACE <span>07 DAYS</span></div><h3>Good things<br/><em>on the menu.</em></h3>
    <div className="plan-tags"><span>{prefs.cooks} cooking days</span><span>{prefs.people} people</span><span>{prefs.minutes} min or less</span></div>
    <div className="breakfast-note"><span>EVERYDAY BREAKFAST</span><input aria-label="Edit breakfast recommendation" value={breakfastNote} onChange={e=>setBreakfastNote(e.target.value)}/></div>
    {plan.map((day,index)=>{
      const dinner=recipes.find(r=>r.id===day.dinner);const lunch=recipes.find(r=>r.id===day.lunch);
      return <div className="day-plan" key={day.day}><div className="day-title"><h4>{day.day}</h4><span className={day.cook?'cook-tag':''}>{day.cook?'COOK DAY':'LEFTOVERS'}</span></div><button className="meal-row lunch" onClick={()=>openRecipe(day.lunch)}><span className="meal-kind">LUNCH</span><span>{index===0?'Fresh': 'Leftover'} {lunch.title.toLowerCase()}</span><span>↗</span></button><div className="dinner-row"><button className="meal-row" onClick={()=>openRecipe(day.dinner)}><Dish recipe={dinner}/><span><small>DINNER</small><strong>{dinner.title}</strong><small>{day.cook?`${dinner.time} min`:'Reheat & enjoy'} · {dinner.calories} kcal*</small></span></button><button className="swap-meal" aria-label={`Change ${day.day}'s meal and matching leftovers`} onClick={()=>swapBatch(index)}>↻</button></div></div>;
    })}
    <p className="sample-note">*Illustrative nutrition per serving. Lunches use dinner batches; refrigerate or freeze portions as appropriate.</p>
    <button className="orange-button" onClick={()=>go('grocery')}>See my grocery list<Icon name="grocery"/></button>
  </>;

  const renderGroceries = () => !plan?<Empty title="One list. Less thinking." copy="Your meal plan brings all the ingredients together here." onClick={()=>go('survey')}/>:<>
    <div className="phone-eyebrow">ONE WEEK. ONE LIST. <Icon name="grocery"/></div><h3>A little less<br/><em>back and forth.</em></h3><p className="phone-lead">Everything for your week, in one place.</p>
    <div className="grocery-estimate"><span>Estimated ingredients<small>Sample US costs · excludes checked items</small></span><strong>${Math.round(estimate)}</strong></div>
    <div className="list-toolbar"><span>{groceryItems.filter(i=>checked[i.key]).length} / {groceryItems.length} ready</span><button onClick={()=>setEditingList(v=>!v)}>{editingList?'Done editing':'Edit list'}</button><button onClick={copyGroceries}>{copyStatus||'Copy list ↗'}</button></div>
    <ol className="grocery-list">{groceryItems.map((item,index)=><li key={item.key} className={checked[item.key]?'is-checked':''}><span className="list-number">{String(index+1).padStart(2,'0')}</span><label><input type="checkbox" checked={!!checked[item.key]} onChange={()=>setChecked(p=>({...p,[item.key]:!p[item.key]}))}/><span className="custom-check"><Icon name="check"/></span><span className="sr-only">Already have </span>{!editingList&&<span className="grocery-name">{item.name}<small>{quantity(item.amount)} {item.unit}</small></span>}</label>{editingList&&<input className="grocery-edit" aria-label={`Edit ${item.name}`} value={item.name} onChange={e=>setItemEdits(p=>({...p,[item.key]:e.target.value}))}/>}</li>)}</ol>
    <form className="add-item" onSubmit={e=>{e.preventDefault();if(newItem.trim()){setCustomItems(p=>[...p,{key:`custom-${Date.now()}`,name:newItem.trim(),amount:1,unit:'',price:0}]);setNewItem('');}}}><input aria-label="Extra grocery item" placeholder="Anything else?" value={newItem} onChange={e=>setNewItem(e.target.value)}/><button aria-label="Add grocery item"><Icon name="plus"/></button></form>
    <div className="grocery-connection"><Icon name="grocery"/><div><strong>From your list to store pickup.</strong><p>A planned grocery connection would match this list to a store basket. Review the items, place the order and collect it when ready.</p><small>PLANNED CONNECTION · PREVIEW ONLY</small></div></div>
    <p className="sample-note">Custom items are excluded from the sample cost estimate.</p>
  </>;

  const renderRecipe = () => <>
    <div className="recipe-top"><button className="back-button" onClick={()=>{setSelected(null);setEditing(false);setMessage('');}}><Icon name="back"/> Back</button><button className="small-text-button" onClick={()=>editing?setEditing(false):startEdit()}>{editing?'Cancel edit':'Edit recipe'}</button></div>
    <Dish recipe={selectedRecipe} large/>
    {editing?<input className="recipe-title-edit" aria-label="Recipe title" value={editDraft.title} onChange={e=>setEditDraft(p=>({...p,title:e.target.value}))}/>:<h3 className="recipe-title">{selectedRecipe.title}</h3>}
    <p className="phone-lead">{selectedRecipe.short}</p><div className="recipe-stats"><span><Icon name="clock"/>{selectedRecipe.time} min</span><span>{selectedRecipe.calories} kcal*</span><label><select aria-label="Recipe servings" value={servings} onChange={e=>setServings(Number(e.target.value))}>{[1,2,4,6,8].map(n=><option key={n} value={n}>{n} servings</option>)}</select></label></div>
    <p className="field-help">Tools: {selectedRecipe.tools}</p><div className="recipe-heading"><h4>Ingredients</h4><span>PER {servings} SERVINGS</span></div><ul className="ingredients">{(editing?editDraft.ingredients:selectedRecipe.ingredients).map((item,index)=><li key={item.name}><span>{item.name}</span>{editing?<label><span className="sr-only">Amount of {item.name} for 2 servings</span><input type="number" min="0" step="0.5" value={item.amount} onChange={e=>setEditDraft(p=>({...p,ingredients:p.ingredients.map((v,n)=>n===index?{...v,amount:e.target.value}:v)}))}/>{item.unit}<small>base / 2 servings</small></label>:<strong>{quantity(item.amount*servings/2)} {item.unit}</strong>}</li>)}</ul>
    {!editing&&<><p className="dispense-callout"><Icon name="arrow"/>Click Dispense to watch your spices collect in the 3D preview.</p><button className="dispense-button" onClick={()=>{onDispense();setMessage('Dispensing preview: '+selectedRecipe.spices+'.');}}><Icon name="spark"/><span>Dispense</span><span aria-hidden="true">↗</span></button></>}
    <div className="recipe-heading"><h4>Let’s cook.</h4></div><ol className="recipe-steps">{(editing?editDraft.steps:selectedRecipe.steps).map((step,index)=><li key={index}><span>{String(index+1).padStart(2,'0')}</span>{editing?<textarea aria-label={`Recipe step ${index+1}`} value={step} onChange={e=>setEditDraft(p=>({...p,steps:p.steps.map((s,n)=>n===index?e.target.value:s)}))}/>:<p>{step}</p>}</li>)}</ol>
    {editing?<button className="orange-button" onClick={saveRecipe}>Save recipe<Icon name="check"/></button>:<div className="meal-feedback"><h4>Was this your kind of meal?</h4><p>A small answer helps shape your next week.</p><div><button className={ratings[selectedRecipe.id]==='like'?'chosen':''} aria-pressed={ratings[selectedRecipe.id]==='like'} onClick={()=>{setRatings(p=>({...p,[selectedRecipe.id]:'like'}));setFollowUp('why');}}>More like this +</button><button className={ratings[selectedRecipe.id]==='skip'?'chosen':''} aria-pressed={ratings[selectedRecipe.id]==='skip'} onClick={()=>{setRatings(p=>({...p,[selectedRecipe.id]:'skip'}));setFollowUp(null);setMessage('We’ll leave this meal out of future sample plans.');}}>Skip next time</button></div>{followUp==='why'&&<div className="follow-up"><p>What worked for you?</p>{['Quick prep','Big flavor','Good leftovers'].map(answer=><button key={answer} onClick={()=>{setFollowUp(answer);setTasteNotes(p=>({...p,[selectedRecipe.id]:answer}));setMessage(`${answer} saved with this meal.`);}}>{answer}</button>)}</div>}{followUp&&followUp!=='why'&&<p className="feedback-thanks">Noted: {followUp.toLowerCase()}. Your liked meal now leads your sample recommendations.</p>}</div>}
    <p className="sample-note">Sample recipe · estimated nutrition and cost. Servings here scale the recipe view; your weekly plan uses the household size in Survey.</p>
  </>;

  return <div className="demo-column"><div className="phone-frame"><div className="phone-hardware"><span>9:41</span><span className="phone-island"/><span>▮▮▮ <span className="battery"/></span></div><div className="phone-app-header"><Wordmark/><span className="app-avatar">YOU</span></div><div className="phone-content" ref={scroller}>
    {busy?renderLoading():selectedRecipe?renderRecipe():tab==='survey'?renderSurvey():tab==='home'?renderHome():tab==='plan'?renderPlan():renderGroceries()}
    {message&&<p className="app-message" role="status">{message}</p>}
  </div><nav className="phone-tabs" aria-label="MySpice app">{[['home','Home','home'],['survey','Survey','survey'],['plan','Meal Plan','plan'],['grocery','Grocery List','grocery']].map(([id,label,icon])=><button key={id} disabled={busy} aria-current={tab===id?'page':undefined} onClick={()=>go(id)}><Icon name={icon}/><span>{label}</span></button>)}</nav><div className="phone-home-indicator"/></div><div className="phone-demo-label"><span className="tiny-dot"/> LIVE CONCEPT PREVIEW <span>YOUR OWN PHONE. YOUR OWN PACE.</span></div></div>;
}

function Choice({label,values,labels,value,onChange}) {
  return <fieldset className="choice-field"><legend>{label}</legend><div>{values.map((option,index)=><button type="button" key={option} className={value===option?'chosen':''} aria-pressed={value===option} onClick={()=>onChange(option)}>{labels?labels[index]:option}</button>)}</div></fieldset>;
}

function Empty({title,copy,onClick}) { return <div className="empty-state"><Icon name="spark"/><h3>{title}</h3><p>{copy}</p><button className="orange-button" onClick={onClick}>Start with the survey<Icon name="arrow"/></button></div>; }
