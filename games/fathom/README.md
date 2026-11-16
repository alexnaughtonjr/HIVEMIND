# Fathom

Pilot a research lamp down a dark trench and log one animal from each ocean zone before the lamp goes dark.

Open `index.html` in a browser. WebGL is required. Three.js is the shared copy at `../../shared/vendor/three.min.js`. Bloom comes from `../../shared/bloom.js`, and the sounds come from `../../shared/juice.js`. Nothing is loaded from a CDN, and there is no build step.

## Controls

- `A` `D` or the arrow keys slide the lamp. `W` `S` move it in and out of the trench.
- On a touch screen, drag the stick, or drag on the trench itself.
- The glowing ring is the animal on the field card. Steer into it to file that zone.
- Other animals and rock spires drain the lamp. From the midnight zone down, a hot vent pushes the lamp sideways.
- Each logged animal restores charge. Five zones complete the survey, and leftover charge becomes bonus points.
- `P` or `Esc` pauses. `R` starts a fresh survey.
- The best score stays in this browser under `games.fathom.best`.

## Zones

| Zone | Depth | Log this |
|---|---|---|
| Sunlight | 0–200 m | Moon jelly |
| Twilight | 200–1,000 m | Lanternfish |
| Midnight | 1,000–4,000 m | Angler |
| Abyss | 4,000–6,000 m | Dumbo octopus |
| Hadal | below 6,000 m | Vent worm |
