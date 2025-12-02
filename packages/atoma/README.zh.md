# Atoma

> **原子化状态，一处书写，处处持久化**

**Atoma** 是基于 Jotai 的 React 状态管理库，提供原子化更新、批处理、补丁同步以及多种持久化适配器（IndexedDB/HTTP/Hybrid）。默认提供 Snowflake 风格的 ID 生成器，也支持按需自定义。

## ✨ 特性
- 原子化状态：Jotai 精细粒度订阅
- 批处理优化：同帧多次更新合并为一次存储写入
- 适配器抽象：IndexedDB、HTTP、Hybrid（本地+远端）
- 离线与同步：HTTP 适配器可队列写入，联网后重放
- 冲突策略：支持 Last-Write-Wins、Server-wins（可扩展）
- 补丁协议：Immer patches，减少传输和写入成本
- 模型/Schema：可选 zod/yup 校验，支持 beforeSave/afterSave 生命周期钩子
- Hooks：`useValue` 精准订阅、`useAll` 集合订阅
- 默认 Snowflake ID，可全局或单实例自定义
- 查询（初版）: 提供 `findMany`/`useFindMany` 反应式查询（过滤/排序/分页），兼容 HTTP/IndexedDB/Hybrid，详见根目录 `ATOMA_QUERY_SELECTOR_DESIGN.zh.md`

## 🚀 快速开始
```ts
import { createStore, setDefaultIdGenerator } from 'atoma'
import { IndexedDB } from 'atoma/adapters'
import Dexie from 'dexie'

// 可选：全局自定义 ID 生成器
// setDefaultIdGenerator(() => myCustomId())

const db = new Dexie('myapp')
db.version(1).stores({ todos: 'id, title, completed' })

const TodoStore = createStore({
  adapter: new IndexedDB(db.todos),
  // 或单个 Store 自定义 ID：
  // idGenerator: () => myCustomId()
})

function TodoList() {
  const todos = TodoStore.useAll()
  const addTodo = async () => {
    await TodoStore.addOne({ title: 'New todo', completed: false })
  }
  return (
    <div>
      {todos.map(todo => <div key={todo.id}>{todo.title}</div>)}
      <button onClick={addTodo}>Add</button>
    </div>
  )
}
```

## 🧬 模型/Schema 与生命周期钩子
为 `addOne/updateOne` 增加“ORM 风格”的校验与钩子，尽早拦截数据漂移，并可在持久化前后做自定义处理。

```ts
import { z } from 'zod'
import { createStore } from 'atoma'
import { HTTPAdapter } from 'atoma/adapters'

const TodoSchema = z.object({
  id: z.number().optional(), // 自动填充
  title: z.string().min(1),
  completed: z.boolean().default(false),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional()
})

const TodoStore = createStore({
  adapter: new HTTPAdapter({ /* ...端点配置... */ }),
  schema: TodoSchema, // 支持 zod/yup/custom { parse/validate } 或函数 (item) => item
  hooks: {
    beforeSave: ({ action, item }) => {
      if (action === 'add') {
        return { ...item, createdAt: Date.now(), updatedAt: Date.now() }
      }
      return { ...item, updatedAt: Date.now() }
    },
    afterSave: ({ action, item }) => {
      console.info(`[${action}] saved`, item.id)
    }
  }
})

// 校验失败会直接抛错并阻止写入
await TodoStore.addOne({ title: 'hello', completed: false })
```

## 🔌 适配器
- **IndexedDB**：本地持久化
- **HTTP**：REST 接口，支持 PATCH/PUT/POST/DELETE，409 冲突策略 LWW/Server-wins
- **Hybrid**：本地缓存 + 远端权威；可配置读写策略、删除同步与缓存过期

## 🏗 架构速览
- **状态内核（BaseStore）**：`Map<key, entity>` + Jotai；支持乐观/严格模式、队列合并、Immer patches、历史回调。维护全局/字段版本计数用于查询增量重算。
- **ID/Key**：`StoreKey = string | number`，默认雪花 ID，可自定义生成器（含 UUID）。
- **模型管线**：`schema` 校验（zod/yup/custom）+ `beforeSave/afterSave` 钩子，`addOne/updateOne` 类似 ORM 流水线。
- **适配器层**：IndexedDB（Dexie）、HTTP（重试/离线队列/冲突钩子/ETag）、Hybrid（本地+远端策略、缓存超时、删除同步）。
- **查询层**：`findMany` + `useFindMany` 反应式查询，where/order/limit；字段版本驱动重算。`indexes` 配置支持单字段等值/`in` 命中，优先用索引候选集。
- **索引与增量**：写入/删除/刷新更新索引并递增版本；`findMany` 先用索引缩小范围，再 `applyQuery` 过滤/排序，减少全表扫描。
- **细粒度订阅**：`useValue(id)` 精准订阅、`useAll()` 集合订阅、`useFindMany()` 查询订阅；`getCachedOneById/getCachedAll` 直接读缓存。
- **撤销/重做**：HistoryManager 持久化 patches，可与任意适配器协同。

## ⚙️ ID / Key 生成
- Key 支持 `string | number`（默认 Snowflake number）
- 默认：Snowflake 风格（41 位时间戳 + 12 位序号，Number 安全范围内）
- 全局覆盖：`setDefaultIdGenerator(() => yourId())`（可返回 string/number，比如 UUID）
- 单实例覆盖：`createStore({ adapter, idGenerator: () => yourId() })`

## 🛠 开发
```bash
npm install
npm run build
npm run typecheck
npm run dev
```

## 📄 许可证
MIT © Rendevoz Team
