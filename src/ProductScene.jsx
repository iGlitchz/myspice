import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { SSAARenderPass } from 'three/addons/postprocessing/SSAARenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FILM_CHAPTERS, FILM_DURATION, HERO_POSITION, filmChapter, fullProductDistance, sampleFilm } from './heroChoreography.js';
import { createPlacement } from './accessoryMotion.js';
import { createCollectorBlend } from './collectorBlend.js';

export default function ProductScene({ mode, detail, replay, dispensing }) {
  const host = useRef(null);
  const actions = useRef({ mode, detail, dispensing });
  const replayRef = useRef(replay);
  const transport = useRef(null);
  const timeline = useRef(null);
  const [status, setStatus] = useState('loading');
  const [filmState, setFilmState] = useState({ active: false, paused: false, chapter: 0 });
  const [contextVersion, setContextVersion] = useState(0);
  const [blendReady,setBlendReady]=useState(false);
  useEffect(() => { actions.current = { mode, detail, dispensing }; }, [mode, detail, dispensing]);
  useEffect(() => { replayRef.current = replay; }, [replay]);

  useEffect(() => {
    const container = host.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      setStatus('fallback');
      return;
    }
    let disposed = false;
    let inView = true;
    let viewRatio=0;
    let model;
    let frame;
    let replaySeen = replayRef.current;
    let detailSeen = actions.current.detail;
    let modeSeen = actions.current.mode;
    let dispenseSeen=0;
    let transition = null;
    let collector, holder, phone, paper, blend;
    let blendComplete=false;
    let placements=[];
    const collectorHome = new THREE.Vector3();
    const film = { active: false, paused: false, time: 0, chapter: -1, dispensing:false, elapsed:0, entry:null };
    let dirty = true;
    let refinedFrame = false;
    let lastMotion = 0;
    let drag = false;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(31, 1, 0.01, 20);
    camera.position.set(0.83, 0.60, 1.55);
    renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio, 1.75), 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.94;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.style.touchAction = 'pan-y';
    // Once movement settles, accumulate eight slightly offset samples into a
    // clean still frame. Moving views stay responsive with ordinary MSAA.
    const composer = new EffectComposer(renderer);
    const supersampling = new SSAARenderPass(scene,camera);
    supersampling.sampleLevel = 3;
    supersampling.unbiased = true;
    const outputPass = new OutputPass();
    composer.addPass(supersampling);
    composer.addPass(outputPass);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const studio = new THREE.Scene();
    studio.background = new THREE.Color(0.11,0.12,0.13);
    const softbox = (width,height,position,brightness,color='#ffffff') => {
      const mat = new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(brightness),side:THREE.DoubleSide});
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(width,height),mat);
      panel.position.set(...position);
      panel.lookAt(0,0.2,0);
      studio.add(panel);
    };
    softbox(1.2,2.4,[-1.8,1.1,1.4],3.1,'#fff9ef');
    softbox(0.42,2.8,[1.5,0.65,0.9],2.5,'#e5edff');
    softbox(2.2,0.7,[0,2.1,0.2],2.1,'#fff0d7');
    softbox(2.5,1.6,[0,0.4,3.2],0.65,'#ffffff');
    const environment = pmrem.fromScene(studio, 0.015,0.01,20);
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.8;
    disposeTree(studio);
    pmrem.dispose();

    const wallMaterial = new THREE.MeshStandardMaterial({ color: '#181b19', roughness: 0.97 });
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(6, 5), wallMaterial);
    wall.position.set(0, 0.2, -0.063);
    wall.receiveShadow = true;
    scene.add(wall);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), new THREE.MeshStandardMaterial({ color: '#1e231e', roughness: 0.92 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.15;
    floor.receiveShadow = true;
    scene.add(floor);
    scene.add(new THREE.HemisphereLight('#fff6e5', '#222b23', 0.38));
    const key = new THREE.DirectionalLight('#fff4e5', 1.6);
    key.position.set(-0.6, 1.5, 1.2);
    key.castShadow = false;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -1;
    key.shadow.camera.right = 1;
    key.shadow.camera.top = 1;
    key.shadow.camera.bottom = -1;
    key.shadow.normalBias = 0.0015;
    key.shadow.bias = -0.0001;
    scene.add(key);
    const fill = new THREE.DirectionalLight('#e2ebf5', 0.45);
    fill.position.set(1.2, 0.5, 1);
    scene.add(fill);
    const warm = new THREE.PointLight('#ffb75c', 0.12, 1.8, 2);
    warm.position.set(-0.1, 0.65, 0.03);
    scene.add(warm);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = shadowCanvas.height = 128;
    const ctx = shadowCanvas.getContext('2d');
    const gradient = ctx.createRadialGradient(64,64,5,64,64,64);
    gradient.addColorStop(0,'rgba(0,0,0,0.65)');
    gradient.addColorStop(0.6,'rgba(0,0,0,0.3)');
    gradient.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,128,128);
    const contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(0.84,0.61),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));
    contactShadow.position.set(0.035,0.18,-0.061);
    scene.add(contactShadow);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.215, 0);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minAzimuthAngle = -0.65;
    controls.maxAzimuthAngle = 0.8;
    controls.minPolarAngle = 0.8;
    controls.maxPolarAngle = 1.55;
    controls.addEventListener('start', () => { transition = null; drag = true; });
    controls.addEventListener('end', () => { drag = false; });
    controls.addEventListener('change', () => { dirty = true; });
    // On touch, ordinary vertical scrolling takes precedence over orbiting.
    controls.touches.ONE = THREE.TOUCH.PAN;
    controls.touches.TWO = THREE.TOUCH.ROTATE;

    const loseContext = (event) => { event.preventDefault(); setStatus('fallback'); };
    const restoreContext = () => { setStatus('loading'); setContextVersion(v => v + 1); };
    renderer.domElement.addEventListener('webglcontextlost', loseContext);
    renderer.domElement.addEventListener('webglcontextrestored', restoreContext);

    const draco = new DRACOLoader();
    draco.setDecoderPath('/draco/');
    draco.setWorkerLimit(2);
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
    loader.load('/assets/myspice.glb?v=3.0', gltf => {
      if (disposed) { disposeTree(gltf.scene); return; }
      model = gltf.scene;
      model.traverse(obj => {
        if (!obj.isMesh) return;
        obj.castShadow = !obj.name.startsWith('MS_Reservoir');
        obj.receiveShadow = true;
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        materials.forEach(mat => {
          if (mat.name.startsWith('Clear reservoirs')) {
            mat.transmission = 0.985;
            mat.thickness = 0.0007;
            mat.ior = 1.46;
            mat.color.set('#ffffff');
            mat.transparent = false;
            mat.opacity = 1;
            mat.depthWrite = false;
            mat.roughness = 0.055;
            mat.attenuationColor?.set('#ffffff');
            mat.attenuationDistance = Infinity;
            mat.envMapIntensity = 0.65;
            mat.specularIntensity = 0.55;
            mat.side = THREE.FrontSide;
          }
          if (mat.name.startsWith('Satin silver')) {
            mat.metalness = 0.95;
            mat.roughness = 0.32;
            // Satin is a fine, nondirectional finish. A tangent-driven brushed
            // highlight exaggerates triangulation around the rolled corners.
            mat.anisotropy = 0;
            mat.envMapIntensity = 0.95;
            mat.normalScale?.set(0.07,0.07);
          }
          if (mat.name.startsWith('Machined silver')) {
            mat.roughness = 0.30;
            mat.envMapIntensity = 0.8;
          }
        });
      });
      ['MS_Phone', 'MS_Paper'].forEach(name => { const obj = model.getObjectByName(name); if (obj) obj.visible = false; });
      collector = model.getObjectByName('MS_Collector');
      if (collector) collectorHome.copy(collector.position);
      blend=createCollectorBlend(collector);
      holder = model.getObjectByName('MS_Holder_Pivot');
      phone = model.getObjectByName('MS_Phone');
      paper = model.getObjectByName('MS_Paper');
      placements=[createPlacement(phone,'phone'),createPlacement(paper,'paper')].filter(Boolean);
      scene.add(model);
      if (actions.current.mode === 'closed' && !actions.current.detail) startFilm();
      else beginTransition(true);
      dirty = true;
      setStatus('ready');
    }, undefined, () => { if (!disposed) setStatus('fallback'); });

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      renderer.setSize(width, height, false);
      composer.setSize(width,height);
      const aspect=width / Math.max(height,1);
      if (model && !film.active && !transition && !detailSeen && !drag) {
        const framing=fullProductDistance(aspect)/fullProductDistance(camera.aspect);
        camera.position.sub(controls.target).multiplyScalar(framing).add(controls.target);
      }
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      dirty = true;
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();
    const observer = new IntersectionObserver(entries => {
      const entry=entries[0];
      viewRatio=entry.intersectionRatio;
      inView=entry.isIntersecting && entry.intersectionRatio>=.12;
    }, { threshold: [0,.12,.65] });
    observer.observe(container);
    const endPosition = new THREE.Vector3();
    const endTarget = new THREE.Vector3(0, 0.215, 0);
    const pose = { position: new THREE.Vector3(), target: new THREE.Vector3(), key: new THREE.Vector3(), collector: new THREE.Vector3(), scratch: new THREE.Vector3() };
    const interactivePose = () => {
      const distance = fullProductDistance(camera.aspect);
      if (detailSeen) {
        endPosition.set(.23,.34,.58);
        endTarget.set(.07,.27,0);
      } else {
        endTarget.set(0,.215,0);
        endPosition.set(...HERO_POSITION).sub(endTarget).multiplyScalar(distance).add(endTarget);
      }
    };
    const publishFilm = () => {
      film.chapter=filmChapter(film.time);
      setFilmState({ active: film.active, paused: film.paused, chapter: film.chapter, dispensing:film.dispensing });
    };
    const resetLighting = () => {
      renderer.toneMappingExposure=.94;
      scene.environmentIntensity=.8;
      key.position.set(-.6,1.5,1.2);
      key.intensity=1.6;
    };
    const setLens = fov => {
      if (Math.abs(camera.fov-fov)>.0001) {
        camera.fov=fov;
        camera.updateProjectionMatrix();
      }
    };
    // Authored camera moves bypass OrbitControls' angle constraints. Only the
    // settled interactive view hands over to orbiting, so no controller fights
    // the low collector shot or the camera's vertical travelling moves.
    const beginTransition = (instant=false) => {
      film.active=false;
      film.paused=false;
      film.dispensing=false;
      publishFilm();
      interactivePose();
      transition={
        time: 0, duration: instant || reduceMotion.matches ? 0 : 1.65,
        position: camera.position.clone(), target: controls.target.clone(),
        fov: camera.fov, exposure: renderer.toneMappingExposure,
        environment: scene.environmentIntensity, key: key.position.clone(), light: key.intensity,
      };
      controls.enabled=false;
      dirty=true;
    };
    const startFilm = (dispense=false) => {
      detailSeen=actions.current.detail;
      modeSeen=actions.current.mode;
      film.time=dispense?10.1:0;
      film.dispensing=dispense;
      film.elapsed=dispense&&reduceMotion.matches?4.7:0;
      film.entry=dispense&&!reduceMotion.matches?{position:camera.position.clone(),target:controls.target.clone(),collector:collector?.position.clone()}:null;
      film.paused=dispense&&reduceMotion.matches;
      film.active=dispense||!reduceMotion.matches;
      transition=null;
      controls.enabled=false;
      if (collector) collector.position.copy(collectorHome);
      if (holder) holder.rotation.x=0;
      placements.forEach(placement=>placement.reset());
      blend?.setFill(dispense&&reduceMotion.matches?1:0);
      blendComplete=dispense&&reduceMotion.matches;
      setBlendReady(blendComplete);
      if (reduceMotion.matches&&!dispense) beginTransition(true);
      else publishFilm();
      dirty=true;
    };
    transport.current={
      skip: () => beginTransition(),
      pause: () => { film.paused=!film.paused; publishFilm(); dirty=true; },
      chapter: time => { film.dispensing=false; film.entry=null; film.time=time; publishFilm(); dirty=true; },
      inspectBlend:()=>{
        film.active=true;
        film.paused=true;
        film.dispensing=true;
        film.elapsed=4.7;
        film.time=11.6;
        film.entry=null;
        transition=null;
        controls.enabled=false;
        blend?.setFill(1);
        const stage=container.closest('.hero-stage');
        stage?.focus({preventScroll:true});
        stage?.scrollIntoView({behavior:reduceMotion.matches?'instant':'smooth',block:'center'});
        publishFilm();
        dirty=true;
      },
    };
    const motionChange = () => { if (reduceMotion.matches) beginTransition(true); };
    reduceMotion.addEventListener('change',motionChange);
    let last = performance.now();
    const tick = now => {
      frame = requestAnimationFrame(tick);
      if (disposed || !inView || document.hidden) { last = now; return; }
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (replaySeen !== replayRef.current) {
        replaySeen = replayRef.current;
        if (model) startFilm();
      }
      if (model) {
        if (detailSeen !== actions.current.detail || modeSeen !== actions.current.mode) {
          detailSeen = actions.current.detail;
          modeSeen = actions.current.mode;
          beginTransition();
        }
        if(actions.current.dispensing>dispenseSeen&&viewRatio>=.65){
          if(film.active)beginTransition();
          if(placements.every(placement=>placement.progress===0)&&(!holder||Math.abs(holder.rotation.x)<.02)){
            dispenseSeen=actions.current.dispensing;
            startFilm(true);
          }
        }
        if (film.active) {
          if(film.dispensing){
            if(!film.paused)film.elapsed+=dt;
            film.time=Math.min(10.1+Math.max(0,film.elapsed-3.2),FILM_DURATION);
            if(blend?.setFill((film.elapsed-.9)/2))dirty=true;
            if(film.elapsed>=2.9&&!blendComplete){blendComplete=true;setBlendReady(true);}
          }else if (!film.paused) film.time=Math.min(film.time+dt,FILM_DURATION);
          sampleFilm(film.time,camera.aspect,pose);
          // A higher version of the collector shot reveals the blend below the
          // front rim; ease back to the original composition for the final reveal.
          if(film.dispensing)pose.position.y+=.4*(1-THREE.MathUtils.smootherstep(film.time,13,FILM_DURATION));
          const arrival=film.entry?THREE.MathUtils.smootherstep(film.elapsed,0,.9):1;
          if(film.entry){
            camera.position.lerpVectors(film.entry.position,pose.position,arrival);
            controls.target.lerpVectors(film.entry.target,pose.target,arrival);
          }else{
            camera.position.copy(pose.position);
            controls.target.copy(pose.target);
          }
          camera.lookAt(controls.target);
          setLens(pose.fov);
          renderer.toneMappingExposure=pose.exposure;
          scene.environmentIntensity=pose.environment;
          key.position.copy(pose.key);
          key.intensity=pose.light;
          if (collector) collector.position.copy(collectorHome).add(pose.collector);
          if(collector&&film.entry?.collector)collector.position.lerpVectors(film.entry.collector,pose.scratch.copy(collectorHome).add(pose.collector),arrival);
          if (holder && Math.abs(holder.rotation.x-pose.holder)>.000001) {
            holder.rotation.x=pose.holder;
            dirty=true;
          }
          for (const placement of placements) {
            if (placement.seek(placement.key==='phone' ? pose.phone : 0)) dirty=true;
          }
          const chapter=filmChapter(film.time);
          const chapterStart=FILM_CHAPTERS[chapter].time;
          const chapterEnd=FILM_CHAPTERS[chapter+1]?.time ?? FILM_DURATION;
          timeline.current?.style.setProperty('--chapter-progress',(film.time-chapterStart)/(chapterEnd-chapterStart));
          if (chapter!==film.chapter) publishFilm();
          if (!film.paused) dirty=true;
          if (film.time>=FILM_DURATION) {
            film.active=false;
            publishFilm();
            resetLighting();
            controls.enabled=true;
            dirty=true;
          }
        } else if (transition) {
          transition.time+=dt;
          interactivePose();
          const progress=transition.duration ? Math.min(transition.time/transition.duration,1) : 1;
          const t=progress*progress*progress*(progress*(progress*6-15)+10);
          camera.position.lerpVectors(transition.position,endPosition,t);
          controls.target.lerpVectors(transition.target,endTarget,t);
          camera.lookAt(controls.target);
          setLens(THREE.MathUtils.lerp(transition.fov,31,t));
          renderer.toneMappingExposure=THREE.MathUtils.lerp(transition.exposure,.94,t);
          scene.environmentIntensity=THREE.MathUtils.lerp(transition.environment,.8,t);
          key.position.lerpVectors(transition.key,pose.key.set(-.6,1.5,1.2),t);
          key.intensity=THREE.MathUtils.lerp(transition.light,1.6,t);
          if (progress===1) { transition=null; controls.enabled=true; }
          dirty=true;
        }
        if (!film.active && collector && collector.position.distanceToSquared(collectorHome)>.0000000001) {
          if (reduceMotion.matches) collector.position.copy(collectorHome);
          else collector.position.lerp(collectorHome,1-Math.exp(-7*dt));
          dirty=true;
        }
        if (!film.active) {
          const accessoryMode=actions.current.mode;
          // Remove an accessory along its visible path before closing the holder
          // or introducing the alternative. Neither object can pop into place.
          for (const placement of placements) {
            if (placement.key!==accessoryMode && placement.update(false,dt,reduceMotion.matches)) dirty=true;
          }
          const open = accessoryMode!=='closed' || placements.some(placement=>placement.progress>0);
          if (holder) {
            const previous = holder.rotation.x;
            holder.rotation.x = reduceMotion.matches ? (open ? Math.PI/2 : 0) : THREE.MathUtils.damp(holder.rotation.x, open ? Math.PI/2 : 0, 7, dt);
            if (Math.abs(previous-holder.rotation.x)>0.00001) dirty = true;
          }
          const holderReady = holder && holder.rotation.x > 1.54;
          for (const placement of placements) {
            const othersClear=placements.every(other=>other===placement || other.progress===0);
            if (placement.key===accessoryMode && othersClear && (holderReady || reduceMotion.matches)) {
              if (placement.update(true,dt,reduceMotion.matches)) dirty=true;
            }
          }
        }
        if(blend?.stream(film.elapsed,film.active&&film.dispensing&&film.elapsed>.9&&film.elapsed<2.9&&!reduceMotion.matches))dirty=true;
      }
      if (!film.active && !transition) controls.update();
      if (dirty) {
        renderer.render(scene, camera);
        dirty=false;
        refinedFrame=false;
        lastMotion=now;
      } else if (!refinedFrame && !drag && now-lastMotion>160 && model) {
        composer.render();
        refinedFrame=true;
      }
    };
    frame = requestAnimationFrame(tick);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      observer.disconnect();
      transport.current=null;
      reduceMotion.removeEventListener('change',motionChange);
      controls.dispose();
      draco.dispose();
      supersampling.dispose();
      outputPass.dispose();
      composer.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', loseContext);
      renderer.domElement.removeEventListener('webglcontextrestored', restoreContext);
      disposeTree(scene);
      environment.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [contextVersion]);

  return <><div className={`product-scene ${status} ${filmState.active?'cinematic':''}`}>
    <div ref={host} className="canvas-host" />
    {status !== 'ready' && <img className="scene-poster" src={`/previews/${detail?'detail':mode}.png`} alt={detail?'Close-up of the MySpice reservoirs and spices':`Satin silver MySpice dispenser, ${mode === 'closed' ? 'with the phone holder closed' : `supporting a ${mode}`}`} />}
    {status === 'loading' && <span className="scene-loading">Setting the scene<span>…</span></span>}
    <span className="sr-only">A satin silver wall-mounted spice dispenser with fourteen clear reservoirs and a removable collector. The film opens with a downward pass along the silver edge to the base, demonstrates the door opening and a phone settling onto its support, slides the collector out and back, and reveals the complete product. Use the configuration buttons after the film to explore the optional phone or paper support.</span>
  </div>
  {status==='ready'&&blendReady&&!filmState.active&&<button className="blend-result-button" onClick={()=>transport.current?.inspectBlend()}>View collected blend <span aria-hidden="true">↗</span></button>}
  {status==='ready' && filmState.active && <div className="cinema-player" ref={timeline}>
    <div className="cinema-caption" key={filmState.chapter}>
      <span className="cinema-number">{String(filmState.chapter+1).padStart(2,'0')} / {String(FILM_CHAPTERS.length).padStart(2,'0')}</span>
      <span>{filmState.dispensing&&filmState.chapter===2?'Your spice blend':FILM_CHAPTERS[filmState.chapter].label}<small>{filmState.dispensing&&filmState.chapter===2?'Watch it collect. Slide free. Pour.':FILM_CHAPTERS[filmState.chapter].description}</small></span>
    </div>
    <div className="cinema-transport">
      <button onClick={()=>transport.current?.pause()} aria-label={filmState.paused?'Play product film':'Pause product film'} title={filmState.paused?'Play':'Pause'}>{filmState.paused?<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m5 3 8 5-8 5Z" fill="currentColor"/></svg>:<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3v10M11 3v10" stroke="currentColor" strokeWidth="2"/></svg>}</button>
      <button className="cinema-skip" onClick={()=>transport.current?.skip()}>Skip film <span aria-hidden="true">↗</span></button>
    </div>
    <div className="cinema-chapters" aria-label="Product film chapters">
      {FILM_CHAPTERS.map((chapter,index)=><button key={chapter.time} onClick={()=>transport.current?.chapter(chapter.preview)} aria-label={`Jump to ${chapter.label}`} aria-current={filmState.chapter===index?'step':undefined} title={chapter.label} className={index<filmState.chapter?'complete':''}><span/></button>)}
    </div>
    {filmState.dispensing&&blendReady&&<button className="cinema-inspect" onClick={()=>transport.current?.inspectBlend()}>Inspect blend <span aria-hidden="true">↗</span></button>}
  </div>}
  </>;
}

function disposeTree(tree) {
  const textures = new Set();
  const materials = new Set();
  tree.traverse(obj => {
    obj.geometry?.dispose();
    const mats = obj.material ? (Array.isArray(obj.material) ? obj.material : [obj.material]) : [];
    mats.forEach(mat => { materials.add(mat); Object.values(mat).forEach(value => { if (value?.isTexture) textures.add(value); }); });
  });
  textures.forEach(tex => tex.dispose());
  materials.forEach(mat => mat.dispose());
}
