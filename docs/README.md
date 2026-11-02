# Rendevoz Monorepo 重构文档索引

本目录包含 Rendevoz 项目从单体应用迁移到 Monorepo 架构的所有文档。

## 📚 文档列表

### 1. [整体实施计划](./MONOREPO_IMPLEMENTATION_PLAN.md)
**用途**：完整的 monorepo 重构方案
- Monorepo 架构设计
- 所有 packages 的详细规划（editor、whiteboard、pdf、group 等）
- 依赖关系处理策略
- 验证计划和实施步骤

### 2. [Editor 重构指南](./EDITOR_REFACTORING_GUIDE.md) ⭐ 当前重点
**用途**：Editor 组件重构的具体指导
- 外部依赖分析（550+ 引用）
- 按类型分类的重构方案
- 自动化脚本和手动处理步骤
- Phase 1-3 分阶段实施计划

**重点内容**：
- ✅ Phase 1: 内部引用修复（已完成）
- 📋 Phase 2: 常量和配置重构
- 📋 Phase 3: API/Store 依赖解耦

### 3. [开源发布指南](./OPENSOURCE_GUIDE.md)
**用途**：将 packages 发布到 npm 的完整流程
- Package 设计原则
- 必需文件清单
- 发布流程（使用 changesets）
- 版本管理和维护

### 4. [Phase 1 进展报告](./PHASE1_PROGRESS.md)
**用途**：当前完成进度和状态
- 已完成工作总结
- 自动化修复结果
- 保留的外部依赖列表
- 下一步行动建议

## 🎯 当前状态

### ✅ 已完成
- Monorepo 基础设施（npm workspaces）
- @rendevoz/shared package 结构
- @rendevoz/editor package 创建（249 个文件）
- Phase 1 自动化修复（~110 个文件）

### 🔄 进行中
- Editor 组件重构（准备开源）

### 📋 待办
- Editor 外部依赖处理（API/Store、Constants）
- 其他组件拆分（whiteboard、pdf、group）

## 📖 快速开始

### Editor 重构步骤

1. **查看当前依赖状态**
   ```bash
   grep -r "from '@/" packages/editor/src | wc -l
   ```

2. **运行自动化脚本**（已完成）
   - ✅ 内部循环引用修复
   - ✅ ID 工具函数迁移

3. **手动处理复杂依赖**
   参考 [EDITOR_REFACTORING_GUIDE.md](./EDITOR_REFACTORING_GUIDE.md) 的 Phase 2/3

4. **测试构建**
   ```bash
   cd packages/editor
   npm run type-check
   npm run build
   ```

## 🔧 工具和脚本

### 已创建的脚本
- `fix-editor-imports.ps1` - 自动修复 editor 导入（已执行）

### 推荐的下一步脚本
参考 EDITOR_REFACTORING_GUIDE.md 中的自动化脚本部分

## 📞 支持

如有问题或需要帮助，请参考各文档中的详细说明。

---

**文档更新时间**: 2025-11-29
**当前版本**: v1.0 (Phase 1 完成)
