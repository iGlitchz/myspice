import React, { useEffect, useRef, useState } from 'react';
import './editorial-gallery.css';

const collection = [
  {file:'stone-house',width:1672,height:941,title:'The stone house',detail:'Room to breathe. A wider perspective.',alt:'Wide architectural view across a luxury limestone and pale oak kitchen, with a compact MySpice appliance installed on the rear prep wall.',format:'wide'},
  {file:'walnut-residence',width:1122,height:1402,title:'The walnut residence',detail:'Dark timber. The last light of the day.',alt:'MySpice against dark marble and rich walnut cabinetry in a refined residential kitchen at dusk.',format:'portrait'},
  {file:'chefs-counter',width:1536,height:1024,title:'Along the prep line',detail:'A low angle. A different point of view.',alt:'Low oblique view along a fine-dining preparation counter, showing MySpice’s left end, shallow silver chassis and black collector.',format:'landscape'},
  {file:'coastal-kitchen',width:1536,height:1024,title:'A closer look',detail:'Glass, grain and satin silver.',alt:'Macro photograph of MySpice’s satin silver upper corner and adjacent glass spice reservoirs, showing fine grain and material detail.',format:'landscape'},
  {file:'timber-kitchen',width:1122,height:1402,title:'The upper edge',detail:'Quiet joinery. Considered from above.',alt:'High three-quarter view of MySpice in a smoked-oak and charcoal-stone kitchen, revealing the dark top lid and narrow silver shoulder.',format:'portrait'},
  {file:'evening-service',width:1672,height:941,title:'Before evening service',detail:'A place in the rhythm of the kitchen.',alt:'MySpice integrated into a fine-dining restaurant preparation line, with a chef finishing a plated course nearby.',format:'wide'},
];
const base='/case-study/gallery/';
const photoPath=shot=>`${base}${shot.file}.webp`;

function Arrow({direction='right'}) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={direction==='left'?{transform:'rotate(180deg)'}:undefined}><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.2"/></svg>;
}

export default function EditorialGallery() {
  const [active,setActive]=useState(null);
  const dialog=useRef(null);
  const isOpen=active!==null;
  const selected=collection[active??0];
  const move=direction=>setActive(previous=>(previous+direction+collection.length)%collection.length);

  useEffect(()=>{
    const node=dialog.current;
    if(!node) return;
    if(isOpen&&!node.open) node.showModal();
    if(!isOpen&&node.open) node.close();
  },[isOpen]);

  useEffect(()=>{
    if(!isOpen) return;
    const before=document.body.style.overflow;
    document.body.style.overflow='hidden';
    return ()=>{document.body.style.overflow=before;};
  },[isOpen]);

  return <section className="editorial-gallery case-pad" id="in-context" aria-labelledby="gallery-title">
    <div className="case-kicker"><span className="tiny-dot"/> MYSPICE / IN CONTEXT <span>ENVIRONMENTS 01—06</span></div>
    <div className="case-section-heading gallery-heading" data-reveal><h2 id="gallery-title">Good taste.<br/><em>Beyond the plate.</em></h2><p>From a quiet morning kitchen to the rhythm of evening service. An imagined collection of spaces for <em>everyday rituals.</em></p></div>
    <div className="editorial-collection">{collection.map((shot,index)=><figure className={`gallery-photo gallery-${shot.format}`} key={shot.file} data-reveal>
      <button className="gallery-photo-button" onClick={()=>setActive(index)} aria-label={`View ${shot.title} photograph`} aria-haspopup="dialog">
        <img src={photoPath(shot)} srcSet={`${base}${shot.file}-640.webp 640w, ${photoPath(shot)} ${shot.width}w`} sizes={shot.format==='wide'?'(max-width: 760px) 100vw, 85vw':'(max-width: 760px) 100vw, 50vw'} alt={shot.alt} width={shot.width} height={shot.height} loading="lazy" decoding="async"/>
        <span className="gallery-expand" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5" stroke="currentColor" strokeWidth="1.2"/></svg></span>
      </button>
      <figcaption><span className="gallery-photo-index">0{index+1}</span><div><h3>{shot.title}</h3><p>{shot.detail}</p></div><span className="gallery-photo-category">{index===2||index===5?'SERVICE SPACES':'PRIVATE KITCHENS'}</span></figcaption>
    </figure>)}</div>
    <div className="gallery-colophon"><p>Six settings. <em>One considered object.</em></p><span>ART-DIRECTED CONCEPT IMAGERY</span></div>
    <dialog className="gallery-lightbox" ref={dialog} aria-label="MySpice editorial gallery" onClose={()=>setActive(null)} onClick={e=>{if(e.target===e.currentTarget)setActive(null);}} onKeyDown={e=>{if(e.key==='ArrowLeft'){e.preventDefault();move(-1);}if(e.key==='ArrowRight'){e.preventDefault();move(1);}}}>
      <div className="gallery-lightbox-inner">
        <div className="gallery-lightbox-top"><span>MYSPICE / IN CONTEXT</span><button className="gallery-close" onClick={()=>setActive(null)} aria-label="Close gallery"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19" stroke="currentColor" strokeWidth="1.2"/></svg></button></div>
        {isOpen&&<img className="gallery-lightbox-photo" src={photoPath(selected)} alt={selected.alt}/>}
        <div className="gallery-lightbox-bottom"><div aria-live="polite"><span>0{(active??0)+1} / 06</span><h3>{selected.title}</h3></div><a href={`${base}originals/${selected.file}.png`} download>Save image <Arrow/></a><div className="gallery-lightbox-controls"><button onClick={()=>move(-1)} aria-label="Previous photograph"><Arrow direction="left"/></button><button onClick={()=>move(1)} aria-label="Next photograph"><Arrow/></button></div></div>
      </div>
    </dialog>
  </section>;
}
