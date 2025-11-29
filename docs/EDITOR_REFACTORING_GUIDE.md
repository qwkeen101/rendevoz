# Editor 代码重构指南

## 问题概述

在 `packages/editor/src` 中发现了 **超过 550 个** `@/` 开头的外部依赖引用。这些需要重构才能让 editor 成为独立的 package。

## 依赖类型分析

### 1. 工具函数依赖（高频）

**引用类型**：`@/utils/id`、`@/utils/*`

**出现位置**：几乎所有文件

**解决方案**：
- 将 `Id` 工具函数迁移到 `@rendevoz/shared/utils`
- 或者在 editor 内部创建 `utils/id.ts`

**示例**：
```typescript
// 当前
import Id from '@/utils/id'

// 方案 1: 使用 shared
import { Id } from '@rendevoz/shared/utils'

// 方案 2: 内部工具
import Id from '../utils/id'
```

### 2. 内部循环引用（高频）

**引用类型**：`@/core/components/editor/*`

**问题描述**：文件之间使用绝对路径相互引用

**解决方案**：改为相对路径

**示例**：
```typescript
// 当前
import EditorElements from '@/core/components/editor/elements/EditorElements'

// 修改后
import EditorElements from '../elements/EditorElements'
或
import EditorElements from './elements/EditorElements'
```

**自动化重构**：可以使用脚本批量替换

### 3. 常量依赖（中频）

**引用类型**：`@/consts`、`@/core/components/editor/consts/*`

**出现位置**：`utils/highlightActions.ts`、`utils/blockActions.ts` 等

**解决方案**：
```typescript
// Colors 常量 - 迁移到 shared
import { Colors } from '@rendevoz/shared/constants'

// Editor专用设置 - 改为相对路径
import EditorSettings from '../consts/settings'
```

### 4. API/Store 依赖（需移除）

**引用类型**：
- `@/api/stores`
- `@/api/fileSystem`
- `@/api/stores/meta/meta.store`

**出现位置**：
- `plugins/slateToMarkdown.ts`
- `plugins/withHtml.ts`

**解决方案**：通过 props 传递或移除功能

**示例 - slateToMarkdown.ts**：
```typescript
// ❌ 当前代码
import { globalStore } from '@/api/stores'
import { metaObjectsAtom } from '@/api/stores/meta/meta.store'
const metaObjects = globalStore.get(metaObjectsAtom)

// ✅ 重构后
// 通过 props 传递
export function slateToMarkdown(value, options?: { metaObjects?: Map<string, any> }) {
  const metaObjects = options?.metaObjects || new Map()
  // ...
}
```

### 5. 核心模块依赖（需移除）

**引用类型**：
- `@/core` (Editor, withReact等)
- `@/core/getSetting`

**出现位置**：
- `TextEditor.tsx`
- `plugins/slateToMarkdown.ts`

**解决方案**：
```typescript
// @/core 中的 Editor 应该是 slate 的
import { Editor, withReact } from 'slate-react'

// getSetting - 通过 props 传递配置
```

## 重构优先级

### Phase 1: 快速修复（立即可做）✅

1. **内部循环引用** - 简单查找替换
   ```bash
   # 将 @/core/components/editor/ 替换为相对路径
   ```

2. **常用工具函数** - 创建内部 utils
   - 复制 `Id` 函数到 `packages/editor/src/utils/id.ts`
   - 更新所有引用

### Phase 2: 常量和配置（可延后）📋

1. **Colors 常量** - 迁移到 shared 或通过 props 传递
2. **EditorSettings** - 改为相对引用
3. **核心设置** - 通过 props 传递配置对象

### Phase 3: API/Store 重构（复杂）⚠️

1. **slateToMarkdown** - 添加 options 参数
2. **withHtml** - 移除 FileSystem 依赖或通过回调
3. **metaObjects** - 通过 props 传递

## 自动化重构脚本

### 脚本 1: 修复内部循环引用

```powershell
# 在 packages/editor/src 目录下运行
# 将 @/core/components/editor/ 替换为相对路径

$files = Get-ChildItem -Recurse -Include *.ts,*.tsx
foreach ($file in $files) {
    (Get-Content $file.FullName) -replace "@/core/components/editor/", "../" | Set-Content $file.FullName
}
```

### 脚本 2: 修复 utils/id 引用

```powershell
# 替换所有 @/utils/id 引用
$files = Get-ChildItem -Recurse -Include *.ts,*.tsx
foreach ($file in $files) {
    (Get-Content $file.FullName) -replace "from '@/utils/id'", "from '../utils/id'" | Set-Content $file.FullName
}
```

## 建议的实施步骤

### 步骤 1: 创建内部工具函数 ✅

```bash
# 复制 Id 函数到 editor
cd packages/editor/src
mkdir -p utils
# 手动创建 utils/id.ts 文件
```

### 步骤 2: 运行自动化脚本 🔄

```bash
# 修复内部循环引用
# 修复 utils 引用
```

### 步骤 3: 手动处理复杂依赖 ⚠️

```typescript
// 查看并手动修复：
// - plugins/slateToMarkdown.ts
// - plugins/withHtml.ts  
// - TextEditor.tsx
```

### 步骤 4: 构建测试 🔨

```bash
cd packages/editor
npm run build
```

### 步骤 5: 修复编译错误 🐛

根据 TypeScript 报错逐个修复剩余问题

## 总结

**依赖统计**：
- ✅ 内部循环引用：~400+（可自动化修复）
- ✅ utils/id：~50+（可自动化修复）
- 📋 常量/配置：~20（需手动处理）
- ⚠️ API/Store：~10（需重构设计）

**预计工作量**：
- 自动化脚本：30分钟
- 手动修复：2-4小时
- 测试验证：1-2小时

**建议**：
先用自动化脚本处理 80% 的简单引用，然后逐步处理复杂的 API/Store 依赖。
