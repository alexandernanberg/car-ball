# Car Ball

A browser-based car soccer game. Drive rocket-powered cars, hit a giant ball, score goals.

## Getting Started

```bash
pnpm install
pnpm run dev
```

Open `http://localhost:3001`

## Controls

| Input | Action        |
| ----- | ------------- |
| WASD  | Drive / Steer |
| Space | Jump          |
| Shift | Boost         |
| Q / E | Air roll      |

## Tech Stack

- [Koota](https://github.com/pmndrs/koota) - Entity Component System
- [Rapier](https://rapier.rs/) - Physics (WASM)
- [Three.js](https://threejs.org/) - 3D rendering
- [React 19](https://react.dev/) - UI
- [Vite](https://vitejs.dev/) - Build tool

## Scripts

```bash
pnpm run dev         # Dev server
pnpm run build       # Production build
pnpm run typecheck   # Type checking
pnpm run lint        # Linting
```

## License

MIT
