# Murmur

[![Murmur gameplay: a starling flock threads amber rings over a dusk marsh](media/preview.gif)](media/gameplay.mp4)

Lead a starling murmuration over a reed marsh at dusk. Thread eight amber rings, keep the flock together, and reach the roost oak before the sun sets. The preview is a real flight. Select it for the MP4.

## Play

From the repository root:

```bash
python3 -m http.server 8080
```

Open <http://localhost:8080/games/murmur/>. `npx serve .` works the same way. WebGL is required. Three.js loads as an ES module from jsDelivr (`three@0.170.0`), so this game needs a network connection. There is no build step.

## Controls

- `A` `D` or the left and right arrows bank. `W` `S` or the up and down arrows climb and dive.
- Move the mouse to steer. On a touch screen, drag the stick or the marsh.
- Fly the lead starling through each amber ring. A ring folds four more birds into the flock and scores 300.
- Dark posts marked with a red ribbon snag the flock. `Space` calls the birds tight and shortens the snag for a moment.
- Reach the roost oak while at least one starling is still with you, before the sun meter empties.
- `P` or `Esc` pauses. `R` starts the flight over. `M` mutes the chirps.

## High scores

The best score stays in this browser only, on this device (`localStorage` key `hivemind.highscore.murmur`). Higher is better. Each ring is 300 while you fly. Reaching the oak adds 80 for every starling still with you and 30 for each second of daylight left. A scattered or darkened run keeps the ring points only. An older save under `games.murmur.best` is copied across the first time the game looks.

## Scoring

Each ring is worth 300 points, added as you fly. At the oak, every starling still in the air is worth 80, and each second of daylight left is worth 30. If the flock scatters or the marsh goes dark, the run ends with the ring points only.
