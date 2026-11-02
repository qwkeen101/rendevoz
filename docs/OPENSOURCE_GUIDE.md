# 组件开源发布指南

本文档说明如何将 Rendevoz 的各个组件 package 发布到 npm，供社区使用。

## 开源准备清单

### 1. Package 设计原则

每个 package 在设计时都需要遵循以下原则，确保可以独立使用：

- ✅ **无业务逻辑依赖**：不依赖 Rendevoz 桌面应用特定的 store、API 或配置
- ✅ **受控组件设计**：通过 props 接收数据和回调，而不是依赖全局状态
- ✅ **完整的类型定义**：提供完整的 TypeScript 类型声明文件
- ✅ **清晰的 API**：简单直观的 API 设计，易于理解和使用
- ✅ **Peer Dependencies**：将 React 等框架依赖设为 peerDependencies

### 2. 必需文件

每个 package 发布前必须包含：

#### README.md
```markdown
# @rendevoz/[package-name]

[简短描述]

## Installation

\`\`\`bash
npm install @rendevoz/[package-name]
\`\`\`

## Usage

\`\`\`tsx
import { Component } from '@rendevoz/[package-name]'

function App() {
  return <Component ... />
}
\`\`\`

## API Reference

[详细 API 文档]

## License

MIT
```

#### LICENSE
使用 MIT License（或根据团队决定选择其他开源协议）

#### CHANGELOG.md
使用 changesets 自动生成版本变更日志

### 3. Package.json 必需字段

```json
{
  "name": "@rendevoz/package-name",
  "version": "0.1.0",
  "description": "清晰简洁的描述",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "keywords": ["react", "component", ...],
  "author": "Rendevoz Team",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/RealRong/Rendevoz",
    "directory": "packages/package-name"
  },
  "bugs": {
    "url": "https://github.com/RealRong/Rendevoz/issues"
  },
  "homepage": "https://github.com/RealRong/Rendevoz/tree/main/packages/package-name"
}
```

## 发布流程

### 使用 Changesets 管理版本

1. **添加变更集**
   ```bash
   npx changeset
   ```
   按提示选择要发布的 packages 和版本类型（major/minor/patch）

2. **更新版本和生成 CHANGELOG**
   ```bash
   npx changeset version
   ```

3. **构建所有 packages**
   ```bash
   npm run build
   ```

4. **发布到 npm**
   ```bash
   npx changeset publish
   ```

### 首次发布流程

1. **注册 npm 组织**
   - 访问 https://www.npmjs.com/
   - 创建组织 `@rendevoz`（如果还没有）
   - 邀请团队成员加入组织

2. **登录 npm**
   ```bash
   npm login
   ```

3. **发布单个 package（测试）**
   ```bash
   cd packages/shared
   npm publish --access public
   ```

4. **发布所有 packages**
   ```bash
   # 在根目录
   npm run publish:all
   ```

## 发布前检查清单

- [ ] 所有测试通过
- [ ] TypeScript 编译无错误
- [ ] 文档完整（README、API文档、示例）
- [ ] 版本号符合语义化版本规范
- [ ] CHANGELOG 已更新
- [ ] LICENSE 文件存在
- [ ] package.json 所有必需字段填写完整
- [ ] 构建产物正确（检查 dist/ 目录）
- [ ] Peer dependencies 正确设置

## 发布策略

### 版本管理

- **Major (1.0.0)**：破坏性变更
- **Minor (0.1.0)**：新功能，向后兼容
- **Patch (0.0.1)**：Bug 修复，向后兼容

### 发布频率

- **定期发布**：每周或每两周发布一次稳定版本
- **Hotfix**：紧急 bug 修复随时发布
- **Beta 版本**：使用 `0.x.x-beta.x` 进行内测

### 标签管理

```bash
# 发布 beta 版本
npm publish --tag beta

# 发布 latest（默认）
npm publish --tag latest

# 发布特定版本
npm publish --tag next
```

## 示例：发布 @rendevoz/editor

```bash
# 1. 进入 editor package
cd packages/editor

# 2. 确保依赖已安装
npm install

# 3. 运行测试
npm test

# 4. 构建
npm run build

# 5. 本地测试（可选）
npm link
cd ~/test-project
npm link @rendevoz/editor

# 6. 发布
npm publish --access public
```

## 维护和更新

### 监控使用情况

- 定期检查 npm 下载统计
- 关注 GitHub Issues 和 Pull Requests
- 收集用户反馈

### 更新流程

1. 修复 bug 或添加功能
2. 添加 changeset
3. 更新文档
4. 提交代码并合并到主分支
5. 运行 `changeset version` 和 `changeset publish`

## 注意事项

⚠️ **发布后无法撤回**：npm 上发布的版本无法删除（24小时内可以 unpublish）

⚠️ **版本号只能递增**：不能发布已存在的版本号

⚠️ **公开发布**：使用 `--access public` 确保 scoped packages 可以公开访问

✅ **建议先发布到私有 registry 测试**：可以先发布到 Verdaccio 等私有 registry 进行测试
