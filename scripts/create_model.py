"""MySpice reference-based form study. Run with Blender in background mode.

The newer kitchen images define the form language. Dimensions, reservoir count,
and holder travel are provisional visual estimates, not manufacturing drawings.
No source Blender scene or geometry is used.
"""

from pathlib import Path
import bpy
import math
import random
import json
import sys
import argparse
import tempfile
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
EXPORT_TEMP = ROOT / "scratch" / "blender-temp"
EXPORT_TEMP.mkdir(parents=True,exist_ok=True)
tempfile.tempdir = str(EXPORT_TEMP)
bpy.context.preferences.filepaths.temporary_directory = str(EXPORT_TEMP)
sys.path.insert(0,str(ROOT / "scripts"))
from model_geometry import make_shell, make_lid, make_collector, bevel_box_normals, SHELL_BOTTOM, SHELL_TOP, COLLECTOR_TOP, LID_BOTTOM
from spice_geometry import fill_volume, packed_grains
parser = argparse.ArgumentParser()
parser.add_argument("--variants",nargs="+",default=["closed","phone","paper","detail"])
parser.add_argument("--samples",type=int,default=112)
parser.add_argument("--export-only",action="store_true")
args=parser.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])
MODEL_DIR = ROOT / "model"
ASSETS = ROOT / "public" / "assets"
PREVIEWS = ROOT / "public" / "previews"
for directory in (MODEL_DIR, ASSETS, PREVIEWS):
    directory.mkdir(parents=True, exist_ok=True)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for block in list(bpy.data.materials):
    bpy.data.materials.remove(block)

scene = bpy.context.scene
scene.unit_settings.system = "METRIC"
scene.unit_settings.scale_length = 1
scene.render.engine = "CYCLES"
scene.cycles.samples = args.samples
scene.cycles.max_bounces = 12
scene.cycles.transmission_bounces = 8
scene.cycles.transparent_max_bounces = 12
scene.cycles.sample_clamp_indirect = 3
scene.cycles.use_denoising = True
scene.render.resolution_x = 2000
scene.render.resolution_y = 1500
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.view_settings.view_transform = "AgX"
scene.view_settings.exposure = -0.65
scene.render.film_transparent = False
scene.world.color = (0.025, 0.025, 0.025)

# Prefer available GPU, but always leave a CPU path.
try:
    prefs = bpy.context.preferences.addons["cycles"].preferences
    for device_type in ("OPTIX", "CUDA", "HIP", "ONEAPI", "METAL"):
        try:
            prefs.compute_device_type = device_type
            prefs.get_devices()
            accelerators = [device for device in prefs.devices if device.type != "CPU"]
            if accelerators:
                for device in prefs.devices:
                    device.use = device.type != "CPU"
                scene.cycles.device = "GPU"
                print("MYSPICE_RENDER_DEVICE", device_type, flush=True)
                break
        except Exception:
            continue
except Exception:
    pass

product = bpy.data.collections.new("MYSPICE | independently movable parts")
scene.collection.children.link(product)
studio = bpy.data.collections.new("STUDIO | not included in GLB")
scene.collection.children.link(studio)

def relink(obj, collection):
    for old in list(obj.users_collection):
        old.objects.unlink(obj)
    collection.objects.link(obj)
    return obj

def empty(name, location=(0, 0, 0), parent=None):
    obj = bpy.data.objects.new(name, None)
    product.objects.link(obj)
    obj.location = location
    obj.parent = parent
    return obj

root = empty("MS_Root")
root["reference"] = "Newer kitchen imagery; satin silver; no tablet; holder normally closed."
root["dimensions_status"] = "Estimated study: 660 W x 430 H x 88 D mm. Confirm before detailed engineering."

def material(name, color, metallic=0.0, roughness=0.4):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    return mat

silver = material("Satin silver | continuous fine finish", (0.60, 0.615, 0.625), 0.95, 0.30)
silver.node_tree.nodes.get("Principled BSDF").inputs["Anisotropic"].default_value = 0.0
edge_metal = material("Machined silver edge", (0.61, 0.625, 0.635), 0.98, 0.22)
graphite = material("Graphite polymer | collector and seals", (0.009, 0.012, 0.012), 0.08, 0.30)
recess = material("Recess | soft graphite", (0.018, 0.022, 0.021), 0.08, 0.48)
lettering = material("Soft etched wordmark", (0.26, 0.28, 0.28), 0.5, 0.48)
glass = material("Clear reservoirs | optical thin wall", (1.0, 1.0, 1.0), 0.0, 0.045)
glass_bsdf = glass.node_tree.nodes.get("Principled BSDF")
glass_bsdf.inputs["Transmission Weight"].default_value = 1.0
glass_bsdf.inputs["IOR"].default_value = 1.46

