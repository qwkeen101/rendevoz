# Rendevoz Monorepo 重构实施计划

## 目标描述

当前 Rendevoz 项目是一个单体应用（Monolith），所有组件都位于 `src` 目录下。随着项目的发展，我们需要将核心基础组件（editor、whiteboard、pdf、group等）从业务代码中分离出来，构建成一个 **Monorepo** 架构，以实现：

- **代码复用**：基础组件可以在多个项目间共享
- **独立开发**：各组件可以独立开发、测试和版本管理
- **清晰边界**：明确基础组件和业务逻辑的边界
- **更好的维护性**：每个 package 职责单一，更易于维护
- **开源友好**：使用标准的 npm workspaces，便于未来将组件开源发布到 npm 供社区使用

## 用户审核事项

> [!NOTE]
> **Monorepo 工具选择**
> 
> 本方案使用 **npm workspaces**（npm 7+ 原生支持）作为 monorepo 管理工具，原因：
> - npm 原生支持，无需额外安装工具
> - 标准化，更容易被社区接受
> - 网络稳定性好，使用官方 npm registry
> - 便于未来将 packages 开源发布到 npm
> - 与现有 npm 生态完全兼容

> [!WARNING]
> **Breaking Changes**
> 
> 此次重构将带来以下破坏性变更：
> 1. 导入路径变更：从 `@/core/components/editor` 变为 `@rendevoz/editor`
> 2. 构建流程变更：需要先构建各个 package
> 3. 可能影响现有的 CI/CD 流程
> 
> 建议：
> - 在重构过程中使用新分支
> - 保留旧代码直到新架构完全验证通过
> - 更新所有相关文档和构建脚本

> [!IMPORTANT]
> **依赖关系处理策略**
> 
> 发现组件之间存在复杂的依赖关系，采用以下策略：
> 
> 1. **共享基础设施**：创建 `@rendevoz/shared` 存放通用 hooks/utils/types/基础组件
> 2. **状态管理**：每个组件内部管理自己的状态（使用 jotai），不依赖全局 store
> 3. **松耦合原则**：组件之间不直接依赖，只依赖 `@rendevoz/shared`
> 4. **开源准备**：每个 package 都设计为可独立使用，有清晰的 API 和文档
> 
> **桌面应用特殊处理**：
> - `api/stores` 等桌面应用特定逻辑保留在 `apps/desktop`
> - 组件通过 props 接收数据和回调，保持纯净

## 提议的变更

### 第一阶段：Monorepo 基础设施设置

#### [MODIFY] [package.json](file:///c:/Users/Administrator/Rendevoz/package.json)

更新根目录 `package.json`，配置 npm workspaces：

```json
{
  "name": "rendevoz-monorepo",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces",
    "dev": "npm run dev --workspaces",
    "type-check": "npm run type-check --workspaces",
    "clean": "npm run clean --workspaces && rm -rf node_modules"
  }
}
```

**配置说明**：
- `workspaces` 字段定义了 monorepo 结构
- 根目录 `package.json` 的 `private: true` 必须设置
- workspace 脚本会在所有 packages 中并行执行

---

#### [NEW] packages/ 目录结构

创建以下 package 结构：

```
packages/
├── editor/              # 富文本编辑器组件
├── whiteboard/          # 白板组件
├── pdf/                 # PDF 查看器组件
├── group/               # 分组/表格组件
├── media/               # 媒体播放器组件
├── graph/               # 图谱组件
├── shared/              # 共享工具和类型
└── core/                # 核心状态管理和 API
```

---

### 第二阶段：共享基础设施 Package

#### [NEW] [@rendevoz/shared](file:///c:/Users/Administrator/Rendevoz/packages/shared)

**目的**：提供所有 package 共享的工具、类型定义和基础组件，确保每个组件 package 都可以**独立使用和开源**

**包含内容**：
- `src/types/` - 共享类型定义和接口
- `src/utils/` - 通用工具函数（无业务逻辑）
- `src/hooks/` - 通用 React hooks（如 useClickOutside、useDebounce）
- `src/components/` - 基础 UI 组件（Content、Icon、Button 等）
- `src/constants/` - 通用常量

