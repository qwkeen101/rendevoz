# 下一轮 Editor 重构任务清单（缺失能力与待办）

> 目的：明确剩余待处理的耦合点、缺失功能以及补齐方式，方便后续继续重构。

## 仍需清理的依赖/耦合

- **Meta/ObjectStore 残留**
  - `packages/editor/src/noteEditor/NoteEditor.tsx`：仍包含 ObjectStore/MetaStore 调用，需改为占位或通过 props/callback 注入。
  - `packages/editor/src/external/api/index.ts`：仍为 stub，可在需要时用真实实现替换或继续精简。
  - 其他零散引用（如 `EditorLinkForm.tsx`、`InlineMetaPicker.tsx` 已部分清理但可再确认无 MetaStore 调用）。

- **AI/业务功能**
  - AI 相关组件/ops 已 stub（`assignAIOps.ts` 等），如需要可通过 props 注入真实 AI 能力或保留占位。

- **文档与类型**
  - `EditorProps` 尚未更新以暴露新 props（如 `toolbarConfig`、`onToolbarEvent`、上传/元数据回调等）。
  - README/示例未覆盖新配置；`REFACTOR_NOTES.md` 需同步补充新的入口/扩展点。

## 已裁剪/占位但需补充的功能点

- **Meta UI**：Meta 元素、同步块、Sidebar 等均为占位。如后续需要，可：
  - 通过 props 提供 `onOpenMeta`、`onPickMeta`、`metaRenderers` 等回调/渲染器。
  - 或继续保持占位，明确开源包不包含业务 Meta 能力。
- **工具栏**：`ToolbarConfig`、`onToolbarEvent` 已透传，可继续扩展默认 actions 或提供示例配置。
- **上传/文件处理**：`withHtml`/`handleAddElementInMenu` 支持 `onFileUpload`，如需更多文件处理能力，可在 props 文档中说明。

## 建议的下一步

1) **彻底移除 Meta/ObjectStore 依赖**：处理 `NoteEditor.tsx` 及零散引用，将逻辑改为占位或 props 回调。
2) **类型与 README 更新**：在 `EditorProps`/类型中加入新的可配置项，并在 README/示例中展示如何注入 toolbar、上传、meta 回调等。
3) **运行类型检查**：在 `packages/editor` 执行 `npm run type-check`，根据报错继续裁剪/修复。
4) **同步文档**：更新 `REFACTOR_NOTES.md` 以反映最新裁剪与扩展点，保持与此清单一致。
