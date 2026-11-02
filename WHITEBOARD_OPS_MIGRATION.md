## 背景

`packages/whiteboard/src/core` 目前已补齐大部分通用 ops（layout/node/container/coord/group/mindmap/content/history 等），剔除了 MetaStore/业务耦合逻辑，聚焦纯白板能力。本文记录旧版能力清单、已迁移内容与剩余缺口，便于后续收尾。

## 旧版实例能力来源

- 入口：`src/core/components/whiteboard/hooks/useWhiteboardInstance.ts`
- 绑定的 ops：
  - `assignLayoutOps` (`hooks/ops/layout.ts`)
  - `assignNodeOps` (`hooks/ops/node.ts`)
  - `assignCoordOps` (`hooks/ops/coord.ts`)
  - `assignContainerOps` (`hooks/ops/container.ts`)
  - `assignGroupOps` (`hooks/ops/group.ts`)
  - `assignMindmapOps` (`hooks/ops/mindmap.ts`)
  - `assignContentOps` (`hooks/ops/content.ts`)
- 其他额外挂载：`getNode`/`deleteNode`/`deleteEdge`、`insertNode`、`updateNode`/`updateEdge` 等（移除 MetaStore/业务耦合的分支）。

## 主要能力清单（按模块）

- **layoutOps**：节点对齐（alignNodes）、水平/垂直均分（layoutNodes）、packNodes（自适应排布后重置选框）。
- **nodeOps**（体量最大，保留通用部分）：
  - Z 轴处理：getMaxZindex、updateAfterZ。
  - 关联边刷新：updateRelatedEdges（批量调度 drawPath）。
  - 删除逻辑：deleteNode(s) 包含 mindmap 子节点展开删除、事件 emit（剔除 MetaStore 清理）。
  - DOM/尺寸：getNodeDOM、getDOMBoxOfNodes、fitContent（组/节点尺寸复位）。
  - Mindmap：expand/fold、expandMindmap（在 mindmapOps）、canExpand/open（新标签/侧边/浮窗）。
  - 复制粘贴：copy（带 mindmap 克隆）、paste（分发给文本/图片/nodes/objects）。
  - 集合操作：extendNodes（包含 group 内节点）、intersectWith（命中框）、updateRelatedEdges。
- **coordOps**：窗口/白板坐标互转（rect/point 双向），依赖 `getContainerNode` 与 `getTransform`。
- **containerOps**：
  - fitToNode/fitTo（含 padding/scale 计算，可跳过缩放）。
  - getViewBox/getInViewNodes。
  - setTransform/moveBy（委托 panzoom）。
  - fitToSelected 占位。
- **groupOps**：获取/导出 group、查询包含关系、groupNodes（自动生成包围组）、导出分组图片。
- **mindmapOps**：updateMindmapEdges（调用节点渲染）、expandMindmap（遍历左右孩子）。
- **contentOps**：将白板内容转换为 outline（按组/节点类型分组，支持 mindmap/metaObject/text）。
- **history**：新 core 有简化版；旧版 hooks 未显式暴露，但需要确保 undo/redo 栈与 onChange/patches 联动。

## 当前 core 状态

- 已迁移：layoutOps 对齐/均分/pack，containerOps fitTo/视口查询，coordOps 坐标互转，nodeOps 的 Z 轴、关联边、删除/fitContent/extendNodes/intersectWith，groupOps（包含关系、快速建组），mindmapOps（子节点展开）、contentOps（outline 转换），historyOps、selection/edge 等基础能力。
- 已剔除：所有 MetaStore/Global 业务逻辑与对象联动。
- 待补全/占位：
  - `nodeOps.open`、`nodeOps.getNodeFuncs` 仍为空（需要决定 UI/渲染层接口）。
  - `mindmapOps.updateMindmapEdges` 为空（若需要重绘 mindmap 边，需挂钩渲染层）。
  - clipboard 相关 copy/paste 分发（文本/图片/节点/对象）未迁移。
  - 旧版 `moveToMetaNode`、Meta 链接相关清理不再实现（业务耦合）。
  - 若需要节点 DOM 尺寸读取或实时框（旧版 getDOMBoxOfNodes/getNodeDOM），需与现有渲染实现对齐。

## 迁移建议

1) **对齐实例 API**：在 core 的 `createWhiteboardStore` 中补齐旧版实例方法签名（如 moveToMetaNode/getNode/deleteEdge 等），避免调用方分叉。
2) **收尾迁移（待定）**：
   - nodeOps：明确 UI 侧 `open`/`getNodeFuncs` 需求；如不需要，移除接口或标记废弃。若需要实时 DOM 尺寸，可在渲染层暴露接口。
   - mindmapOps：视需求补充 `updateMindmapEdges`（调用渲染层重绘）。
   - clipboard：决定是否支持节点/文本/图片粘贴，若要支持需移植旧版 paste 分发并提供 adapter。
3) **历史栈一致性**：确保 `updateWhiteboard(..., withUndo=true)` 会 push patches，`history` 状态同步（当前 historyOps 已接入）。
4) **事件兼容**：保留 `instance.emit` 行为（如 nodeDeleted），并在新增 ops 时保持一致。
5) **类型对齐**：当前类型已扩展 mindmap/group/outline；后续若补充新接口，同步类型声明。

## 建议的落地顺序

1. 定义 target API：在 core 实例接口声明中补齐需要支持的 ops/方法（哪怕先占位）。
2. 先迁移无外部依赖的模块：layoutOps、coordOps 扩展、containerOps 完整版、nodeOps 的 Z 轴/选区/fitContent 部分。
3. 再迁移依赖外部数据的模块：groupOps/mindmapOps/contentOps，设计适配层替换 `Global`/`MetaStore`。
4. 补充/校正 history 触发点与事件触发点，验证 undo/redo。
5. 编写回归用例或手测清单：对齐老版关键行为（对齐/均分、group 包含、mindmap 展开、复制粘贴、fitToNode/fitToSelected 等）。
