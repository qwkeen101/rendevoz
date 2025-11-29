# Editor 组件开源重构快速指南

本文档提供 Editor 组件开源重构的快速参考。

## 📊 当前状态

### ✅ 已完成（Phase 1）
- 内部循环引用修复（~100 个文件）
- ID 工具函数迁移
- 基础 package 结构创建

### 📋 待处理的外部依赖

#### 高优先级（必须处理）

**1. API/Store 依赖** - 需要移除
```typescript
// 文件：plugins/slateToMarkdown.ts, plugins/withHtml.ts 等

// ❌ 当前
import { globalStore } from '@/api/stores'
import { metaObjectsAtom } from '@/api/stores/meta/meta.store'

// ✅ 方案：通过 props/options 传递
export function slateToMarkdown(value, options?: {
  metaObjects?: Map<string, any>,
  getSetting?: () => any
}) {
  // ...
}
```

**2. 核心模块依赖** - 需要替换
```typescript
// 文件：TextEditor.tsx

// ❌ 当前
import { Editor, withReact } from '@/core'

// ✅ 应该使用 slate-react
import { Editor, withReact } from 'slate-react'
```

**3. FileSystem 依赖** - 需要移除或回调
```typescript
// 文件：plugins/withHtml.ts

// ❌ 当前
import FileSystem from '@/api/fileSystem'

// ✅ 方案：通过回调处理
interface EditorOptions {
  onFileUpload?: (file: File) => Promise<string>
}
```

#### 中优先级（可以延后）

**4. 常量依赖**
- `@/consts/Colors` → 移到 @rendevoz/shared 或通过主题 props
- `@/consts/Keys` → 移到 editor 内部或 shared

**5. 组件依赖**
- `@/components` → 逐步迁移到 @rendevoz/shared/components

## 🔧 推荐的重构步骤

### Step 1: 处理核心依赖（必须）

```bash
# 查找所有 @/core 引用
grep -r "from '@/core'" packages/editor/src
```

**替换策略**：
- `@/core` 中的 Editor/withReact → 使用 `slate-react`
- `@/core` 中的 getSetting → 通过 props 传递配置

### Step 2: 移除 API/Store 依赖（必须）

**受影响文件**：
- `plugins/slateToMarkdown.ts`
- `plugins/withHtml.ts`

**重构思路**：
```typescript
// 示例：slateToMarkdown 重构

// 旧版本
export function slateToMarkdown(value) {
  const metaObjects = globalStore.get(metaObjectsAtom)
  const setting = getSetting()
  // ...
}

// 新版本（开源友好）
export interface SlateToMarkdownOptions {
  metaObjects?: Map<string, any>
  imageBaseUrl?: string
  linkFormat?: 'markdown' | 'wiki'
}

export function slateToMarkdown(
  value: Descendant[],
  options: SlateToMarkdownOptions = {}
) {
  const { metaObjects = new Map(), linkFormat = 'markdown' } = options
  // ...
}
```

### Step 3: 处理常量依赖（可选）

**Colors 常量**：
```typescript
// 方案 A：移到 shared
import { Colors } from '@rendevoz/shared/constants'

// 方案 B：通过主题 props
interface EditorProps {
  theme?: {
    colors: {
      highlight: string
      selection: string
    }
  }
}
```

### Step 4: 设计开源友好的 API

```typescript
// packages/editor/src/Editor.tsx

export interface EditorProps {
  // 基础属性
  value: Descendant[]
  onChange: (value: Descendant[]) => void
  readOnly?: boolean
  
  // 可选配置
  theme?: EditorTheme
  plugins?: EditorPlugin[]
  
  // 回调函数（替代全局依赖）
  onFileUpload?: (file: File) => Promise<string>
  onLinkClick?: (url: string) => void
  
  // 自定义渲染
  renderElement?: RenderElementProps
  renderLeaf?: RenderLeafProps
}

export function Editor(props: EditorProps) {
  // ...
}
```

## 🔍 检查清单

开源发布前检查：

- [ ] 移除所有 `@/api/*` 导入
- [ ] 移除所有 `@/core/*` 导入（除非是内部引用）
- [ ] 替换 `@/consts` 为内部常量或 props
- [ ] 替换 `@/components` 为 @rendevoz/shared
- [ ] 确保没有业务逻辑依赖
- [ ] 所有功能通过 props/options 可配置
- [ ] 类型定义完整
- [ ] README 文档完善
- [ ] 示例代码可运行

## 📝 示例重构对比

### 重构前（不适合开源）
```typescript
import { globalStore } from '@/api/stores'
import { Colors } from '@/consts'

function MyComponent() {
  const data = globalStore.get(someAtom)
  return <div style={{ color: Colors.Primary }} />
}
```

### 重构后（开源友好）
```typescript
interface MyComponentProps {
  data: SomeData
  theme?: { primaryColor: string }
}

function MyComponent({ data, theme }: MyComponentProps) {
  return <div style={{ color: theme?.primaryColor || '#000' }} />
}
```

## 📚 更多资源

- [完整重构指南](./EDITOR_REFACTORING_GUIDE.md)
- [开源发布指南](./OPENSOURCE_GUIDE.md)
- [Monorepo 实施计划](./MONOREPO_IMPLEMENTATION_PLAN.md)

---

**开始重构**：从处理 API/Store 依赖开始，这是最关键的部分！
