# Editor 开源重构路线图（根目录版）

> 目标：让 `packages/editor` 脱离业务耦合，成为独立可发布的 npm 包。本文总结需要去除的依赖、替代方案与落地顺序，覆盖最近发现的耦合点（如 `PageConfigContext` 等）。

## 1. 外部依赖清单与替代方式

- **核心/Store 依赖（必须移除）**
  - `@/core`（如 `GlobalSetting`、`ReactEditor`）→ 使用 `slate-react`、内部 helper 或通过 props 传入配置。
  - `@/api/stores`、`@/api/fileSystem` → 通过回调/参数传入（示例见「回调接口」）。
- **常量/组件（逐步替换）**
  - `@/consts`、`@/components` → 移到 `@rendevoz/shared` 或在 editor 内部定义最小常量/组件。
- **上下文耦合（可选/默认值）**
  - `PageConfigContext` 等业务配置 → 提供本地默认值，允许调用方通过 props 注入（不强制依赖外部 Context）。

## 2. 回调接口设计（替代业务能力）

- **文件上传**：`withHtml` 接收 `onFileUpload?: (file: File) => Promise<string>`，由外部决定存储位置。
- **Markdown/HTML 序列化配置**：`slateToMarkdown(value, options)` 支持 `metaObjects`、`resolveFileUrl`、`defaultCodeLanguage`、`fileBasePath`，避免直接读取全局 store。
- **其他业务操作**：如打开对象/标签等，统一通过可选事件或 props 注入，默认不耦合具体实现。

## 3. 组件/插件改造准则

1) **入口组件 (`Editor`, `TextEditor`)**
   - 不再依赖业务 Context；提供默认 `PageConfig`，允许 `props` 覆盖（如是否展示 Header、Sidebar 等）。
   - 所有外部能力（上传、设置、序列化参数）通过 props/options 传入。
2) **插件层**
   - `withHtml`: 移除文件系统依赖，改为 `onFileUpload` 回调；本地文件直接使用 `file://`。
   - `slateToMarkdown`: 移除 store/setting 读取，改为 options 驱动。
3) **工具与常量**
   - `Id`、常用 utils 保持在 `packages/editor/src/utils` 或迁移到 `@rendevoz/shared/utils`。
   - 色值/键位等常量提供最小内置版或允许外部通过 theme/props 注入。

## 4. 推荐实施顺序

1. **移除核心/Store 依赖**
   - 将 `@/core` 的 Editor/React 部分替换为 `slate-react`。
   - 去掉 `GlobalSetting` 读取，提供默认配置并允许 props 覆盖。
2. **插件解耦**
   - `slateToMarkdown`: 接收 `metaObjects`/`resolveFileUrl` 等 options。
   - `withHtml`: 改用 `onFileUpload`，不写入本地文件系统。
3. **上下文与常量**
   - 提供 `PageConfigContext` 的默认实现；不要求外部传入。
   - 将 `@/consts`、`@/components` 迁移/内置。
4. **API 对外化**
   - 在 `EditorProps` 中暴露新增回调/配置项（文件上传、序列化选项、主题等）。
   - 更新 README/示例，标明「可选能力需自行实现」。

## 5. 验收清单

- [ ] `packages/editor/src` 无 `@/api/*`、`@/core/*` 业务依赖。
- [ ] 插件层仅依赖传入的 options/回调；无全局 store/文件系统调用。
- [ ] 提供默认配置（PageConfig、主题/常量），可被 props 覆盖。
- [ ] 类型定义暴露新的回调/配置项；示例可运行。
- [ ] README/文档说明开源环境下需由调用方实现的能力。
