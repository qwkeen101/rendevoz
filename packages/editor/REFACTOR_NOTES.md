# Editor 开源化拆分记录（进行中）

> 目的：记录已拆分/移除的业务耦合点，便于后续按需通过 props 或外部实现补齐。

## 已拆分/占位的功能

- **Meta 相关**
  - `elements/meta/index.tsx` / `InlineMeta.tsx`：改为占位展示，不依赖 MetaStore/ObjectStore。
  - `elements/synced/index.tsx` / `useCheckSyncInWhere.ts`：改为占位/空实现，移除同步检查逻辑。
  - `components/sidebar/EditorSidebar.tsx`：改为简单信息面板，占位展示 metaId。
  - `InnerEditor` 粘贴时不再依赖 MetaStore，纯插入占位节点。

- **工具栏**
  - `EditorSelectionToolbar.tsx` 重写为可配置 `ToolbarConfig`/`ToolbarAction`，默认 Bold/Italic/Underline，可通过 `toolbarConfig`/`onToolbarEvent` props 注入自定义按钮和行为。
  - `Editor`/`InnerEditor` 透传上述配置。

- **核心/组件 stub**
  - `external/core/**`、`external/components/**`、`external/api/**`：提供空实现/占位，解除对业务模块的编译依赖（AI、Media、Meta 渲染等）。

## 待补充/props 化建议

- 侧边栏/菜单/覆盖层中仍残留的 MetaStore/ObjectStore 调用（如 `QuickLabelPopover`、`InlineMetaPicker`、`getMetaMenu`、部分 drag 逻辑），可：
  1) 通过 props 提供回调（如 `onOpenMeta`, `onPickMeta`），默认 no-op；
  2) 或直接占位/删除 UI。
- 图片/文件上传等业务操作：统一通过回调（`onFileUpload` 已存在）。
- README/类型：在 `EditorProps` 补充 `toolbarConfig`/`onToolbarEvent`、上传/元数据回调的说明。

> 更新此文档时，列出拆分文件、改动要点和“如何通过 props 补齐”的指引，方便后续补完或开放扩展点。***
