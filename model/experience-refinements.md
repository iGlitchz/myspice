# Journey, preferences and dispensing — October 21, 2026

The intended six-step journey advances every nine seconds while its map is in
view. Its connecting line shows elapsed progress; the selected icon has a muted
radial glow underneath. Pause/play and manual step selection remain available.
Leaving the section or hiding the page stops elapsed time. Reduced motion starts
the journey paused. Detailed step/benefit text replaces the old touchpoint column.

The grocery pickup concept comes from the user's latest product direction. It is
described as planned in the journey, app introduction, grocery list and interface
development section. There is no checkout, order submission or live grocery API.
Instacart's official documentation was reviewed as a possible future implementation:

- https://docs.instacart.com/developer_platform_api/guide/concepts/shopping_list
- https://docs.instacart.com/developer_platform_api/api/products/create_shopping_list_page
- https://docs.instacart.com/connect

The app-developer shopping-list API creates a shoppable Marketplace link where
the user selects a store and reviews a basket before checkout. Retailer Connect
fulfillment APIs are a separate integration path. Pickup availability and partner
access would need confirmation for an actual implementation. No credentials or
API calls were added to the client preview.

The survey now uses Avoid (allergens plus red meat and chicken), with mutually
exclusive None, and multiple optional nutrition preferences: High Protein, High
Fiber, Low Fat and Low Carb. Avoid choices filter fixture ingredients/allergen
metadata. Preferences provide soft relative ranking signals for the small sample
collection, not nutrient thresholds or a therapeutic diet. Existing saved survey
data is migrated in place; version 1 and version 2 snapshots remain readable.

The recipe callout leads to a button labeled Dispense. Selecting it closes any
optional accessory, focuses and scrolls to the 3D stage, then starts the demonstration
once at least 65% of the stage is visible. The collector opens slightly, three
fine-grained sample spice mounds accumulate, and the third film chapter slides the
filled channel forward and back before the final reveal. The spice meshes are
children of MS_Collector, so the contents stay with the channel during movement.
They sit above the 10 mm floor and below the 35 mm rim. The normal replay clears
the blend. A higher collector camera exposes the contents behind the front rim,
then eases into the original final reveal. Inspect blend holds the result, and
View collected blend makes that view available after playback. Reduced motion
presents a paused, filled-collector view.

Form exploration replaces the opportunity slogan, and the redundant recipe/seasoning
tagline is removed. The gesture copy explains avoiding device/container contact
with food-covered hands. It describes the experiment's intent, not a measured
food-safety outcome. The prototype signal-flow diagram uses larger labels and
grid-aligned SVG arrows, stacked vertically on phones.
