"""Visible packed grain layers and naturally settled fill surfaces.

Thousands of small pieces are batched into a single mesh per reservoir. Surface
color is a vertex attribute, so the browser needs only one material per grain type.
"""
import math
import random
import bpy
from mathutils import Vector

BASE_COLORS=[(128,40,18),(155,54,22),(192,170,125),(92,94,52),(144,114,65),(188,139,13),(122,81,40),(55,47,35),(185,151,95),(164,120,22),(78,88,43),(137,42,19),(209,189,139),(222,220,207)]

def linear(c):
    v=c/255
    return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4

def top_height(x,y,height,index):
    r=math.hypot(x,y)/.015
    mound=.0017*(1-r*r)
    slope=math.sin(index*2.3)*x*.055+math.cos(index*1.4)*y*.035
    noise=.00014*math.sin(x*1200+index)*math.cos(y*950-index)
    return .152+height+mound+slope+noise

def fill_volume(collection,parent,index,name,kind,x,height,material):
    n=96
    levels=[0]
    for start in range(math.ceil(height/.09)):
        levels.extend(min(height,start*.09+j*.09/10) for j in range(1,11) if start*.09+(j-1)*.09/10<height)
    vertical=len(levels)-1
    radius=.0152 if kind=="powder" else .01455
    vertices=[];faces=[];uvs=[]
    for row in range(vertical+1):
        t=levels[row]/height
        for j in range(n+1):
            theta=j*math.tau/n
            xx,yy=radius*math.cos(theta),radius*math.sin(theta)
            z=.152+t*(top_height(xx,yy,height,index)-.152)
            ripple=.00007*math.sin(theta*17+row*1.6+index)
            vertices.append((x+(radius+ripple)*math.cos(theta),-.012+(radius+ripple)*math.sin(theta),z))
            uvs.append((j/n, t*height/.175))
    for row in range(vertical):
        for j in range(n):
            a=row*(n+1)+j
            faces.append((a,a+1,a+n+2,a+n+1))
    # Concentric settled surface with UVs laid out in physical scale.
    first=len(vertices)
    rings=10
    for ring in range(rings+1):
        r=radius*ring/rings
        for j in range(n+1):
            a=j*math.tau/n
            xx,yy=r*math.cos(a),r*math.sin(a)
            vertices.append((x+xx,-.012+yy,top_height(xx,yy,height,index)-(0 if kind=="powder" else .00035)))
            uvs.append((.5+xx/.096,.5+yy/.175))
    for ring in range(rings):
        for j in range(n):
            a=first+ring*(n+1)+j
            faces.append((a,a+n+1,a+n+2,a+1))
    mesh=bpy.data.meshes.new("Settled fill "+name)
    mesh.from_pydata(vertices,[],faces);mesh.update()
    uv=mesh.uv_layers.new(name="Physical grain scale")
    for loop in mesh.loops:
        uv.data[loop.index].uv=uvs[loop.vertex_index]
    # UV atlas mapping stays within each photographed region. Vertical mesh
    # rings coincide with texture wrap points, avoiding stretched grain shapes.
    atlas=mesh.uv_layers.new(name="Photographic grain scale")
    col,row={"powder":(0,1),"herb":(1,1),"flake":(2,1),"pepper":(0,0),"seed":(1,0),"salt":(2,0)}[kind]
    for poly in mesh.polygons:
        side=poly.index < vertical*n
        physical=[uvs[mesh.loops[li].vertex_index][1]*.175 for li in poly.loop_indices]
        tile=math.floor((min(physical)+max(physical))*.5/.09) if side else 0
        for li in poly.loop_indices:
            vi=mesh.loops[li].vertex_index
            if side:
                u=uvs[vi][0];v=uvs[vi][1]*.175/.09-tile
            else:
                point=mesh.vertices[vi].co
                u=.5+(point.x-x)/.09;v=.5+(point.y+.012)/.09
            atlas.data[li].uv=((col+.003+u*.994)/3,(row+.003+v*.994)/2)
    mesh.materials.append(material)
    for poly in mesh.polygons:poly.use_smooth=True
    obj=bpy.data.objects.new("MS_Spice_%02d_%s"%(index+1,name),mesh)
    collection.objects.link(obj);obj.parent=parent
    return obj

