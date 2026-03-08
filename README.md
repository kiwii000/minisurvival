# Mini Survival (Phaser + TypeScript + Vite)

A minimal playable 2D survival MVP inspired by Don't Starve. It launches directly into gameplay (no loading scene) and keeps menus as overlay states.

## Stack
- TypeScript
- Phaser 3
- Vite

## Run
```bash
npm install
npm run dev
```
Open the local URL and you are immediately in `Playing` state.

## Controls
- `WASD` / arrows: Move
- `E`: Interact/harvest (timed action, interrupted by movement)
- `F`: Attack
- `I`: Eat first available food
- `1`/`2`/`3`: Craft axe/pickaxe/torch
- `C`: Place campfire/science machine kit (if in inventory)
- `Esc`: Pause
- `M`: Main Menu overlay
- `L`: Load slot 1
- `N`: New random-seed game

## Notes
- Save/Load uses `localStorage` slot 1 with versioned schema.
- World generation is seeded and deterministic.
- Placeholder programmer art uses primitive shapes and semantic IDs via config.
