# useFindMany optimization plan (source: ATOMA_OPTIMIZATION_ROADMAP.md)

## Goals
- Cut recomputation for a 10k dataset from ~80ms toward ~5ms by avoiding full rescans.
- Keep repeated renders of the same query at 0ms via result caching.
- Reduce sorting cost when `limit` is present (target: 15ms → ~2ms for top-20 of 10k).

## Current pain points (from the roadmap)
- `packages/atoma/src/hooks/useFindMany.ts`: every change rebuilds an array and re-runs full filter/sort; dependency on a coarse `version` means unrelated field updates trigger recalculation.
- No per-query result cache; identical queries recompute on each render.
- `packages/atoma/src/core/query.ts`: always copies and sorts the full dataset; no early exit for `limit`, no partial sort.

## Phase 1 tasks (已完成)
1) Add a per-query result cache inside `useFindMany` **(done in `packages/atoma/src/hooks/useFindMany.ts`)**
   - Cache `{ version, queryKey, result }` in a ref; return cached result when version and query key match.
   - Cache invalidation tied到字段级版本，避免脏数据泄露。
2) Introduce top-k sorting in `applyQuery` **(done in `packages/atoma/src/core/query.ts`)**
   - `orderBy` + `limit` 时用 quickselect/partial sort 选出 `limit + offset`，再排序/截取；否则 fallback `slice().sort()`.
   - 避免不必要的数组复制；无排序时不拷贝。
3) Make version tracking field-precise **(done in `packages/atoma/src/core/BaseStore.ts`)**
   - `collectChangedFields` 只记录真实变更字段并逐字段 bump 版本，减少 useFindMany 的误触发。
   - `getVersionSnapshot` 支持字段级版本累计，与查询字段绑定。

## Validation and benchmarks
- Scenario: 10k items; update a single record.
  - Expect cache hit renders at ~0ms; cache miss重算 ~5ms 左右。
  - Sorting with `limit` 应该从 ~15ms 降到 ~2ms。
- `packages/atoma/benchmark.ts` 可用于 Top-K 对比（TS 脚本，需 ts-node/编译运行）。

## Follow-on items (post-Phase 1, still useFindMany-related)
- Add a query planner to choose index-scan vs full-scan when indexes exist.
- Provide a virtualized `useFindMany` variant for very large lists.
- Optional: move heavy `applyQuery` work to a worker for 100k+ datasets.
