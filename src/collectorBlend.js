import * as THREE from 'three';

// All coordinates share the collector's exported Y-up frame, in metres.
// The blend sits above the 10 mm channel floor and below its 35 mm rim.
export function createCollectorBlend(collector) {
  if (!collector) return null;
  const deposits=new THREE.Group();
  deposits.name='MS_Demo_Spice_Blend';
  deposits.position.y=.0106;
  deposits.visible=false;
  collector.add(deposits);
  const palette=['#a28755','#a45432','#717047'];
  const centers=[-.085,0,.085];
  let seed=28413;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const transform=new THREE.Object3D();
  const grainGeometry=new THREE.DodecahedronGeometry(1,0);
  const color=new THREE.Color();
  centers.forEach((x,index)=>{
    const base=new THREE.Color(palette[index]);
    const material=new THREE.MeshStandardMaterial({color:base,roughness:.96,metalness:0});
    const moundGeometry=new THREE.SphereGeometry(1,32,14,0,Math.PI*2,0,Math.PI/2);
    const surface=moundGeometry.attributes.position;
    for(let vertex=0;vertex<surface.count;vertex++){
      const angle=Math.atan2(surface.getZ(vertex),surface.getX(vertex));
      const outline=1+.07*Math.sin(angle*3+index)+.035*Math.cos(angle*7-index);
      surface.setXYZ(vertex,surface.getX(vertex)*outline,surface.getY(vertex)*(1+.1*Math.sin(angle*5+index)),surface.getZ(vertex)*outline);
    }
    moundGeometry.computeVertexNormals();
    const mound=new THREE.Mesh(moundGeometry,material);
    mound.position.set(x,0,-.003);
    mound.scale.set(.022,.007,.010);
    deposits.add(mound);
    const grains=new THREE.InstancedMesh(grainGeometry,new THREE.MeshStandardMaterial({roughness:.92,metalness:0}),1100);
    for(let i=0;i<1100;i++){
      const angle=random()*Math.PI*2;
      const radius=Math.sqrt(random());
      const outline=1+.07*Math.sin(angle*3+index)+.035*Math.cos(angle*7-index);
      const height=.007*Math.sqrt(1-radius*radius)*(1+.1*Math.sin(angle*5+index));
      transform.position.set(x+Math.cos(angle)*radius*.022*outline,height+random()*.0004,-.003+Math.sin(angle)*radius*.010*outline);
      transform.rotation.set(random()*Math.PI,random()*Math.PI,random()*Math.PI);
      const size=.00028+random()*.00035;
      transform.scale.set(size*(.7+random()),size*(.4+random()*.6),size*(.6+random()));
      transform.updateMatrix();
      grains.setMatrixAt(i,transform.matrix);
      color.copy(base).multiplyScalar(.65+random()*.65);
      grains.setColorAt(i,color);
    }
    grains.instanceMatrix.needsUpdate=true;
    deposits.add(grains);
  });
  const count=180;
  const positions=new Float32Array(count*3);
  const colors=new Float32Array(count*3);
  for(let i=0;i<count;i++)new THREE.Color(palette[i%3]).multiplyScalar(1.15).toArray(colors,i*3);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const stream=new THREE.Points(geometry,new THREE.PointsMaterial({size:.0014,vertexColors:true,transparent:true,opacity:.9,depthWrite:false}));
  stream.name='MS_Demo_Falling_Spices';
  stream.frustumCulled=false;
  stream.visible=false;
  collector.add(stream);
  let fill=0;
  return {
    setFill(value){
      const next=THREE.MathUtils.clamp(value,0,1);
      if(next===fill)return false;
      fill=next;
      deposits.visible=fill>0;
      deposits.scale.y=Math.max(.001,fill);
      return true;
    },
    stream(time,visible){
      const changed=stream.visible!==visible;
      stream.visible=visible;
      if(!visible)return changed;
      for(let i=0;i<count;i++){
        const phase=(time*2.5+i*.037)%1;
        positions[i*3]=centers[i%3]+Math.sin(i*37)*.002;
        positions[i*3+1]=.045-phase*.028;
        positions[i*3+2]=-.003+Math.sin(i*13)*.002;
      }
      geometry.attributes.position.needsUpdate=true;
      return true;
    },
  };
}
