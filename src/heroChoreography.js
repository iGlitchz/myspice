// Camera coordinates are in metres: Y is up, +Z is the front of the appliance.
// The collector is removable, so its reveal is a straight lift away from the
// casing, without suggesting an unverified internal rail mechanism.
export const FILM_DURATION = 21;
export const HERO_POSITION = [.50,.405,1.08];
export const fullProductDistance = aspect => Math.min(1.45,Math.max(1,1.18/aspect));

export const FILM_CHAPTERS = [
  { time: 0, preview: 1.5, label: 'Satin silver', description: 'Light along the silver shoulder.' },
  { time: 3, preview: 6.5, label: 'Room for your recipe', description: 'An optional place for your phone.' },
  { time: 9, preview: 11.5, label: 'The removable collector', description: 'Slide free. Collect. Pour.' },
  { time: 13, preview: 16.7, label: 'Considered edges', description: 'Follow the silver down to the base.' },
  { time: 17, preview: 19.7, label: 'Meet MySpice', description: 'The complete form, revealed.' },
];

// Deliberate holds alternate with travelling shots. Each frame carries its own
// lens and light treatment; the final pose matches the interactive orbit view.
const frames = [
  { t: 0, p: [.434,.410,.192], at: [.312,.375,.024], fov: 32, exposure: .72, environment: .58, key: [-1.2,.8,1.4], light: 1.8 },
  { t: 3, p: [.417,.355,.222], at: [.310,.324,.024], fov: 31, exposure: .94, environment: .8, key: [-.45,1.4,1.2], light: 1.6 },
  { t: 4.2, p: [.230,.180,.620], at: [.025,.105,.055], fov: 34, exposure: .94, environment: .8, key: [-.6,1.1,1.2], light: 1.6 },
  { t: 6.5, p: [.200,.190,.680], at: [0,.110,.050], fov: 34, exposure: .94, environment: .8, key: [-.6,1.1,1.2], light: 1.6 },
  { t: 9, p: [.128,.106,.306], at: [.018,.060,.038], fov: 34, exposure: .9, environment: .75, key: [-.8,.8,1.4], light: 1.6 },
  { t: 10.6, p: [.290,.215,.800], at: [.015,.045,.100], fov: 35, exposure: .94, environment: .8, key: [-.6,1.1,1.2], light: 1.6 },
  { t: 12, p: [.330,.250,.900], at: [0,.055,.110], fov: 35, exposure: .94, environment: .8, key: [-.6,1.1,1.2], light: 1.6 },
  { t: 13, p: [.330,.250,.900], at: [0,.055,.110], fov: 35, exposure: .94, environment: .8, key: [-.6,1.1,1.2], light: 1.6 },
  { t: 14.1, p: [.430,.330,.240], at: [.311,.290,.024], fov: 32, exposure: .9, environment: .76, key: [-1.2,.8,1.4], light: 1.8 },
  { t: 17, p: [.425,.080,.238], at: [.311,.030,.024], fov: 31, exposure: .94, environment: .8, key: [-.45,1.4,1.2], light: 1.6 },
  { t: 21, p: HERO_POSITION, at: [0,.215,0], fov: 31, exposure: .94, environment: .8, key: [-.6,1.5,1.2], light: 1.6 },
];

const smooth = t => t*t*t*(t*(t*6-15)+10);
const mix = (a,b,t) => a+(b-a)*t;
const ramp = (t,a,b) => Math.max(0,Math.min(1,(t-a)/(b-a)));
const interval = (t,a,b) => smooth(ramp(t,a,b));

export function filmChapter(time) {
  let index = FILM_CHAPTERS.length-1;
  while (index > 0 && time < FILM_CHAPTERS[index].time) index--;
  return index;
}

// Reuse caller-owned vectors so the animation doesn't allocate every frame.
export function sampleFilm(time, aspect, pose) {
  let index = 0;
  while (index < frames.length-2 && time > frames[index+1].t) index++;
  const a=frames[index], b=frames[index+1];
  const t=interval(time,a.t,b.t);
  pose.position.set(...a.p).lerp(pose.scratch.set(...b.p),t);
  pose.target.set(...a.at).lerp(pose.scratch.set(...b.at),t);
  pose.key.set(...a.key).lerp(pose.scratch.set(...b.key),t);
  pose.fov=mix(a.fov,b.fov,t);
  pose.exposure=mix(a.exposure,b.exposure,t);
  pose.environment=mix(a.environment,b.environment,t);
  pose.light=mix(a.light,b.light,t);

  // Keep the final product in frame on a portrait stage without shrinking macros.
  const portrait=fullProductDistance(aspect);
  const pullback=interval(time,17,FILM_DURATION);
  const collectorShot=interval(time,9,10.6)*(1-interval(time,13,14.1));
  const collectorDistance=Math.max(1,Math.min(1.55,1.35/aspect));
  pose.position.sub(pose.target).multiplyScalar(1+(collectorDistance-1)*collectorShot).add(pose.target);
  pose.position.sub(pose.target).multiplyScalar(mix(1,portrait,pullback)).add(pose.target);
  // A horizontal path below the body's mating plane, including the return.
  // The rebuilt collector has 0.6 mm of clearance at every point on this path.
  const extension=interval(time,9.2,10.8)*(1-interval(time,11.9,12.9));
  pose.collector.set(0,0,.145*extension);
  // These poses use film time, so pausing or selecting a chapter freezes/seeks
  // the door and the phone along with the camera. The phone clears first.
  pose.holder=Math.PI/2*interval(time,3.8,4.6)*(1-interval(time,8.4,9));
  pose.phone=ramp(time,4.6,6.1)*(1-ramp(time,7.2,8.4));
  return pose;
}
