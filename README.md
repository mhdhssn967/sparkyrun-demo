# Sparky Run — 3D endless runner (React + TypeScript + Vite + React Three Fiber)

```bash
npm install
npm run dev        # http://localhost:5173  (also reachable on your LAN for phone testing)
npm run build      # typecheck + production build
```

**Controls:** ← → / A D change lane · ↑ / W / Space jump · ↓ / S slide · Enter/Space start & restart.
Touch: swipe left / right / up / down (already wired through the same action pipeline).

## Adding your character
Drop your model at `public/character.glb`. It is auto-scaled to ~1.8 m with its feet on the ground and
its clip whose name contains "run" is played. If the file is missing, invalid, or has no run clip, the
built-in placeholder runner is used. If your model runs backwards, set `CHARACTER_YAW` to `0` in `src/game/constants.ts`.

## Structure
- `src/game/` — constants, state, engine (physics/score/flow), collision, obstacle spawner, chunk generator
- `src/components/game/` — GameCanvas, GameLoop, Player, FollowCamera, Road, Environment, Obstacles, Sky, GameUI
- `src/components/ui/` — StartScreen, GameOverScreen, ScoreDisplay
- `src/hooks/` — keyboard, swipe, asset check · `src/utils/` — bend shader, textures, RNG, math

## How it stays fast
- Treadmill world: the player stays at z = 0; chunks are pooled and re-seeded behind the camera.
- Curved road via a vertex-shader bend (one uniform) instead of real curved geometry.
- Each scenery chunk = 5 instanced meshes; obstacles = 1 instanced mesh; windows are procedural (no textures).
- Blob shadow instead of shadow maps, DPR capped at 1.75 and auto-dropped to 1 by `PerformanceMonitor`.
