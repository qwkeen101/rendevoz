# Whiteboard 开源拆分方案（根目录版）

> 目标：将 `src/core/components/whiteboard` 拆分为 `packages/whiteboard` 独立开源组件（无业务耦合、可通过 props/插件扩展业务能力）。

## 1. 现状速览
- **核心结构**：`index.tsx` 用 Jotai `Provider` 创建独立 store，`WhiteboardInstance` 聚合 ops（node/edge/layout/panzoom/history 等），`WhiteboardAtom` 持久化 `Map` 结构的 nodes/edges。
- **功能块**：节点（text/freehand/mindmap/group/metaObject 等）、边与对齐、自由画笔、拖拽/缩放、浮动工具条、右侧栏、搜索、粘贴/拖放、快捷键、导出图片、迷你地图。
- **业务耦合**：大量直接依赖全局 store、Meta/对象体系、业务 UI 组件与场景（PDF/Note/Chat/Exam 等）、全局设置与 i18n 常量。

## 2. 主要耦合点清单（需隔离）
- **数据持久化/全局 store**
  - `ObjectStore('whiteboard')`/`globalStore` 同步白板状态与 Dexie（`index.tsx`, `hooks/useUpdateWhiteboard.ts`）。
  - `MetaStore` 读写 meta 链接、元数据（多处：`useWhiteboardInstance`, `useWhiteboardDrop`, `WhiteboardContent`, `MetaObjectNode`, `WhiteboardNode` 等）。
  - 其他业务 store：`groupStore`、`NoteStore`、`SearchHelper`、`ObjectStore('syncedBlock')` 等。
- **全局单例/上下文**
  - `Global`（未显式 import）用于拖拽、复制、打开对象、创建对象、获取图标/名称等（如 `hooks/useWhiteboardDrop.ts`, `toolbars/contextMenus/*`, `node/MetaObjectNode.tsx`）。
  - `SettingAtom`/`getSetting`/`GlobalSetting` 读取默认线条/背景/主题配置（`index.tsx`, `WhiteboardMinimap.tsx`, `WhiteboardSettings.tsx` 等）。
- **业务节点与渲染**
  - `MetaObjectNode` 嵌入业务场景：`Video/Audio/Webpage/Note/PDF/Chat/Tweet/Exam/...`（`node/nodes/*.tsx`），`WhiteboardNode` 递归嵌套白板，`SyncedBlockNode`、`ExamNode` 等。
  - 搜索/右侧栏依赖 Meta 名称、标签、对象列表（`WhiteboardContent.tsx`, `WhiteboardSearch.tsx`）。
- **UI/设计体系**
  - `@/components`（Content/Icon/Menu/Popover/Toolbar/WithBorder 等）、`@/hooks`（`useSelectAtomValue`、`useRafFn` 等）、`@/consts`（Colors/Icons/KEY/MarkerColor）、`@/assets/images/placeholder.svg`。
  - i18n：`trans` 常量与 `react-i18next`/`i18next` 文案。
- **工具/类型**
  - `slateToMarkdown`, `deserializeHTML/deserializeMarkdown`（粘贴逻辑）；`Id`、`assignProperties` 等 util。
  - 路径别名 `@/*`、`~/*`（`~/typings`）需改为包内导出或对外类型。

## 3. 拆分设计原则
- **Headless 核心 + 插件模式**：包内提供“白板引擎”（渲染、选择、缩放、节点/边数据结构、历史/对齐/自由画笔等），业务能力通过插件/回调注入。
- **外部驱动的状态与持久化**：对外暴露 `value`（whiteboard 数据）与 `onChange`/`onPatch`，内部不感知 Dexie/ObjectStore。历史/撤销可留在包内，但保存交给宿主。
- **可插拔节点/行为**：默认仅保留基础节点（text/image/freehand/mindmap/group）、基础粘贴/拖拽；业务节点（metaObject、syncedBlock、exam 等）由宿主通过 `nodeRenderers`/`nodeDefinitions` 注册。
- **适配层隔离业务 API**：所有 `Global*`、`MetaStore`、`ObjectStore` 能力改为通过 `WhiteboardAdapter` 接口注入（如 normalizeFile/drag data、openObject、createMetaLink、getIcon/getName、toast/confirm 等），包内提供空实现。
- **UI/主题解耦**：包内使用轻量基础样式或可替换的 UI 组件接口（允许宿主提供 Icon/Popover/Menu/ColorPicker/Toast），默认实现依赖 `@rendevoz/shared` 或最小内置样式。
- **国际化**：移除 `trans` 依赖，文案通过 `locale`/`messages` 注入，默认英文。