def image_node(mat,filename,noncolor=False):
    node=mat.node_tree.nodes.new("ShaderNodeTexImage")
    node.image=bpy.data.images.load(str(MODEL_DIR / "textures" / filename),check_existing=True)
    if noncolor:node.image.colorspace_settings.name="Non-Color"
    node.image.pack()
    return node

satin_tex=image_node(silver,"satin-normal.png",True)
satin_normal=silver.node_tree.nodes.new("ShaderNodeNormalMap")
satin_normal.inputs["Strength"].default_value=.07
silver.node_tree.links.new(satin_tex.outputs["Color"],satin_normal.inputs["Color"])
silver.node_tree.links.new(satin_normal.outputs["Normal"],silver.node_tree.nodes.get("Principled BSDF").inputs["Normal"])

def finish(obj, name, mat, parent=root, bevel=0):
    obj.name = name
    relink(obj, product)
    obj.parent = parent
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new("Small manufactured edge radii", "BEVEL")
        mod.width = bevel
        mod.segments = 8
        mod.harden_normals = True
    for poly in obj.data.polygons:
        poly.use_smooth = True
    if obj.type == "MESH":
        mod = obj.modifiers.new("Weighted surface normals", "WEIGHTED_NORMAL")
        mod.keep_sharp = True
        mod.weight = 50
    return obj

def box(name, dimensions, location, mat, bevel=0.002, parent=root):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj=finish(obj, name, mat, parent, bevel)
    bevel_box_normals(obj)
    return obj

def cylinder(name, radius, depth, location, mat, parent=root, vertices=64, bevel=0.0005):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location)
    obj = finish(bpy.context.object, name, mat, parent, bevel)
    for poly in obj.data.polygons:
        if len(poly.vertices) > 4:
            poly.use_smooth = False
    return obj

def text(name, content, location, size, mat, parent=root):
    curve = bpy.data.curves.new(name, "FONT")
    curve.body = content
    curve.size = size
    curve.extrude = 0
    curve.align_x = "CENTER"
    obj = bpy.data.objects.new(name, curve)
    product.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (math.pi / 2, 0, 0)
    obj.data.materials.append(mat)
    obj.parent = parent
    return obj

# One continuous shell gives the satin finish an uninterrupted highlight.
make_shell(product,root,silver)
box("MS_Backplate", (0.620, 0.008, 0.383), (0, 0.034, 0.229), recess, 0.006)
box("MS_Rear_Mount_Spacer", (0.575,0.006,0.32),(0,.043,.23),graphite,.004)
lid = empty("MS_Lid", parent=root)
make_lid(product,lid,graphite)
box("MS_Reservoir_Base_Rail", (0.603, 0.051, 0.005), (0, 0.003, 0.142), edge_metal, 0.001)

spices = [
    ("Chilli", (0.42, 0.050, 0.014), 0.64, "flake"),
    ("Paprika", (0.58, 0.095, 0.023), 0.45, "powder"),
    ("Garlic", (0.66, 0.49, 0.24), 0.31, "powder"),
    ("Oregano", (0.19, 0.25, 0.080), 0.70, "herb"),
    ("Coriander", (0.36, 0.27, 0.12), 0.56, "powder"),
    ("Turmeric", (0.92, 0.56, 0.025), 0.85, "powder"),
    ("Cumin", (0.39, 0.22, 0.09), 0.61, "powder"),
    ("Black_pepper", (0.075, 0.061, 0.040), 0.71, "pepper"),
    ("Ginger", (0.59, 0.40, 0.15), 0.55, "powder"),
    ("Curry", (0.72, 0.43, 0.025), 0.79, "powder"),
    ("Basil", (0.16, 0.22, 0.065), 0.64, "herb"),
    ("Chilli_flakes", (0.48, 0.095, 0.025), 0.78, "flake"),
    ("Sesame", (0.72, 0.62, 0.39), 0.39, "seed"),
    ("Sea_salt", (0.87, 0.85, 0.75), 0.67, "salt"),
]

