# Spice materials

`spice-atlas.png` was generated using the built-in imagegen tool for this model's
material-quality pass. It is an albedo reference atlas used on the actual 3D fill
geometry. It is not a product render or a photograph of a manufactured MySpice.
The six regions are mapped directly through a second UV channel; the image has
not been cropped or repainted.

Powder color maps, microscopic normal maps, and the satin finish map are generated
deterministically by `scripts/create_spice_textures.py`. Coarse physical grain
meshes remain separate from the textured fill volumes.

## Generation prompt

+Use case: photorealistic-natural. Asset type: a single professional PBR photographic texture atlas for actual 3D spice materials, landscape 3:2 image, preferably 3072 by 2048 pixels. EXACT 3 columns by 2 rows of six equal square regions. No gutters, no borders, no dividers, no text, no bowls or objects: each square entirely filled edge to edge with a different real dry spice viewed perfectly straight down, orthographic flat scan. TOP ROW left: finely ground pale beige coriander powder, dusty fine granules and natural soft micro-clumping, not sand or cake; center: real crumbled dried oregano and basil leaves, delicate curled and torn olive green and muted brown leaf fragments, tiny stems, dry fibrous veins, loose irregular packing with small dark gaps; right: real crushed dried red chilli flakes, deep warm brick red irregular wrinkled skins mixed with a modest number of pale gold seeds, convincingly organic shapes. BOTTOM ROW left: cracked black pepper, dark brown-black irregular peppercorn fragments with occasional creamy broken interiors; center: pale ivory unhulled sesame seeds, tiny flattened elongated oval seeds with tapered ends, very densely loosely packed at random orientations; right: coarse sea salt, translucent off-white irregular small angular crystals with believable fractures. Each square shows about 9 cm by 9 cm of material. Consistent physical macro scale. Restrained natural colors, delicate texture, extremely detailed food macro photography, cross-polarized diffuse neutral lighting evenly across entire atlas, flat albedo scan, focus-stacked so every grain is sharp. No directional cast shadows, no vignette, no glare, no perspective, no heaped central piles, no illustration or stylized geometry, no CGI look, no logos, no watermark. Keep materials cleanly separated exactly at x=1/3, x=2/3, y=1/2 with no mixing across regions.