def packed_grains(collection,parent,index,name,kind,x,height):
    rng=random.Random(index*781+930)
    count={"powder":2100,"herb":4200,"flake":3700,"pepper":2900,"seed":2600,"salt":2600}[kind]
    verts=[];faces=[];colors=[]
    base=BASE_COLORS[index]
    for grain in range(count):
        is_top=rng.random()<.16
        theta=rng.uniform(0,math.tau)
        if is_top:
            r=.0145*math.sqrt(rng.random())
            xx,yy=r*math.cos(theta),r*math.sin(theta)
            rough_top=.0001 if kind=="powder" else .00085
            center=Vector((x+xx,-.012+yy,top_height(xx,yy,height,index)+rng.uniform(-rough_top*.5,rough_top)))
            normal=Vector((0,0,1));u=Vector((1,0,0));v=Vector((0,1,0))
        else:
            r=.01523 if kind=="powder" else .01495
            normal=Vector((math.cos(theta),math.sin(theta),0))
            u=Vector((-math.sin(theta),math.cos(theta),0));v=Vector((0,0,1))
            z=rng.uniform(.153,.151+height)
            center=Vector((x+r*math.cos(theta),-.012+r*math.sin(theta),z))
        angle=rng.uniform(0,math.tau)
        u,v=u*math.cos(angle)+v*math.sin(angle),-u*math.sin(angle)+v*math.cos(angle)
        shade=rng.uniform(.64,1.35)
        tint=base
        if kind=="flake" and rng.random()<.18:tint=(202,158,80)
        if kind=="herb" and rng.random()<.24:tint=(119,101,63)
        if kind=="pepper" and rng.random()<.15:tint=(160,143,107)
        color=tuple(linear(min(255,c*shade)) for c in tint)+(1,)
        first=len(verts)
        if kind in ("herb","flake"):
            sides=rng.randint(5,7)
            w=rng.uniform(.00028,.00070)
            length=w*rng.uniform(1.1,2.2)
            depth=rng.uniform(.000035,.00010)
            # A bent center and jagged perimeter make torn leaf / skin fragments.
            verts.append(center+normal*depth*2)
            for j in range(sides):
                a=j*math.tau/sides
                rr=rng.uniform(.7,1.15)
                verts.append(center+u*(math.cos(a)*w*rr)+v*(math.sin(a)*length*rr)+normal*rng.uniform(-depth,depth))
            for j in range(sides):faces.append((first,first+1+j,first+1+(j+1)%sides))
        elif kind=="seed":
            # Tapered sesame hulls rather than round gravel.
            w=rng.uniform(.00032,.00043);length=rng.uniform(.00075,.00105);depth=.00022
            for ring in range(5):
                a=math.pi*ring/4
                for j in range(6):
                    b=j*math.tau/6
                    verts.append(center+v*(math.cos(a)*length)+u*(math.sin(a)*math.cos(b)*w)+normal*(math.sin(a)*math.sin(b)*depth))
            for ring in range(4):
                for j in range(6):
                    a=first+ring*6+j;b=first+ring*6+(j+1)%6
                    faces.append((a,b,b+6,a+6))
        else:
            scale=rng.uniform(.000075,.00017) if kind=="powder" else rng.uniform(.00025,.0006)
            if kind=="salt":
                # Uneven crystal faces, kept intentionally angular.
                for dx,dy,dz in ((-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)):
                    verts.append(center+u*dx*scale+v*dy*scale*rng.uniform(.7,1.2)+normal*dz*scale*.6)
                faces.extend(tuple(first+i for i in f) for f in ((0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)))
            else:
                for direction in (u,-u,v,-v,normal,-normal):verts.append(center+direction*scale*rng.uniform(.7,1.25))
                faces.extend(tuple(first+i for i in f) for f in ((0,2,4),(2,1,4),(1,3,4),(3,0,4),(2,0,5),(1,2,5),(3,1,5),(0,3,5)))
        colors.extend([color]*(len(verts)-first))
    mesh=bpy.data.meshes.new("Packed individual grains "+name)
    mesh.from_pydata(verts,[],faces);mesh.update()
    attr=mesh.color_attributes.new(name="Col",type="BYTE_COLOR",domain="POINT")
    for i,color in enumerate(colors):attr.data[i].color=color
    mat=bpy.data.materials.new("Grains | "+name);mat.use_nodes=True
    bsdf=mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Roughness"].default_value=.86 if kind in ("powder","herb") else .68
    node=mat.node_tree.nodes.new("ShaderNodeVertexColor");node.layer_name="Col"
    mat.node_tree.links.new(node.outputs["Color"],bsdf.inputs["Base Color"])
    mesh.materials.append(mat)
    # Flakes and salt should keep their small flat facets, seeds have smooth hulls.
    for poly in mesh.polygons:poly.use_smooth=kind=="seed"
    obj=bpy.data.objects.new("MS_Grains_%02d_%s"%(index+1,name),mesh)
    collection.objects.link(obj);obj.parent=parent
    return obj