def spice_material(index, name, color, kind):
    mat = material("Spice | " + name, color, 0, 0.88)
    nodes = mat.node_tree.nodes
    tex = image_node(mat,name+"-color.jpg" if kind=="powder" else "spice-atlas.png")
    if kind!="powder":
        uv=nodes.new("ShaderNodeUVMap");uv.uv_map="Photographic grain scale"
        mat.node_tree.links.new(uv.outputs["UV"],tex.inputs["Vector"])
        nodes.get("Principled BSDF").inputs["Roughness"].default_value=.78 if kind!="flake" else .67
    mat.node_tree.links.new(tex.outputs["Color"], nodes.get("Principled BSDF").inputs["Base Color"])
    normal_tex=image_node(mat,name+"-normal.jpg",True)
    normal=nodes.new("ShaderNodeNormalMap")
    normal.inputs["Strength"].default_value=.65 if kind=="powder" else .20
    mat.node_tree.links.new(normal_tex.outputs["Color"],normal.inputs["Color"])
    mat.node_tree.links.new(normal.outputs["Normal"],nodes.get("Principled BSDF").inputs["Normal"])
    return mat

def reservoir_shell(name, x):
    # Closed manifold tube wall, 0.7 mm thick; no overlapping solid glass cylinder.
    n = 128
    verts = []
    for z, r in ((0.145, 0.0163), (0.405, 0.0163), (0.405, 0.0156), (0.145, 0.0156)):
        for j in range(n):
            angle = 2 * math.pi * j / n
            verts.append((x + r * math.cos(angle), -0.012 + r * math.sin(angle), z))
    faces = []
    for ring in range(4):
        for j in range(n):
            nxt = (j + 1) % n
            rnext = (ring + 1) % 4
            faces.append((ring*n+j, ring*n+nxt, rnext*n+nxt, rnext*n+j))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    product.objects.link(obj)
    obj.parent = root
    mesh.materials.append(glass)
    # True radial split normals on the long walls avoid a lens-shaped silhouette.
    # End-rim normals must not interpolate over the full reservoir height.
    normals = []
    for face in mesh.polygons:
        ring = face.index // n
        face.use_smooth = ring in (0, 2)
        for loop_index in face.loop_indices:
            v = mesh.vertices[mesh.loops[loop_index].vertex_index].co
            radial = Vector((v.x-x, v.y+0.012, 0)).normalized()
            normal = radial if ring == 0 else -radial if ring == 2 else Vector((0,0,1 if ring==1 else -1))
            normals.append(tuple(normal))
    mesh.normals_split_custom_set(normals)
    uv=mesh.uv_layers.new(name="Reservoir cylindrical UV")
    for poly in mesh.polygons:
        for li in poly.loop_indices:
            v=mesh.vertices[mesh.loops[li].vertex_index].co
            uv.data[li].uv=(math.atan2(v.y+.012,v.x-x)/math.tau,(v.z-.145)/.260)

for index, (name, color, fill, kind) in enumerate(spices):
    x = (index - 6.5) * 0.0425
    reservoir_shell("MS_Reservoir_%02d_%s" % (index + 1, name), x)
    cylinder("MS_Collar_%02d" % (index + 1), 0.01665, 0.006, (x, -0.012, 0.147), edge_metal,vertices=96,bevel=.0004)
    cylinder("MS_Collar_Seal_%02d" % (index + 1), 0.01635, 0.0012, (x, -0.012, 0.1505), graphite,vertices=96,bevel=.0002)
    cylinder("MS_Top_Seal_%02d" % (index + 1), 0.0163, 0.003, (x, -0.012, 0.404), graphite,vertices=96,bevel=.0004)
    h = 0.239 * fill
    mat = spice_material(index, name, color, kind)
    fill_volume(product,root,index,name,kind,x,h,mat)
    packed_grains(product,root,index,name,kind,x,h)

# Removable collector is a single rounded channel with a continuous lip.
collector = empty("MS_Collector", parent=root)
make_collector(product,collector,graphite)

# Reference-based holder motion study. A flush fold-down panel is provisional.
box("MS_Holder_Shadow_Reveal", (0.1798, 0.002, 0.065), (0, -0.032, 0.0705), recess, 0.0025)
holder = empty("MS_Holder_Pivot", (0, -0.0402, 0.0385), root)
holder["motion_status"] = "Proposed fold-down study. Final hinge or retracting mechanism to be confirmed."
box("MS_Holder_Panel", (0.179, 0.0048, 0.064), (0, 0, 0.032), silver, 0.0018, holder)
box("MS_Holder_Lip", (0.157, 0.007, 0.0035), (0, 0.004, 0.059), graphite, 0.0015, holder)
text("MS_Wordmark", "myspice", (0.238, -0.0431, 0.061), 0.006, lettering)

