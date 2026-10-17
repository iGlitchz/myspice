"""Create physical-scale, deterministic PBR textures for the model generator.

These are material maps, not edited project reference images. Geometry provides
the coarse particles; the maps supply the small packed fragments between them.
"""
from pathlib import Path
import math
import random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parents[1] / "model" / "textures"
OUT.mkdir(parents=True, exist_ok=True)
W, H = 512, 1024

SPECS = [
    ("Chilli", "flake", (128, 40, 18)),
    ("Paprika", "powder", (155, 54, 22)),
    ("Garlic", "powder", (192, 170, 125)),
    ("Oregano", "herb", (92, 94, 52)),
    ("Coriander", "powder", (144, 114, 65)),
    ("Turmeric", "powder", (188, 139, 13)),
    ("Cumin", "powder", (122, 81, 40)),
    ("Black_pepper", "pepper", (55, 47, 35)),
    ("Ginger", "powder", (185, 151, 95)),
    ("Curry", "powder", (164, 120, 22)),
    ("Basil", "herb", (78, 88, 43)),
    ("Chilli_flakes", "flake", (137, 42, 19)),
    ("Sesame", "seed", (209, 189, 139)),
    ("Sea_salt", "salt", (222, 220, 207)),
]

def noise(rng, x, y):
    small = Image.fromarray(np.uint8(rng.uniform(0, 255, (y, x))), "L")
    return np.asarray(small.resize((W,H), Image.Resampling.BICUBIC), dtype=np.float32)/255

for index, (name, kind, base) in enumerate(SPECS):
    rng = np.random.default_rng(891 + index)
    rand = random.Random(891 + index)
    macro = noise(rng, 16, 32)
    medium = noise(rng, 85, 170)
    fine = rng.uniform(0,1,(H,W)).astype(np.float32)
    value = (macro-.5)*.16 + (medium-.5)*.18 + (fine-.5)*.18
    pixels = np.clip(np.array(base)[None,None,:]*(1+value[:,:,None]),0,255).astype(np.uint8)
    color = Image.fromarray(pixels,"RGB")
    height = Image.fromarray(np.uint8(np.clip(.40+value*.8,0,1)*255),"L")
    draw = ImageDraw.Draw(color)
    hd = ImageDraw.Draw(height)
    if kind != "powder":
        count = {"herb":4300,"flake":3600,"pepper":4700,"seed":2600,"salt":3500}[kind]
        for grain in range(count):
            x, y = rand.uniform(-20,W+20),rand.uniform(-20,H+20)
            angle = rand.random()*math.tau
            size = rand.uniform(2,8) if kind in ("herb","flake") else rand.uniform(2,5)
            aspect = 2.1 if kind == "seed" else rand.uniform(.5,1.9)
            n = 8 if kind == "seed" else rand.randint(5,8)
            points=[]
            for j in range(n):
                theta=j*math.tau/n
                radius=1 if kind=="seed" else rand.uniform(.65,1.15)
                a=math.cos(theta)*size*radius
                b=math.sin(theta)*size*aspect*radius
                points.append((x+a*math.cos(angle)-b*math.sin(angle),y+a*math.sin(angle)+b*math.cos(angle)))
            brightness=rand.uniform(.58,1.48)
            tint=np.array(base,dtype=float)
            if kind=="flake" and rand.random()<.16:
                tint=np.array((202,158,80));brightness=rand.uniform(.65,1.1)
            if kind=="herb" and rand.random()<.24:
                tint=np.array((117,98,61));brightness=rand.uniform(.65,1.1)
            if kind=="pepper" and rand.random()<.16:
                tint=np.array((152,134,100))
            tint=tuple(np.uint8(np.clip(tint*brightness,0,255)))
            outline=tuple(int(v*.68) for v in tint)
            draw.polygon(points,fill=tint,outline=outline)
            elevation=rand.randint(95,240)
            hd.polygon(points,fill=elevation,outline=65)
            if kind in ("herb","seed"):
                a=(x-math.cos(angle)*size*.65,y-math.sin(angle)*size*.65)
                b=(x+math.cos(angle)*size*.65,y+math.sin(angle)*size*.65)
                draw.line((a,b),fill=tuple(int(v*.76) for v in tint),width=1)
    else:
        # Fine powder has irregular agglomerations, rather than vertical stripes.
        for grain in range(9000):
            x,y=rand.randrange(W),rand.randrange(H)
            r=rand.choice((.5,.6,.8,1,1.4))
            light=rand.uniform(.65,1.25)
            tint=tuple(int(min(255,c*light)) for c in base)
            draw.ellipse((x-r,y-r,x+r,y+r),fill=tint)
            hd.ellipse((x-r,y-r,x+r,y+r),fill=rand.randint(105,210))
    height=height.filter(ImageFilter.GaussianBlur(.55))
    field=np.asarray(height,dtype=np.float32)/255
    gy,gx=np.gradient(field)
    strength=1.0 if kind=="powder" else 2.2
    normals=np.stack((-gx*strength,-gy*strength,np.ones_like(field)),axis=-1)
    normals/=np.linalg.norm(normals,axis=-1,keepdims=True)
    normal=Image.fromarray(np.uint8(np.clip(normals*.5+.5,0,1)*255),"RGB")
    color.save(OUT/f"{name}-color.jpg",quality=91,subsampling=0)
    normal.resize((256,512),Image.Resampling.LANCZOS).save(OUT/f"{name}-normal.jpg",quality=90,subsampling=0)
    print(name,kind,flush=True)

# Extremely fine horizontal finishing grain; it must stay subtle in highlights.
rng=np.random.default_rng(41)
size=512
stripe=np.repeat(rng.uniform(-1,1,(size,1)),size,axis=1)
micro=rng.uniform(-1,1,(size,size))
finish=0.5+stripe*.045+micro*.012
gy,gx=np.gradient(finish)
normal=np.stack((-gx*.4,-gy*.4,np.ones_like(finish)),axis=-1)
normal/=np.linalg.norm(normal,axis=-1,keepdims=True)
Image.fromarray(np.uint8((normal*.5+.5)*255),"RGB").save(OUT/"satin-normal.png",optimize=True)
rough=np.uint8(np.clip(.31+stripe*.009+micro*.003,0,1)*255)
Image.fromarray(rough,"L").save(OUT/"satin-roughness.png",optimize=True)
print("MATERIAL_MAPS_READY",flush=True)