**package.json 示例**：
```json
{
  "name": "@rendevoz/shared",
  "version": "0.1.0",
  "description": "Shared utilities and components for Rendevoz packages",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./hooks": "./dist/hooks/index.js",
    "./utils": "./dist/utils/index.js",
    "./types": "./dist/types/index.js",
    "./components": "./dist/components/index.js"
  },
  "keywords": ["react", "utilities", "components"],
  "license": "MIT",
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

**开源设计原则**：
- 无业务逻辑，只包含通用功能
- 完整的 TypeScript 类型定义
- 每个导出都有 JSDoc 文档
- 提供完整的 README 和使用示例

---

### 第三阶段：编辑器 Package

#### [NEW] [@rendevoz/editor](file:///c:/Users/Administrator/Rendevoz/packages/editor)

**设计目标**：创建一个**独立、可开源**的 Slate 富文本编辑器组件库

**迁移内容**：
- 从 `src/core/components/editor/` 迁移核心编辑器代码
- **重构要点**：移除对 `@/api/stores` 的依赖，改为通过 props 传递数据和回调

**包含模块**：
- `Editor.tsx` - 主编辑器组件（受控组件）
- `TextEditor.tsx` - 简化的文本编辑器
- `elements/` - 可扩展的编辑器元素（块、内联、空白等）
- `plugins/` - 编辑器插件系统
- `hooks/` - 编辑器相关 hooks
- `utils/` - 编辑器工具函数

**package.json 示例**：
```json
{
  "name": "@rendevoz/editor",
  "version": "0.1.0",
  "description": "A powerful rich text editor based on Slate",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "keywords": ["react", "editor", "slate", "wysiwyg"],
  "license": "MIT",
  "peerDependencies": {
    "react": "^18.0.0",
    "slate": "^0.103.0",
    "slate-react": "^0.82.2"
  },
  "dependencies": {
    "slate-history": "^0.109.0",
    "@rendevoz/shared": "workspace:*"
  }
}
```

**API 设计**（开源友好）：
```typescript
<Editor
  value={content}
  onChange={(value) => setContent(value)}
  plugins={[boldPlugin, italicPlugin]}
  readOnly={false}
/>
```

---

### 第四阶段：白板 Package

#### [NEW] [@rendevoz/whiteboard](file:///c:/Users/Administrator/Rendevoz/packages/whiteboard)

**设计目标**：创建一个**独立、可开源**的无限画布白板组件，支持节点、连线、手绘等功能

**迁移内容**：
- 从 `src/core/components/whiteboard/` 迁移核心白板代码
- **重构要点**：使用独立的 jotai store，通过 props 接收初始数据和事件回调

**核心功能模块**：
- `Whiteboard.tsx` - 主白板容器组件
- `nodes/` - 可扩展的节点类型系统
- `edges/` - 连线渲染和管理
- `tools/` - 绘图工具（手绘、形状、文本等）
- `viewport/` - 缩放平移控制
- `plugins/` - 插件系统

**package.json**：
```json
{
  "name": "@rendevoz/whiteboard",
  "version": "0.1.0",
  "description": "Infinite canvas whiteboard component with nodes, edges, and freehand drawing",
  "keywords": ["react", "whiteboard", "canvas", "collaboration"],
  "license": "MIT",
  "peerDependencies": {
    "react": "^18.0.0",
    "jotai": "^2.0.0"
  },
  "dependencies": {
    "pixi.js": "^7.2.4",
    "panzoom": "^9.4.3",
    "perfect-freehand": "^1.2.0",
    "@rendevoz/shared": "workspace:*"
  }
}
```

**API 示例**：
```typescript
<Whiteboard
  nodes={nodes}
  edges={edges}
  onNodesChange={(nodes) => saveNodes(nodes)}
  onEdgesChange={(edges) => saveEdges(edges)}
  readOnly={false}
/>
```

---

### 第五阶段：PDF Package

#### [NEW] [@rendevoz/pdf](file:///c:/Users/Administrator/Rendevoz/packages/pdf)

**设计目标**：创建一个功能完整的 **PDF 查看器组件**，支持注释、高亮、文本选择等

**迁移内容**：
- 从 `src/core/components/pdf/` 迁移 PDF 查看器代码
- **重构要点**：组件内部管理 PDF 文档状态，通过 props 接收文件 URL 和配置

**功能模块**：
- `PdfViewer.tsx` - 主查看器组件
- `Page.tsx` - 单页渲染组件
- `Thumbnails.tsx` - 缩略图导航
- `Toolbar.tsx` - 工具栏（缩放、页面跳转等）
- `Annotations/` - 注释功能
- `TextLayer/` - 文本层（支持选择和搜索）

**package.json**：
```json
{
  "name": "@rendevoz/pdf",
  "version": "0.1.0",
  "description": "PDF viewer component with annotations and text selection",
  "keywords": ["react", "pdf", "viewer", "pdfjs"],
  "license": "MIT",
  "peerDependencies": {
    "react": "^18.0.0"
  },
  "dependencies": {
    "pdfjs-dist": "^4.2.67",
    "@rendevoz/shared": "workspace:*"
  }
}
```

**API 示例**：
```typescript
<PdfViewer
  fileUrl="/path/to/document.pdf"
  page={currentPage}
  onPageChange={setCurrentPage}
  zoom={1.0}
  annotations={annotations}
  onAnnotate={handleAnnotate}