# The two accessories are independent optional groups in the export.
phone = empty("MS_Phone", (0, -0.093, 0.0412), root)
phone.rotation_euler.x = math.radians(-18)
phone_body = material("Phone | graphite", (0.012, 0.014, 0.014), 0.45, 0.25)
screen = material("Phone | warm ivory screen", (0.91, 0.88, 0.80), 0, 0.4)
screen.node_tree.nodes.get("Principled BSDF").inputs["Emission Color"].default_value = (0.91,0.86,0.74,1)
screen.node_tree.nodes.get("Principled BSDF").inputs["Emission Strength"].default_value = 0.12
ink = material("Screen | ink", (0.04,0.045,0.033), 0, 0.75)
orange = material("Tiger orange", (0.92,0.24,0.022), 0, 0.6)
box("MS_Phone_Body", (0.073,0.008,0.151), (0,0,0.0755), phone_body, 0.008, phone)
box("MS_Phone_Screen", (0.066,0.001,0.140), (0,-0.0044,0.076), screen, 0.006, phone)
box("MS_Phone_Earpiece", (0.021,0.0015,0.004), (0,-0.005,0.141), phone_body, 0.0018, phone)
text("MS_Phone_Brand", "MySpice", (0,-0.0052,0.124), 0.008, ink, phone)
text("MS_Phone_Recipe", "A little more\nflavor.", (0,-0.0052,0.094), 0.008, ink, phone)
text("MS_Phone_Detail", "LEMON HERB CHICKEN\n25 MIN  /  2 SERVINGS", (0,-0.0052,0.055), 0.003, ink, phone)
box("MS_Phone_Action", (0.055,0.0013,0.013), (0,-0.0055,0.024), orange, 0.003, phone)
text("MS_Phone_Action_Label", "View recipe", (0,-0.0064,0.022), 0.004, ink, phone)

paper = empty("MS_Paper", (0,-0.095,0.0414), root)
paper.rotation_euler.x = math.radians(-17)
paper_mat = material("Recipe sheet | warm paper", (0.85,0.80,0.68), 0, 0.96)
box("MS_Recipe_Sheet", (0.108,0.001,0.148), (0,0,0.074), paper_mat, 0.0006, paper)
text("MS_Paper_Title", "THE EVERYDAY\nRECIPE", (0,-0.0008,0.119), 0.008, ink, paper)
text("MS_Paper_Recipe", "Lemon & herb chicken", (0,-0.0008,0.096), 0.0045, ink, paper)
for i, width in enumerate((0.077,0.066,0.074,0.054,0.078,0.071)):
    box("MS_Paper_Line_%02d"%i, (width,0.0002,0.0006), (-0.003,-0.0007,0.078-i*0.008), lettering, 0, paper)

def descendants(obj):
    return [obj] + [child for sub in obj.children for child in descendants(sub)]

def accessory_visibility(which):
    for group, visible in ((phone,which=="phone"),(paper,which=="paper")):
        for obj in descendants(group):
            obj.hide_render = not visible
            obj.hide_viewport = not visible
    holder.rotation_euler.x = math.pi / 2 if which != "closed" else 0

# Export only the appliance, with all optional groups available to the website.
accessory_visibility("phone")
for obj in descendants(paper):
    obj.hide_render = False
    obj.hide_viewport = False
holder.rotation_euler.x = 0
bpy.ops.object.select_all(action="DESELECT")
for obj in product.objects:
    obj.select_set(True)
bpy.context.view_layer.objects.active = root
bpy.ops.export_scene.gltf(
    filepath=str(ASSETS / "myspice.glb"),
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_texcoords=True,
    export_normals=True,
    export_materials="EXPORT",
    export_image_format="JPEG",
    export_jpeg_quality=90,
    export_cameras=False,
    export_lights=False,
    export_extras=True,
    export_animations=False,
    export_yup=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_draco_position_quantization=16,
    export_draco_normal_quantization=16,
    export_draco_texcoord_quantization=16,
    export_draco_color_quantization=10,
)

