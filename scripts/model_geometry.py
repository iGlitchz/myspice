"""Matched manufactured surfaces for the MySpice visual model.

All housing parts share one horizontal outline. The silver housing ends on
flat mating planes, with rounded side edges continuing into both black parts.
Coordinates use Blender's Z-up / -Y-front convention, in metres.
"""
import math
import bpy
import bmesh

WIDTH = .660
DEPTH = .086
CORNER = .011
SHELL_BOTTOM = .0356
SHELL_TOP = .4318
COLLECTOR_TOP = .0350
LID_BOTTOM = .4324
LID_TOP = .4388


def rounded_outline(width, height, radius, center_z=0, segments=40):
    points = []
    for cx, cz, start in (
        (width/2-radius, center_z+height/2-radius, 0),
        (-width/2+radius, center_z+height/2-radius, 90),
        (-width/2+radius, center_z-height/2+radius, 180),
        (width/2-radius, center_z-height/2+radius, 270),
    ):
        for i in range(segments):
            a = math.radians(start+i*90/(segments-1))
            points.append((cx+radius*math.cos(a), cz+radius*math.sin(a)))
    return points


def _mesh_object(collection, parent, name, material, vertices, faces):
    mesh = bpy.data.meshes.new(name+" | continuous surface")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    obj.parent = parent
    if material:
        mesh.materials.append(material)
    return obj


def _finish_surface(obj):
    # Exact normals on planes, interpolated normals only on curved surfaces.
    # A long fascia must never borrow normals from a neighbouring rolled edge.
    mesh = obj.data
    for poly in mesh.polygons:
        poly.use_smooth = max(abs(n) for n in poly.normal) < .999999
    uv = mesh.uv_layers.get("Manufacturing grain") or mesh.uv_layers.new(name="Manufacturing grain")
    for poly in mesh.polygons:
        axis = max(range(3), key=lambda i: abs(poly.normal[i]))
        for li in poly.loop_indices:
            p = mesh.vertices[mesh.loops[li].vertex_index].co
            uv.data[li].uv = (p.y*3,p.z*3) if axis == 0 else (p.x*3,p.z*3) if axis == 1 else (p.x*3,p.y*3)
    return obj


def _horizontal_loft(collection, parent, name, mat, profiles):
    """Closed solid or channel from matching rounded plan contours (w,d,r,z)."""
    contours = [rounded_outline(w,d,r) for w,d,r,z in profiles]
    n = len(contours[0])
    vertices = [(x,y,profile[3]) for profile, contour in zip(profiles,contours) for x,y in contour]
    faces = []
    for ring in range(len(profiles)-1):
        for j in range(n):
            k = (j+1) % n
            faces.append((ring*n+j,ring*n+k,(ring+1)*n+k,(ring+1)*n+j))
    faces.append(tuple(reversed(range(n))))
    faces.append(tuple((len(profiles)-1)*n+j for j in range(n)))
    return _mesh_object(collection,parent,name,mat,vertices,faces)


def _cut(obj, cutter, label):
    mod = obj.modifiers.new(label,"BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.solver = "EXACT"
    mod.object = cutter
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter,do_unlink=True)


def make_shell(collection, parent, mat):
    # No Z fillet at either joining face: independent rounding caused the gaps
    # and bulges against the lid and collector in the preceding model.
    obj = _horizontal_loft(collection,parent,"MS_Chassis",mat,[
        (WIDTH,DEPTH,CORNER,SHELL_BOTTOM),
        (WIDTH,DEPTH,CORNER,SHELL_TOP),
    ])
    # The opening's rolled mouth is explicit geometry, so no global bevel can
    # accidentally round the housing's flat mating faces.
    profiles = [(.605,.271,.0055,.2775,-.080)]
    for i in range(17):
        a = i*math.pi/32
        delta = .001*(1-math.sin(a))
        profiles.append((.603+2*delta,.269+2*delta,.0045+delta,.2775,-.042-.001*math.cos(a)))
    profiles.append((.603,.269,.0045,.2775,.036))
    n = len(rounded_outline(.603,.269,.0045))
    vertices = [(x,y,z) for w,h,r,center,y in profiles for x,z in rounded_outline(w,h,r,center)]
    faces = []
    for ring in range(len(profiles)-1):
        for j in range(n):
            k = (j+1) % n
            faces.append((ring*n+j,ring*n+k,(ring+1)*n+k,(ring+1)*n+j))
    faces += [tuple(reversed(range(n))),tuple((len(profiles)-1)*n+j for j in range(n))]
    opening = _mesh_object(collection,None,"TOOL_reservoir_opening",None,vertices,faces)
    _cut(obj,opening,"Rolled reservoir opening")

    bpy.ops.mesh.primitive_cube_add(size=1,location=(0,-.0405,.0705))
    pocket = bpy.context.object
    pocket.dimensions = (.1802,.018,.0652)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    bevel = pocket.modifiers.new("Pocket corner radius","BEVEL")
    bevel.width = .0021
    bevel.segments = 16
    bpy.context.view_layer.objects.active = pocket
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    _cut(obj,pocket,"Flush holder clearance")
    return _finish_surface(obj)


def make_lid(collection, parent, mat):
    profiles = [(WIDTH,DEPTH,CORNER,LID_BOTTOM),(WIDTH,DEPTH,CORNER,LID_TOP-.0024)]
    for i in range(1,17):
        a = i*math.pi/32
        inset = .0024*(1-math.cos(a))
        profiles.append((WIDTH-2*inset,DEPTH-2*inset,CORNER-inset,LID_TOP-.0024+.0024*math.sin(a)))
    return _finish_surface(_horizontal_loft(collection,parent,"MS_Lid_Cover",mat,profiles))


def make_collector(collection, parent, mat):
    profiles = []
    # Only the free underside is rounded. The upper edge matches the silver
    # outline and stays 0.6 mm BELOW its underside instead of intersecting it.
    for i in range(17):
        a = i*math.pi/32
        inset = .0024*(1-math.sin(a))
        profiles.append((WIDTH-2*inset,DEPTH-2*inset,CORNER-inset,.0064-.0024*math.cos(a)))
    profiles += [
        (WIDTH,DEPTH,CORNER,COLLECTOR_TOP),
        (.644,.070,.003,COLLECTOR_TOP),
        (.6428,.0688,.0024,COLLECTOR_TOP-.0006),
        (.6428,.0688,.0024,.010),
    ]
    return _finish_surface(_horizontal_loft(collection,parent,"MS_Collector_Channel",mat,profiles))


def bevel_box_normals(obj):
    """Keep accessory planes flat and use finer radii at their free edges."""
    for polygon in obj.data.polygons:
        polygon.use_smooth = False
    bevel = obj.modifiers.get("Small manufactured edge radii")
    if bevel:
        bevel.segments = 16
        bevel.harden_normals = True
    weighted = obj.modifiers.get("Weighted surface normals")
    if weighted:
        weighted.keep_sharp = True
        weighted.weight = 80
