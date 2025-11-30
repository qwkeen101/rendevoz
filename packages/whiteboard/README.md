# @rendevoz/whiteboard (WIP)

Headless, extensible whiteboard component extracted from the Rendevoz app. This package is under active refactor to remove business coupling and expose a clean adapter/plugin API.

## Status

- 🚧 Scaffolding only. Core types and adapter contracts are in place; rendering and business adapters are being split out from `src/core/components/whiteboard`.
- See `WHITEBOARD_REFACTORING_PLAN.md` in the repo root for the full migration roadmap.

## Development

```bash
npm run build --workspace @rendevoz/whiteboard
```

## License

MIT
