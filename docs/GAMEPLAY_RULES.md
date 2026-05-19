# Brain Bugs — Gameplay Rules

## Core concept
Brain Bugs is a spatial tiling puzzle game. The goal: place all bug-shaped pieces on a grid board so every empty cell is covered. No cell may be left empty (except pre-blocked cells). No two pieces may overlap.

## The board
- Each puzzle has a rectangular grid (e.g. 4×3, 5×4, 6×4).
- Some cells are pre-blocked (shown as dark cells). These cannot be used.
- Every remaining cell must be covered by exactly one piece.

## The pieces
There are 6 original bug characters used as puzzle pieces:

| Bug | Shape | Cells |
|-----|-------|-------|
| **Pip** (green) | Straight triomino `■■■` | 3 |
| **Bobo** (purple) | J-shape `■ / ■■` | 3 |
| **Zig** (yellow) | S-shape `■■ / _■■` | 4 |
| **Mo** (blue) | 2×2 square | 4 |
| **Rose** (pink) | Domino `■■` | 2 |
| **Coach** (orange) | Vertical triomino `■/■/■` | 3 |

Each puzzle provides a specific set of pieces. The total cells of all pieces always equals the total empty cells on the board.

## How to play

### Selecting a piece
- **Tap** a bug in the tray at the bottom to select it.
- A yellow border and arrow indicator appears above the selected piece.

### Placing a piece
- **Tap** any empty cell on the board to place the selected piece starting from that cell.
- The piece expands rightward and downward based on its shape.
- **Drag** a piece from the tray directly onto the board (pointer/touch events).
- A live preview shows which cells will be occupied (green = valid, red = invalid).

### Rotating a piece
- Tap the **Rotate** button to spin the selected piece 90° clockwise.
- Rotate before placing to try different orientations.
- Each piece can be rotated 4 times (0°, 90°, 180°, 270°).

### Invalid placement
- If a piece cannot fit (out of bounds, overlap, blocked cell), the piece shakes red and Bug Coach gives a tip.

### Resetting
- Tap **Reset** to remove all pieces and start the puzzle fresh.
- The move counter resets to 0.

### Checking
- Tap **Check** when you believe the board is complete.
- If all cells are covered, the puzzle is solved and you go to the Victory screen.
- If cells remain empty, Bug Coach tells you how many pieces are still to place.

### Winning
- The puzzle is also automatically solved when the last piece is placed correctly.
- Stars are awarded based on moves used vs. the target.

## Star scoring

| Result | Stars |
|--------|-------|
| ≤ 55% of max moves | ⭐⭐⭐ |
| ≤ 100% of max moves | ⭐⭐ |
| Over max moves | ⭐ |

Best star rating per level is preserved forever. Replaying a completed level never reduces your best score.

## Bug Coach hints
The Bug Coach gives contextual hints based on your current state:
- No pieces placed → encourages starting with the largest piece
- Failed placement → suggests rotating or trying a different cell
- Many moves used → prompts corner-first thinking
- Near completion → celebrates progress
- Solved → gives positive feedback

Tap **Hint** for an extra tip from the Bug Coach.

## Progression
- Levels unlock when you have enough total stars.
- 3 worlds: Meadow Path → Crystal Cave → Robo Reef.
- Each world has 5 levels.
- Completing all levels in a world earns the World Master badge.

## Badges
8 collectible badges reward different playstyles:
- **First Solve** — complete your first puzzle
- **Persistence Star** — earn 5 stars
- **Pattern Finder** — get 3 stars on any puzzle
- **Meadow Master** — complete all Meadow levels
- **No Hint Win** — solve any level without hints
- **Rotation Rookie** — complete 3 puzzles
- **Brain Bug Champion** — earn 20 stars
- **Corner Thinker** — complete 5 puzzles
