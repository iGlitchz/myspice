# MySpice hero film — 21 seconds

The holder opens briefly in chapter 2 to demonstrate the optional phone support.
The phone leaves and the door closes before the remaining detail shots. The film
plays once, then hands over to the interactive product. Replay, pause, chapter
selection, and skip remain available. Scrolling is always free; the film pauses
when the scene leaves the viewport.

| Time | Shot | Motion and intent |
| --- | --- | --- |
| 0–3 s | Satin silver | Begin on the right silver shoulder and travel down the edge, with light revealing its profile. |
| 3–9 s | Room for your recipe | Descend to the door. It opens at 3.8–4.6 s, the phone enters at 4.6–6.1 s and holds, then lifts away at 7.2–8.4 s. The door closes at 8.4–9 s. |
| 9–13 s | Removable collector | Ease back and slightly above the bottom channel. The collector slides forward 145 mm at a fixed height below the silver body, holds, then returns on the same path. Matching mating planes retain 0.6 mm clearance throughout. |
| 13–17 s | Considered edges | Move to the right side, then descend 260 mm from the reservoir edge to centre the silver-to-black collector join. |
| 17–21 s | Meet MySpice | Pull out from the lower detail to the complete appliance and settle in the interactive hero composition. |

Camera, light, door, and phone keyframes live in `src/heroChoreography.js`. Pausing
and selecting chapters freeze or seek all of them together. Reduced-motion
preferences bypass the film and show the full product immediately. Leaving the
tab also pauses elapsed film time. The film has no sound and does not loop.
