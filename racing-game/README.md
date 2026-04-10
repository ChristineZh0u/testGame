# Road Racer

Pseudo-3D perspective racing game (OutRun style) in a single HTML file.

## Run

```
open racing.html
```

## Controls

- Up — accelerate
- Down — brake
- Left/Right — steer
- R — restart after game over

## Current State

Rebuilt from a top-down lane dodger into a pseudo-3D perspective racer.

### Rendering
- Pseudo-3D road using `screenY = horizon + depth*H/z` projection
- Road drawn line-by-line from horizon to bottom of screen
- Curves via accumulated horizontal offset per segment
- Hills via per-segment vertical offset
- Alternating road/grass/rumble strip colors for speed perception
- Lane dashes, roadside scenery (trees, rocks, bushes)

### Gameplay
- 30 traffic cars with independent speeds to weave through
- 3 lives, collision slows you down and costs a life
- Centrifugal force pushes you on curves
- Off-road slows you down
- Score based on distance/speed
- High score saved to localStorage
- Speed bar + mph display in HUD

### Track
- ~2000 segments with varied curves and hills
- Looping track

## Known Issues / Next Steps

- Car rendering could be improved (currently simple rectangles)
- No powerups yet in the 3D version (old top-down version had shield, boost, missiles, etc.)
- Could add: lap counter, checkpoints/timer, more traffic variety, sound effects
- Scenery is sparse — could add buildings, signs, more variety
- No minimap or track preview

## Tech

Single HTML file, vanilla JS + Canvas 2D, no dependencies.
