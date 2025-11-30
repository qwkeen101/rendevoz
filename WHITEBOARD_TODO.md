# Whiteboard 拆分待办（阶段快照）

> 目的：记录当前已完成范围与后续待实现能力，供下一轮继续迭代。适用于 `packages/whiteboard` 新包，不影响现有业务白板。

## 已完成（新包骨架）
- 独立包脚手架、类型/适配器接口、Jotai store/instance 装配（history/coord/container/selection/node/edge/layout）。
- 基础画布：节点渲染与拖拽、节点缩放（八向 resizer）、边渲染、端点拖拽预览、最近节点高亮、框选、pan/zoom。
- 快捷键：撤销/重做（Cmd/Ctrl+Z/Y）、删除、全选、Esc 清空、剪贴板（C/X/V，调用 adapter 提供的 clipboardOps）。
- Selection/Clipboard/History API 对外暴露（selection getter、resetSelectionBox 等）。
- 边重连初步完善：端点重连时使用可配置吸附半径（adapter.settings.edgeSnapRadius），最近节点高亮加强，预览线段与端点方向随命中方位自动切换；未命中时保持原连接。
- 历史状态透出：WhiteboardState.history 维护 undo/redo 计数，Toolbar 按钮状态与 undo/redo 同步。
- 关联更新：节点拖拽/缩放/布局/对齐完成后刷新关联边映射（NODE_TO_EDGE_MAP），Selection 重置保持一致。
- 配置透出：WhiteboardProps.edgeSnapRadius 可覆盖吸附距离，adapter.settings.edgeSnapRadius 作为默认。
- 边预览样式跟随边颜色/样式（预览用 edge.color、dash 样式）。
- 快捷键扩展：Mod+Shift+L/R/T/B/H/V 对齐（左/右/上/下/水平居中/垂直居中），Mod+Shift+P packNodes，复用布局与历史入栈。
- 吸附策略配置：WhiteboardProps.edgeSnapPrefer（或 adapter.settings.edgeSnapPrefer）可选 auto/horizontal/vertical，控制端点重连方向倾向。
- 端点偏移配置：WhiteboardProps.edgeHandleOffset（或 adapter.settings.edgeHandleOffset）控制 handle 偏移；边 marker/箭头内置 `marker` 支持，预览与主线一致。
- 边样式可定制：WhiteboardProps.edgeStyleResolver / state.edgeStyleResolver 注入颜色/线宽/线型/marker，EdgeLayer 根据样式渲染 marker 与预览。
- 快捷键与操作补齐：剪切/复制/粘贴节点与关联边（同一历史入栈、粘贴偏移、自动重映射边）；对齐/分布快捷键（Mod+Shift+L/R/T/B/H/V，Mod+Shift+,/.)，packNodes 快捷键；复制默认包含所选节点关联边。
- **节点注册与渲染机制**：实现 NodeRenderer 接口，支持通过 WhiteboardProps.nodeRenderers 或 adapter.nodeRenderers 注册自定义节点渲染器；内置 Default/Text/Image 三种基础渲染器；Text 使用简化 contentEditable 实现，支持基础编辑。
- **边重连四中心点优先吸附**：优化 resolveAttachPosition 逻辑，实现两级吸附（第一优先级：检测并吸附到节点四个边的中心点，距离 < snapRadius 时生效；第二优先级：fallback 到原有边缘吸附）；提升连线精确度和视觉整洁度。
- **边重连中心点可视化**：拖拽边端点时显示目标节点的四个中心点指示器（小圆点），最近的中心点自动高亮（放大+发光效果）；提供实时视觉反馈，降低操作难度，提升交互专业感。
- **可配置吸附策略**：支持 `snapMode` 配置（`center-4`, `center-8`, `edge`, `mixed-4`, `mixed-8`），扩展 `EdgePosition` 支持八向吸附（增加四个角点），满足电路图、流程图等不同场景的连线需求。

## 待实现 / 待完善
- **边重连进一步打磨**
  - 预览/命中效果：继续桥接到业务/真实样式管线（如动态线宽、阴影、hover 高亮）。
- **关联更新**
- **关联更新**
  - 拖拽/缩放的边重绘目前仍依赖 re-render，可考虑缓存节点/端点 box 或增量更新以提升性能。
  - 对齐/布局后可进一步做 snap/吸附（对齐参考线）、批量更新历史合并策略。
- **节点/边高级渲染**
  - 迁移高级节点类型（freehand/mindmap/metaObject 等）到新渲染器系统。
  - Text 节点可升级为完整 Slate 编辑器（当业务需要时）。
  - 边标签编辑、箭头/marker 自定义。
- **适配器/宿主集成**
  - 在宿主实现 adapter（meta/clipboard/ui/settings/export 等）桥接业务数据，验证新包渲染。
  - 路径别名/构建产物验证（cjs/esm/types），补充文档与示例。
- **测试与稳定性**
  - 覆盖 pan/zoom、拖拽/缩放、重连、快捷键等交互的回归测试计划。
  - 性能：大节点数渲染、事件节流、批量更新合并。

## 备注
- 旧白板代码未改动；新包目前为可交互最小版本，仍需对照 `src/core/components/whiteboard` 迁移剩余逻辑。下一轮可从“边重连完善”或“节点注册”开始。***