## 4. 包结构建议（对齐 `packages/editor`）
- `packages/whiteboard/package.json`：声明 peer deps（react/jotai/immer/lodash/perfect-freehand/react-rnd/html-to-image 等），main/module/types，build 脚本复用当前构建链。
- `src/` 分层：
  - `core/`：Whiteboard 入口、实例/ops、状态管理（不含业务 store）。
  - `nodes/`：基础节点实现 + `registerNode` API；业务节点移至宿主侧。
  - `plugins/`：可选插件（freehand、mindmap、history、minimap、export-as-image）。
  - `adapters/`：接口定义（storageAdapter、assetLoader、clipboardAdapter、metaAdapter、uiAdapter）。
  - `styles/`：可覆盖的 CSS/token。
- `docs/`：README、API（props、适配器/插件注册示例）、迁移指南。

## 5. 迁移步骤（推荐顺序）
1. **创建包骨架**：在 `packages/whiteboard` 建 package.json/tsconfig/build 脚本，添加基础入口导出（占位）。
2. **抽离纯工具与类型**：将 `utils.ts`、`positionUtils.ts`、`utils/align/*`、`panzoom` 等无业务依赖的逻辑搬入新包或 `@rendevoz/shared`，修正路径别名。
3. **持久化解耦**：重写 `useUpdateWhiteboard`/`Whiteboard` 入口，使其依赖 `props.value`/`onChange`，删除 `ObjectStore`/`globalStore` 直接调用；宿主层在 `src/core` 实现旧接口适配器。
4. **适配器替代 Global/Meta 能力**：定义 `WhiteboardAdapter`（drag & drop normalize、openObject、createMetaLink、toast、getIcon/getName、clipboard、settings 读取等），将 `Global/MetaStore/getSetting` 调用改为适配器；在 app 内提供实现。
5. **插件化业务节点/动作**：
   - 提供 `registerNodeType`/`renderNode` 接口，默认内置基础节点；`MetaObjectNode` 及相关粘贴/搜索/右侧栏逻辑拆到宿主插件。
   - 粘贴/拖拽/快捷键中与 meta/文件系统相关的分支改为可配置 hook（`onDrop`, `onPaste`, `onShortcut`）。
6. **UI/主题层替换**：把 `@/components` 依赖换成包内基础组件或由宿主传入的组件集合（Icon/Popover/Menu/Button/ColorPicker/Toolbar/Toast）。颜色与图标通过 theme/config 注入，移除 `@/consts` 直接引用。
7. **国际化与文案**：把 `trans`/`useTranslation` 调用改为从 `props.messages` 或 `context` 获取，默认英文 fallback。
8. **回归与示例**：在宿主 app 添加适配器桥接层，跑通现有场景；补充文档与最小 demo（纯 React 页面）；补充类型导出与验收清单。

## 6. 拆分后对外 API（建议草案）
- `<Whiteboard value={whiteboard} onChange={...} readOnly settings={...} adapter={...} plugins={[...]} nodeRenderers={{ text, image, mindmap, ... }} />`
- `adapter`：`storage`（可选，本地 history 仍在包内）、`meta`（open/link/copy/getIcon/getName）、`assets`（normalizeFile/resolveUrl）、`ui`（toast/modal/menu/icon）、`clipboard`。
- `plugins`：`freehandPlugin`, `historyPlugin`, `minimapPlugin`, `exportImagePlugin`, 自定义 `metaObjectPlugin`（宿主实现）。
- `types`：导出 `IWhiteboard/IWhiteboardNode/IWhiteboardEdge/IWhiteboardInstance/INodeRenderer` 等。

## 7. 迁移风险与注意事项
- **Map 序列化兼容性**：外部存储需要自定义序列化/反序列化（当前 `transformData` 逻辑）。
- **历史记录**：`immer` patches 与外部 `onChange` 交互需确认（避免双重记录/性能问题）。
- **自由画笔与导出图片**：依赖 `perfect-freehand`、`html-to-image`，需在包内声明 peer/dep 并处理 SSR。
- **性能**：现有依赖 `useRafFn`/`debounce`/`panzoom`，拆分后注意默认配置与可配置项。
- **UI 差异**：宿主提供的 UI 组件能力（Popover/Menu/ColorPicker）需满足键盘/无障碍需求。

## 8. 验收清单（开源版）
- 包内不再出现 `@/api/*`、`@/core/*`（宿主层适配）、`Global`、`MetaStore`、`SettingAtom` 等引用。
- 默认节点/插件运行无需业务数据；业务节点通过插件注册。
- Props/Adapter/Plugin 文档齐全，有最小 demo。
- 类型与构建产物（cjs/esm/types）可直接被外部消费；依赖列表最小化且清晰。
