# Memory Match

![Memory Match](media/poster.svg)

Sixteen cards, eight pairs. Flip two at a time and remember where each shape landed. The clock starts on the first flip.

## Play

Open `index.html`. No build step, no network, and the file protocol works.

## Controls

- Tap a card, or move with the arrow keys and press Enter or Space.
- New game deals a fresh board.

## High scores

The personal best is the fewest moves that cleared the board. It stays in this browser only, on this device (`localStorage` key `hivemind.highscore.memory`). The clock still runs, and the win screen shows that time, but time is not the saved best. An older move count under `games.memory.bestMoves` is copied across the first time the game looks.