/>
```

---

### 第六阶段：Group Package

#### [NEW] [@rendevoz/group](file:///c:/Users/Administrator/Rendevoz/packages/group)

**设计目标**：创建一个强大的**数据分组和表格组件**，支持多维度分组、排序、过滤等

**迁移内容**：
- 从 `src/core/components/group/` 迁移分组组件代码
- **重构要点**：设计为受控组件，数据和配置通过 props 传入

**功能模块**：
- `Group.tsx` - 主分组容器
- `Grouper/` - 分组逻辑和渲染
- `Table/` - 表格视图
- `Filters/` - 过滤器
- `Sorters/` - 排序器
- `DragDrop/` - 拖拽排序支持

**package.json**：
```json
{
  "name": "@rendevoz/group",
  "version": "0.1.0",
  "description": "Advanced data grouping and table component with sorting, filtering, and drag-drop",
  "keywords": ["react", "table", "grid", "grouping", "data-visualization"],
  "license": "MIT",
  "peerDependencies": {
    "react": "^18.0.0"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@rendevoz/shared": "workspace:*"
  }
}
```

**API 示例**：
```typescript
<Group
  data={items}
  groupBy={["category", "priority"]}
  sortBy="date"
  filters={filters}
  onDataChange={handleDataChange}
  enableDragDrop
/>
```

---

### 第七阶段：其他组件 Packages

#### [NEW] [@rendevoz/media](file:///c:/Users/Administrator/Rendevoz/packages/media)
从 `src/core/components/media/` 迁移（74个文件）

#### [NEW] [@rendevoz/graph](file:///c:/Users/Administrator/Rendevoz/packages/graph)
从 `src/core/components/graph/` 迁移（38个文件）

#### [NEW] [@rendevoz/feed](file:///c:/Users/Administrator/Rendevoz/packages/feed)
从 `src/core/components/feed/` 迁移（58个文件）

#### [NEW] [@rendevoz/youtube](file:///c:/Users/Administrator/Rendevoz/packages/youtube)
从 `src/core/components/youtube/` 迁移（40个文件）

#### [NEW] [@rendevoz/podcast](file:///c:/Users/Administrator/Rendevoz/packages/podcast)
从 `src/core/components/podcast/` 迁移（47个文件）

---

### 第八阶段：主应用重构

#### [NEW] [apps/desktop](file:///c:/Users/Administrator/Rendevoz/apps/desktop)

**目的**：将现有的 Electron 应用迁移到 `apps/desktop`

**迁移内容**：
- 移动 `src/` 中的业务逻辑代码
- 保留 `electron/` 目录
- 更新所有导入路径

**package.json**：
```json
{
  "name": "@rendevoz/desktop",
  "dependencies": {
    "@rendevoz/editor": "workspace:*",
    "@rendevoz/whiteboard": "workspace:*",
    "@rendevoz/pdf": "workspace:*",
    "@rendevoz/group": "workspace:*",
    "@rendevoz/core": "workspace:*",
    "@rendevoz/shared": "workspace:*"
  }
}
```

---

#### [MODIFY] 导入路径更新

所有导入需要从：
```typescript
import { Editor } from '@/core/components/editor'
import { Whiteboard } from '@/core/components/whiteboard'
import Pdf from '@/core/components/pdf'
```

更改为：
```typescript
import { Editor } from '@rendevoz/editor'
import { Whiteboard } from '@rendevoz/whiteboard'
import { Pdf } from '@rendevoz/pdf'
```

---

### 第九阶段：构建配置

#### [NEW] packages/*/tsconfig.json

为每个 package 创建独立的 TypeScript 配置：

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "declarationDir": "./dist",
    "declaration": true
  },
  "include": ["src"]
}
```

---

#### [NEW] [tsconfig.base.json](file:///c:/Users/Administrator/Rendevoz/tsconfig.base.json)

创建基础 TypeScript 配置供所有 package 继承

---

#### [MODIFY] [vite.config.ts](file:///c:/Users/Administrator/Rendevoz/vite.config.ts)

更新 Vite 配置以支持 monorepo：
- 配置 package 别名
- 设置构建优化
- 处理 workspace 依赖

---

#### [NEW] packages/*/package.json 构建脚本

每个 package 的 `package.json` 包含：

```json
{
  "scripts": {
    "build": "tsc && vite build",
    "dev": "vite build --watch",
    "type-check": "tsc --noEmit"
  }
}
```

---

### 第十阶段：依赖管理和优化

#### [MODIFY] 根 package.json - 添加 workspace 脚本

```json
{
  "scripts": {
    "build": "npm run build --workspaces --if-present",
    "dev": "npm run dev --workspaces --if-present",
    "type-check": "npm run type-check --workspaces",
    "clean": "npm run clean --workspaces --if-present && rm -rf node_modules",
    "publish:all": "npm publish --workspaces --access public"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0"
  }
}
```

