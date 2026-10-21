import React, { useEffect, useRef } from 'react';
import './case-study.css';
import { ResearchFindings, TargetMarket, UserJourney } from './CaseStudyVisuals.jsx';
import { CostComparison, HealthComparison } from './CostAndHealth.jsx';
import EditorialGallery from './EditorialGallery.jsx';

const asset = name => `/case-study/${name}.webp`;
const processBook = '/case-study/MySpice-process-book.pdf';

function SourceLink({ page, children }) {
  return <a className="case-source" href={`${processBook}#page=${page}`} target="_blank" rel="noreferrer">{children || `Process book / p. ${page}`} <span aria-hidden="true">↗</span></a>;
}

function Photo({ name, alt, caption, number, className = '', width = 1600, height = 1200 }) {
  return <figure className={`process-photo ${className}`}>
    <a className="process-image" href={asset(name)} target="_blank" rel="noreferrer" aria-label={`View full image: ${caption}`}><img src={asset(name)} alt={alt} width={width} height={height} loading="lazy" decoding="async"/></a>
    <figcaption><span>{number && <b>{number}</b>}{caption}</span><span aria-hidden="true">↗</span></figcaption>
  </figure>;
}

export default function CaseStudy() {
  const root = useRef(null);

  useEffect(() => {
    const section = root.current;
    if (!section || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .08 });
    section.classList.add('motion-ready');
    section.querySelectorAll('[data-reveal]').forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return <div className="case-study" ref={root}>
    <section className="case-opening case-pad" id="the-process" aria-labelledby="process-title">
      <div className="case-kicker"><span className="tiny-dot"/> THE THINKING BEHIND THE THING <span>03 / THE PROCESS</span></div>
      <div className="case-opening-grid">
        <div className="case-opening-copy" data-reveal>
          <h2 id="process-title">Good cooking.<br/><em>Fewer obstacles.</em></h2>
          <p className="case-lead">Research into everyday kitchen friction became a connected spice dispenser. A little less juggling, from planning to cooking.</p>
          <a className="case-text-link" href="#research">Start with the research <span aria-hidden="true">↓</span></a>
        </div>
        <figure className="case-opening-product" data-reveal>
          <img src={asset('silver-left-editorial')} alt="Editorial three-quarter view of satin silver MySpice, with finely ground spices in clear reservoirs and the recipe support closed." width="1448" height="1086" loading="lazy" decoding="async"/>
          <figcaption>MYSPICE / CURRENT VISUAL DIRECTION</figcaption>
        </figure>
      </div>
      <dl className="case-project-meta">
        <div><dt>PROJECT</dt><dd>Industrial design senior project, 2024</dd></div>
        <div><dt>DESIGNER</dt><dd>Carlos Ocasio Milanes</dd></div>
        <div><dt>EXPLORATION</dt><dd>Research · Product · Interaction · Prototyping</dd></div>
      </dl>
      <nav className="case-contents" aria-label="Design process chapters">
        <a href="#research"><span>01</span> The findings <span aria-hidden="true">↘</span></a>
        <a href="#target-market"><span>02</span> For whom <span aria-hidden="true">↘</span></a>
        <a href="#user-journey"><span>03</span> The journey <span aria-hidden="true">↘</span></a>
        <a href="#making"><span>04</span> The making <span aria-hidden="true">↘</span></a>
      </nav>
    </section>

    <ResearchFindings/>
    <CostComparison/>
    <HealthComparison/>
    <TargetMarket/>
    <UserJourney/>

    <section className="case-opportunity case-pad" id="opportunity" aria-labelledby="opportunity-title">
      <div className="case-kicker"><span className="tiny-dot"/> FROM INSIGHT TO FORM</div>
      <div className="case-section-heading" data-reveal><h2 id="opportunity-title">Form <em>exploration.</em></h2><div><p>Seasoning happens while hands are busy. A <em>wall-mounted dispenser</em> keeps spices close and the worktop clear.</p><SourceLink page={16}>Journey & opportunity / pp. 16–17</SourceLink></div></div>
      <figure className="concept-studies" data-reveal><img src={asset('concept-sketches')} alt="Eight early spice dispenser form studies exploring rotating, wall-mounted and vertical arrangements." width="1920" height="1080" loading="lazy" decoding="async"/><figcaption><span>AI-assisted form studies from the original development process.</span><span>EXPLORATION → SELECTION</span></figcaption></figure>
    </section>

    <section className="case-experiments case-pad" id="experiments" aria-labelledby="experiments-title">
      <div className="case-kicker"><span className="tiny-dot"/> DIGITAL & PHYSICAL EXPLORATION</div>
      <div className="case-section-heading" data-reveal><h2 id="experiments-title">From an idea<br/>to an <em>experiment.</em></h2><p>Software and hardware developed together: <em>navigate, select, dispense.</em></p></div>
      <div className="gesture-study">
        <Photo name="gesture-control" alt="Carlos testing Python hand tracking, with finger landmarks overlaid on a camera feed and the experiment's code below." caption="Hand tracking & click detection / Python experiment" number="A" width={1080} height={1350} className="gesture-photo"/>
        <div className="experiment-copy" data-reveal><span className="case-label">A / HANDS-FREE EXPLORATION</span><h3>Keep the mess<br/><em>off your appliances.</em></h3><p>Handling raw chicken or meat should not mean touching every spice container and screen in the kitchen. This Python gesture experiment explored navigating recipes with a movement of the hand, keeping food-covered fingers off your devices.</p><p>Visual Studio Code · ChatGPT-assisted coding</p><SourceLink page={15}>Hands-free technology / p. 15</SourceLink></div>
      </div>
      <div className="hardware-heading" data-reveal><div><span className="case-label">B / THE DISPENSING EXPERIMENT</span><h3>Making the digital<br/>do something physical.</h3></div><p>Reservoirs, rotating caps, gears and DC motors connected the Python interface to an Arduino.</p></div>
      <div className="hardware-photos">
        <Photo name="arduino-circuit" alt="Arduino Uno connected to a breadboard and the early spice dispenser prototype with colored jumper wires." caption="Wiring the circuit" number="01"/>
        <Photo name="gears-and-caps" alt="Experimental red and white gears and circular dispensing caps laid out on a workbench." caption="Exploring caps & gears" number="02" width={1200} height={1600}/>
        <Photo name="motor-experiment" alt="An Arduino and breadboard wired to several DC motors on the workshop table." caption="Connecting the motors" number="03"/>
      </div>
      <div className="signal-flow signal-flow-refined" data-reveal><span className="case-label">PROTOTYPE SIGNAL FLOW</span><ol>{['Choose a recipe','Python selects motors','Arduino sends commands','Motors turn the caps','Openings align; spices release'].map((label,i)=><li key={label}><span>0{i+1}</span><strong>{label}</strong><svg viewBox="0 0 32 20" fill="none" aria-hidden="true"><path d="M2 10h27m-7-7 7 7-7 7" stroke="currentColor" strokeWidth="1.2"/></svg></li>)}</ol><SourceLink page={21}>Hardware development / pp. 19–21</SourceLink></div>
    </section>

    <section className="case-digital case-pad" aria-labelledby="digital-title">
      <div className="case-kicker"><span className="tiny-dot"/> A COMPANION, THROUGHOUT THE MEAL</div>
      <div className="case-section-heading" data-reveal><h2 id="digital-title">An interface<br/>for the <em>routine.</em></h2><p>Spice selection grew into recipes, <em>weekly plans,</em> shopping lists and preference assessments. A planned grocery connection would carry that list through to a basket ready for store pickup.</p></div>
      <div className="interface-development" data-reveal>
        <figure className="first-interface"><div><img src={asset('first-interface')} alt="The first Python interface, with six blue buttons for selecting individual spices." width="802" height="637" loading="lazy" decoding="async"/></div><figcaption><span>01 / Start with the connection</span><span>PYTHON UI</span></figcaption></figure>
        <span className="interface-arrow" aria-hidden="true">↗</span>
        <div className="original-interfaces"><img src={asset('original-home')} alt="Original 2024 home interface with a large recipe target and shortcuts." width="1307" height="749" loading="lazy" decoding="async"/><img src={asset('original-recipe')} alt="Original recipe screen with ingredients, a step-by-step guide and a dispense button." width="1309" height="749" loading="lazy" decoding="async"/><img src={asset('original-week')} alt="Original weekly recipes screen listing meals and their cooking times." width="1308" height="750" loading="lazy" decoding="async"/><img src={asset('original-groceries')} alt="Original shopping list interface with weekly and allergy assessments." width="1307" height="745" loading="lazy" decoding="async"/><p>02 / Connect the whole week <span>2024 INTERFACE STUDIES</span></p></div>
      </div>
      <div className="digital-takeaway" data-reveal><p>Plan. Prepare.<br/><em>Cook.</em></p><div><a className="case-text-link" href="#app-demo">Explore the app preview <span aria-hidden="true">↗</span></a><SourceLink page={22}>App development / pp. 22–26</SourceLink></div></div>
    </section>

    <section className="case-making case-pad" id="making" aria-labelledby="making-title">
      <div className="case-kicker"><span className="tiny-dot"/> 04 / REFINE THE FORM</div>
      <div className="case-section-heading" data-reveal><h2 id="making-title">Build it.<br/>Hold it. <em>Refine it.</em></h2><p>SolidWorks refined the open prototype into an enclosed casing, with <em>rounded edges</em> for easier cleaning.</p></div>
      <div className="form-evolution">
        <Photo name="early-prototype" alt="An early open-frame spice dispenser prototype with clear tubes, red components and a white base." caption="Early prototype / establishing the arrangement" number="01" width={1200} height={1600}/>
        <Photo name="reservoir-cad" alt="SolidWorks model showing clear reservoirs within the refined enclosed spice dispenser casing." caption="SolidWorks / resolving the casing" number="02" width={922} height={592}/>
        <Photo name="technical-drawing" alt="Technical drawing with front, side, top and perspective views of the MySpice casing." caption="Drawings / bringing the parts together" number="03" width={1061} height={777}/>
      </div>
      <div className="making-detail-row" data-reveal><span className="case-label">DETAILS WITH A PURPOSE</span><div><h3>A clear view.</h3><p>Transparent reservoirs make the spices and remaining levels visible.</p></div><div><h3>A removable collector.</h3><p>A separate bottom channel collects the spices and lifts away for pouring.</p></div><div><h3>Room for a recipe.</h3><p>A retractable support gives a device a place, then closes back into the form.</p></div></div>
      <div className="making-subheading" data-reveal><h3>From the screen<br/>to the workbench.</h3><p>PLA parts, cut-to-length clear PVC, and magnetic connections for the lid and collector.</p></div>
      <div className="making-gallery">
        <Photo name="printed-components" alt="Printed casing, lid, collector and clear reservoir tubes arranged for assembly." caption="Print the parts / PLA & clear PVC" number="01" width={1200} height={1169}/>
        <Photo name="cutting-pipes" alt="Carlos cutting a clear PVC reservoir tube to length with a saw in the workshop." caption="Cut the reservoirs to fit" number="02" width={800} height={735}/>
        <Photo name="adding-magnets" alt="Hands adding magnets to a black model component on the workshop table." caption="Add the magnetic connections" number="03" width={1600} height={592}/>
        <Photo name="assembly" alt="The physical MySpice casing with its lid and recipe support attached during assembly." caption="Assemble the casing & support" number="04"/>
      </div>
      <div className="physical-result">
        <Photo name="physical-prototype" alt="Completed white and black MySpice physical prototype mounted on a wall with clear reservoirs and the original device support open." caption="The assembled physical model / 2024" width={1555} height={1200}/>
        <div data-reveal><span className="case-label">THE PARTS BECOME A PRODUCT</span><h3>A place for spices.<br/>Space for cooking.</h3><p>Printing and assembly brought the casing, reservoirs, removable parts and recipe support together.</p><SourceLink page={34}>Model development & making / pp. 27–39</SourceLink></div>
      </div>
    </section>

    <EditorialGallery/>

    <section className="case-finale case-pad" aria-labelledby="finale-title">
      <div className="case-kicker"><span className="tiny-dot"/> ONE CONNECTED IDEA <span>MYSPICE / SATIN SILVER</span></div>
      <div className="case-finale-heading" data-reveal><h2 id="finale-title">Less to juggle.<br/><em>More room to cook.</em></h2><p>Planning, recipes and spice dispensing. One connected routine, with optional phone or paper support.</p></div>
      <div className="final-product-view" data-reveal>
        <div className="final-product-image"><img src={asset('silver-front-editorial')} alt="Front view of the satin silver MySpice concept with fine natural spices and the recipe support closed." width="1448" height="1086" loading="lazy" decoding="async"/></div>
      </div>
      <div className="case-ending"><a className="case-text-link" href="#the-object">Return to the object <span aria-hidden="true">↑</span></a><a className="case-book-link" href={processBook} target="_blank" rel="noreferrer"><span>THE ORIGINAL PROCESS BOOK</span>Explore the full project <span aria-hidden="true">↗</span></a></div>
    </section>
  </div>;
}