# Studio is intentionally simple: wall, narrow counter, and photographic lights.
wall_mat = material("Studio | charcoal plaster", (0.052,0.055,0.052), 0, 0.88)
nodes = wall_mat.node_tree.nodes
noise = nodes.new("ShaderNodeTexNoise")
noise.inputs["Scale"].default_value = 37
noise.inputs["Detail"].default_value = 3
bump = nodes.new("ShaderNodeBump")
bump.inputs["Strength"].default_value = 0.28
bump.inputs["Distance"].default_value = 0.003
wall_mat.node_tree.links.new(noise.outputs["Fac"], bump.inputs["Height"])
wall_mat.node_tree.links.new(bump.outputs["Normal"], nodes.get("Principled BSDF").inputs["Normal"])
wall = box("STUDIO_Wall", (4,0.05,3), (0,0.080,0.8), wall_mat, 0)
wall.parent = None
relink(wall, studio)
counter = box("STUDIO_Counter", (4,1.4,0.06), (0,-0.45,-0.180), recess, 0.005)
counter.parent = None
relink(counter, studio)

def area(name, location, target, power, color, size, size_y=None):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = power
    data.color = color
    if size_y:
        data.shape = "RECTANGLE"
        data.size = size
        data.size_y = size_y
    else:
        data.shape = "DISK"
        data.size = size
    obj = bpy.data.objects.new(name,data)
    studio.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (Vector(target)-obj.location).to_track_quat("-Z","Y").to_euler()
    return obj

area("STUDIO_Key | long softbox", (-0.5,-0.65,1.1), (0,0,0.22), 48, (1.0,0.93,0.83), 0.70, 0.38)
area("STUDIO_Fill | narrow silver edge", (0.8,-0.25,0.55), (0,0,0.22), 26, (0.88,0.94,1.0), 0.22, 0.9)
area("STUDIO_Front | quiet readability", (-0.1,-1.0,0.4), (0,0,0.22), 6, (1,0.97,0.92), 0.9)
area("STUDIO_Top | warm grazing light", (0,0.015,0.68), (0,0.05,0.1), 7, (1,0.78,0.50), 0.85, 0.035)

cam_data = bpy.data.cameras.new("STUDIO_Camera")
cam = bpy.data.objects.new("STUDIO_Camera",cam_data)
studio.objects.link(cam)
scene.camera = cam
cam_data.lens = 64

def aim_camera(position, target=(0,0,0.225), lens=64):
    cam.location = position
    cam.rotation_euler = (Vector(target)-cam.location).to_track_quat("-Z","Y").to_euler()
    cam.data.lens = lens

aim_camera((0.78,-1.65,0.77))
accessory_visibility("closed")
bpy.ops.object.select_all(action="DESELECT")
root.select_set(True)
bpy.context.view_layer.objects.active = root
bpy.ops.wm.save_as_mainfile(filepath=str(MODEL_DIR / "myspice-study.blend"))
(MODEL_DIR / "model-notes.json").write_text(json.dumps({
    "reference": "Newer supplied kitchen renders",
    "finish": "Satin silver",
    "revision": "03 | matched housing profiles and nonintersecting collector",
    "estimated_dimensions_mm": [660,88,435],
    "reservoir_count": 14,
    "default_state": "Holder flush and closed; no phone or paper",
    "housing_join_clearance_mm": {"collector": round((SHELL_BOTTOM-COLLECTOR_TOP)*1000,3), "lid": round((LID_BOTTOM-SHELL_TOP)*1000,3)},
    "housing_outline_mm": {"width": 660, "depth": 86, "plan_corner_radius": 11},
    "movable_nodes": ["MS_Holder_Pivot","MS_Collector","MS_Lid","MS_Phone","MS_Paper"],
    "provisional": ["Dimensions and tube count estimated from images", "Fold-down holder motion is a study, not verified mechanism", "No dispensing internals modeled yet"],
},indent=2),encoding="utf-8")
print("MYSPICE_MODEL_SAVED",flush=True)

for variant in (v for v in args.variants if v != "detail" and not args.export_only):
    accessory_visibility(variant)
    scene.render.filepath = str(PREVIEWS / (variant + ".png"))
    bpy.ops.render.render(write_still=True)
    print("MYSPICE_PREVIEW_SAVED",variant,flush=True)

if "detail" in args.variants and not args.export_only:
    accessory_visibility("closed")
    aim_camera((0.30,-0.51,0.44), (0.12,-0.012,0.268), 85)
    scene.render.filepath = str(PREVIEWS / "detail.png")
    bpy.ops.render.render(write_still=True)
accessory_visibility("closed")
aim_camera((0.78,-1.65,0.77))
bpy.ops.wm.save_as_mainfile(filepath=str(MODEL_DIR / "myspice-study.blend"))
print("MYSPICE_COMPLETE",flush=True)
