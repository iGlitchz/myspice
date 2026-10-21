# Editorial gallery

The six-image gallery is inserted immediately before the single front-view
closing section. Images were generated with the built-in image generation tool,
using the selected editorial product PNGs as geometry/material references.

## Selected sequence

1. `stone-house`: distant architectural establishing view across a limestone/oak kitchen.
2. `walnut-residence`: a medium residential portrait at dusk.
3. `chefs-counter`: a low, opposite-side oblique along a stainless restaurant prep line.
4. `coastal-kitchen`: a cropped macro material study, with a targeted fine-pepper refinement.
5. `timber-kitchen`: a high three-quarter view showing the top lid and shallow depth.
6. `evening-service`: contextual view with an anonymous chef preparing a course.

The revised shot list addresses the user's request for varied cameras, distances
and details instead of repeatedly placing one product angle in new environments.
Prompts use a shared provisional 660 × 360 × 80 mm appliance envelope, 600 mm
cabinet modules, a 900 mm worktop height and a 600 mm backsplash as scale anchors.
These are art-direction estimates, not measured production dimensions. Different
camera distances and perspective naturally change apparent image size.

All interiors are imagined. The gallery does not identify an actual venue, claim
a Michelin rating, or imply restaurant adoption/endorsement. Visible text calls
the images an imagined collection and art-directed concept imagery.

## Files

- `public/case-study/gallery/originals/*.png`: all six selected full-size originals.
- `public/case-study/gallery/*.webp`: optimized full-size images and 640-pixel variants.
- `public/case-study/gallery/image-metadata.json`: served dimensions and WebP sizes.
- `model/gallery-prompts.json`: initial six-context prompt set.
- `model/gallery-variety-prompts.json`: revised camera prompts, final macro edit and selection mapping.
- `model/gallery-image-sources.json`: final original generation paths and filenames.

Only format conversion/resizing was used for the website variants; no manual
compositing, retouching or color changes were applied. Website images lazy load,
use responsive sources and open in a keyboard-accessible native dialog. The dialog
supports previous/next, left/right arrows, Escape, close, and saving the PNG.