**npm workspaces 命令说明**：
- `--workspaces`：在所有 workspace 中运行命令
- `--if-present`：如果脚本不存在则跳过（避免报错）
- `--workspace=<name>`：在特定 workspace 中运行

---

#### [NEW] [.changeset/config.json](file:///c:/Users/Administrator/Rendevoz/.changeset/config.json)

配置 changesets 用于版本管理和发布（为开源发布做准备）：

```json
{
  "$schema": "https://unpkg.com/@changesets/config@2.3.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["@rendevoz/desktop"]
}
```

## 验证计划

### 自动化测试

1. **类型检查验证**
   ```bash
   # 在项目根目录运行
   npm run type-check
   ```
   预期：所有 packages 类型检查通过，无错误

2. **构建验证**
   ```bash
   # 构建所有 packages
   npm run build
   ```
   预期：
   - 所有 packages 成功构建
   - 生成 `dist/` 目录包含编译后的文件
   - 生成 `.d.ts` 类型声明文件

3. **依赖关系验证**
   ```bash
   # 检查 workspace 依赖
   npm ls --workspaces --depth=0
   ```
   预期：显示正确的 workspace 依赖关系

4. **开发模式验证**
   ```bash
   # 启动开发模式
   cd apps/desktop
   npm run dev
   ```
   预期：
   - 应用正常启动
   - 热重载功能正常
   - 所有组件可以正常加载

### 手动验证

1. **编辑器功能验证**
   - 启动应用后创建一个新文档
   - 测试富文本编辑功能（加粗、斜体、列表等）
   - 验证编辑器插件是否正常工作
   - 确认没有控制台错误

2. **白板功能验证**
   - 创建一个新白板
   - 测试节点创建、拖拽、连线功能
   - 测试工具栏和侧边栏
   - 测试手绘功能
   - 验证缩放和平移功能

3. **PDF 查看器验证**
   - 打开一个 PDF 文件
   - 测试页面导航
   - 测试缩放功能
   - 测试文本选择和复制
   - 验证侧边栏（缩略图、大纲）

4. **分组/表格功能验证**
   - 创建一个新的分组/表格
   - 测试添加、删除、排序功能
   - 测试拖拽排序
   - 验证数据显示正确

5. **构建产物验证**
   ```bash
   # 构建生产版本
   npm run build
   cd apps/desktop
   npm run publishMac  # 或 publishWindows
   ```
   - 验证 Electron 应用能正常打包
   - 安装打包后的应用并测试基本功能
   - 确认应用体积合理（没有重复依赖）

### 迁移验证

1. **代码搜索验证**
   ```bash
   # 搜索是否还有旧的导入路径
   grep -r "@/core/components/editor" apps/desktop/src
   grep -r "@/core/components/whiteboard" apps/desktop/src
   ```
   预期：应该没有结果（所有导入已更新）

2. **依赖完整性验证**
   - 检查每个 package 的 `package.json` 确保所有依赖都已声明
   - 运行 `npm install` 确保没有缺失的依赖
   - 验证 `node_modules` 结构正确（npm workspaces 会提升公共依赖到根目录）

## 实施步骤建议

1. **Phase 0 - 准备**（1天）
   - 创建新分支 `refactor/monorepo`
   - 备份当前代码
   - 设置 pnpm workspace

2. **Phase 1 - 共享基础**（2天）
   - 创建 `@rendevoz/shared` 和 `@rendevoz/core`
   - 迁移共享代码
   - 验证构建

3. **Phase 2 - 核心组件**（3-5天）
   - 逐个迁移 editor、whiteboard、pdf、group
   - 每迁移一个组件就测试一次
   - 更新导入路径

4. **Phase 3 - 其他组件**（2-3天）
   - 迁移 media、graph、feed 等
   - 批量更新导入路径

5. **Phase 4 - 主应用**（2天）
   - 迁移业务代码到 `apps/desktop`
   - 更新所有导入
   - 完整测试

6. **Phase 5 - 优化和文档**（1-2天）
   - 优化构建配置
   - 编写文档
   - 设置 CI/CD

**总计：约 2-3 周**

## 目录结构最终效果

```
Rendevoz/
├── packages/
│   ├── shared/              # 共享工具和类型
│   ├── core/                # 核心状态管理
│   ├── editor/              # 编辑器组件
│   ├── whiteboard/          # 白板组件
│   ├── pdf/                 # PDF 查看器
│   ├── group/               # 分组组件
│   ├── media/               # 媒体组件
│   ├── graph/               # 图谱组件
│   ├── feed/                # Feed 组件
│   ├── youtube/             # YouTube 组件
│   └── podcast/             # Podcast 组件
├── apps/
│   └── desktop/             # Electron 桌面应用
│       ├── src/             # 业务逻辑代码
│       ├── electron/        # Electron 主进程
│       └── package.json
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
└── README.md
```
