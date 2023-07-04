import { BuiltInDraggableElement, BuiltInDropOn, BuiltInMetaObjectTypes, PluginApi } from 'rendevoz'
import { useEffect, useRef } from 'react'
import { BuiltInObjectTypes } from 'rendevoz/typings/store'
import * as Rendevoz from 'rendevoz'

declare module 'rendevoz' {
  export interface CustomTypes {
    MetaObject: BuiltInMetaObjectTypes | 'customEle'
    Object: BuiltInObjectTypes & {
      task: {
        specType: 'task'
      }
    }
    DropOn: BuiltInDropOn
    DraggableElement: BuiltInDraggableElement
  }
}

export default (plugin: PluginApi) => {
  console.log('yes')
  plugin.register.registerGlobalElement('learn-bar', () => (
    <Rendevoz.Components.Modal visible>
      <div>123213</div>
    </Rendevoz.Components.Modal>
  ))
}

const Cus = () => {
  useEffect(() => {
    console.log('yes')
  }, [])
  return <div></div>
}

const CustomPanel = ({ api }: { api: IRendevozPluginApi }) => {
  const store = api.api.getObjectStore('task')
  const allTasks = store.useAll()
  const globalEmitter = api.Rendevoz.Events.Emit.GlobalEventEmitter
  const handler = api.Rendevoz.Events.Emit.useEventHandler('global')
  handler.on('globalDragPointerUp', async data => {
    if (data.event.target instanceof HTMLElement && containerRef.current?.contains(data.event.target)) {
      if (data.event.target.hasAttribute('data-task-id') && data.draggingElement.type === 'metaElement') {
        const dragMeta = await api.api.getMetaStore().getMetaObjectById(data.draggingElement.metaId)
        const taskId = Number(data.event.target.getAttribute('data-task-id'))
        store.updateOne({ id: taskId, name: dragMeta?.name })
        globalEmitter.emit('global', {
          type: 'globalDropNeedFurtherProcess',
          data: {
            dropOn: {
              dropOn: 'custom'
            },
            draggingElement: api.Rendevoz.Actions.State.Drag.getDraggingDetails()
          }
        })
      }
    }
  })
  useEffect(() => {
    globalEmitter.addListener('global', handler)
    store.getAll()
    return () => {
      globalEmitter.removeListener('global', handler)
    }
  }, [])

  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <api.unstable.Components.Content flex fullHeight fullWidth style={{ padding: 30 }} column ref={containerRef}>
      <h1>Task Manager</h1>
      <api.unstable.TabTitle title="Task Manager" />
      <div onClick={() => store.addOne({ name: 'new task' })}>add one task</div>
      <div onClick={() => api.Rendevoz.Actions.Open.Translate.openTranslate({ query: 'hello you', to: 'zh-CN' })}>11111111111</div>
      {Array.from(allTasks.values()).map(i => (
        <api.unstable.Components.DraggableElement draggingDetails={{ type: 'task', id: i.id, name: i.name }}>
          <div data-task-id={i.id} onClick={() => store.updateOne({ id: i.id, name: String(Math.random()) })}>
            task: {i.name}
          </div>
        </api.unstable.Components.DraggableElement>
      ))}
      {api.unstable.Consts.KEY.ArrowDown}
      {api.unstable.Consts.Colors.Font.Primary}
    </api.unstable.Components.Content>
  )
}
