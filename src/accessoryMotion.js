import * as THREE from 'three';

// Accessories arrive from outside the view and settle onto the open support.
// Reversing the same path lifts them clear before the support can fold away.
export function createPlacement(object, key) {
  if (!object) return null;
  const home=object.position.clone();
  const rest=object.quaternion.clone();
  const curve=new THREE.CubicBezierCurve3(
    home.clone().add(new THREE.Vector3(.95,.22,.16)),
    home.clone().add(new THREE.Vector3(.34,.22,.16)),
    home.clone().add(new THREE.Vector3(.025,.055,.080)),
    home.clone(),
  );
  const lifted=rest.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,-.16)));
  const motion={
    key, object, progress: 0,
    seek(progress) {
      const previous=this.progress;
      this.progress=THREE.MathUtils.clamp(progress,0,1);
      const visible=this.progress>0;
      const changed=previous!==this.progress || object.visible!==visible;
      if (!changed) return false;
      const t=THREE.MathUtils.smootherstep(this.progress,0,1);
      curve.getPoint(t,object.position);
      object.quaternion.slerpQuaternions(lifted,rest,t);
      object.visible=visible;
      return true;
    },
    update(enter, dt, instant=false) {
      return this.seek(instant ? (enter ? 1 : 0) : this.progress+(enter ? 1 : -1)*dt/1.65);
    },
    reset() {
      this.progress=0;
      curve.getPoint(0,object.position);
      object.quaternion.copy(lifted);
      object.visible=false;
    },
  };
  motion.reset();
  return motion;
}
