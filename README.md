# MySpice — first model, hero, and companion app study

This milestone contains a reference-based 3D appliance, a gradual-reveal hero, and
a small companion app simulation. It intentionally stops before the full case study.

The hero opens with a 21-second, five-chapter product film: a close pass along
the right silver shoulder, the optional door opening and phone placement,
the removable collector sliding forward, a longer descent along the silver
edge to the base, and a full-product pullback.
See `model/hero-storyboard.md` for the shot list and `src/heroChoreography.js`
for the editable camera, lens, light, and collector keyframes.

## Review locally

Use Node.js 22.12 or newer and npm.

```powershell
npm ci
npm run dev
```

Open the printed local address. The holder starts closed. The three controls show
the closed, phone, and paper states. Drag the product to inspect the form. On touch
screens, one finger scrolls and two fingers rotate the model.
Use **Inspect details** below the model to move closer to the reservoirs and finish.
The film offers pause, chapter selection, replay, and skip. It plays once, pauses
outside the viewport or in a background tab, and bypasses motion entirely when
the browser requests reduced motion. The door opens briefly for the phone in
chapter 2 and closes again before the collector and silver-edge shots. Its pose
and phone placement follow the same timeline as the camera when pausing/seeking.

The phone demo begins with a three-step survey. Allergy selections filter the
fixture recipes. Time, diet, budget, household size, cooking frequency, and meal
ratings affect the sample plan. Meal changes propagate to their linked leftovers
and ingredient totals. The recipe editor changes ingredient amounts and steps.
The grocery list supports pantry checkoffs, renaming, extra items, and copying.

This is local sample planning, not a connected AI service. Nutrition, recipe costs,
and physical dispensing are illustrative. The preview saves its state in this
browser under the `myspice-study-v1` localStorage key.

## Model

- `model/myspice-study.blend`: editable Blender 5.1 source, with a separate studio collection.
- `public/assets/myspice.glb`: exported appliance with independent movable groups.
- `public/previews/`: renders of the closed, phone, paper, and detail states.
- `scripts/create_model.py`: deterministic model generation and render script.
- `scripts/model_geometry.py`: continuous chassis, recessed holder pocket, and collector channel.
- `scripts/spice_geometry.py`: settled fill surfaces and batched physical grain meshes.
- `scripts/create_spice_textures.py`: microscopic material-map generation.
- `model/textures/GENERATION.md`: photographic atlas provenance and original imagegen prompt.
- `model/model-notes.json`: estimated dimensions and provisional decisions.

To regenerate the assets, use Python 3 with NumPy and Pillow and Blender 5.1.
Make the Python and Blender executables available on your PATH. Preserve
`model/textures/spice-atlas.png`, the generated photographic atlas, alongside
the generated material maps:

```powershell
python -m pip install numpy Pillow
python scripts/create_spice_textures.py
blender --background --factory-startup --python scripts/create_model.py
```

The silver housing, black lid, and collector now share a 660 × 86 mm outline
and the same corner profile. Their flat mating faces have a 0.6 mm separation;
the collector stays entirely beneath the housing and slides at a constant height.
Only free edges are rounded, so the joining profiles remain flush. The holder
sits in a fitted pocket. Phone and paper states visibly enter from the side,
settle onto the open support, and lift away before it closes.

Powders, dried
leaves, chilli skins, pepper fragments, sesame hulls, and salt crystals each have
different grain geometry. Physical-scale UVs and settled top surfaces avoid the
stretched texture and perfectly flat fill of the first study.

The GLB is Draco-compressed. Its decoder is served locally from `public/draco/`.
The live scene uses thin-wall transmission, photographic softbox reflections,
and an eight-sample still frame when camera and holder movement settle. Idle
frames reuse that image instead of redrawing the full scene continuously.

Satin silver, the newer kitchen references, a gradual reveal, optional phone/paper
support, and a normally closed holder are confirmed direction. Physical dimensions,
fourteen reservoirs, and the fold-down holder movement are visual estimates awaiting
review. Internal dispensing geometry is not modeled in this milestone.

## Validation

`npm run build` checks production compilation. No automated tests are created
or run, following the project brief. Browser and render review is visual.
