import {
  BuiltInDraggableElement,
  BuiltInDropOn,
  BuiltInMetaObjectTypes,
  BuiltInObjectTypes,
  BuiltInTabTypes,
  Components,
  PluginApi
} from 'rendevoz'
import { useEffect, useMemo, useState } from 'react'
import { RenderElementProps } from 'slate-react'

declare module 'rendevoz' {
  export interface CustomTypes {
    MetaObject: BuiltInMetaObjectTypes | 'customEle' | 'task'
    Object: BuiltInObjectTypes & {
      task: {
        specType: 'task'
      }
    }
    DropOn: BuiltInDropOn
    DraggableElement: BuiltInDraggableElement
    Tab:
      | BuiltInTabTypes
      | {
          type: 'taskManager'
          instance: never
          objectId: never
        }
  }
}

export default (plugin: PluginApi) => {
  plugin.register.registerInSidebarMenu('sad', {})
  plugin.Rendevoz.Actions.Open.openDatabase()
  plugin.register.registerEditorElement({
    type: 'custom',
    renderElement: props => <CustomEditorElement {...props} plugin={plugin} />,
    registerInMenu: {
      addMenu: true,
      slashMenu: true,
      menuType: 'block'
    },
    name: 'Custom Search Element',
    isVoid: true
  })
  plugin.describe({ name: 'task manager' })
  plugin.register.registerObject('task', {
    normalizeDraggingEleToMetaObject: async draggingDetails => {
      return {}
    }
  })

  plugin.register.registerMetaObject('task', {
    i18nKey: 'task',
    icon: 'park-notes',
    filterSettings: {
      objectType: 'file'
    },
    defaultName: 'hello i am new task',
    visibleInCreateMenu: true,
    visibleInHomepage: true,
    customEditForm: (obj, setobj) => [
      {
        type: 'nameInput',
        value: obj.name,
        onChange: v => setobj({ ...obj, name: v })
      }
    ],
    onCreate: (m, obj) => {
      console.log(m, obj)
    },
    onNavigate: m => {
      console.log(m)
      plugin.api.getMetaStore().updateMetaObject({ id: m.id, viewAt: Date.now() }, true)
      plugin.Rendevoz.Actions.Layout.openNewTab({ data: { type: 'taskManager' } })
    },
    onUpdate: (curr, before, changed) => {
      console.log(curr, before, changed)
    }
  })
  plugin.register.registerTab({
    type: 'taskManager',
    content: () => (
      <Components.Content>
        <plugin.Rendevoz.InnerComponents.TabTitle title={'Hello I Am Task Manager'} />
        1231313
      </Components.Content>
    )
  })
  // plugin.register.registerInSidebarMenu('Daily Note', {
  //   icon: 'park-notes',
  //   text: 'Create New Daily Note',
  //   onClick: () => {
  //     plugin.api
  //       .getObjectStore('note')
  //       .addOneWithMeta(
  //         { title: `Daily Note: ${DateFormat.format(Date.now(), DateFormat.Formats.default)}` },
  //         { currentMeta: { name: `Daily Note: ${DateFormat.format(Date.now(), DateFormat.Formats.default)}` } }
  //       )
  //       .then(({ one }) => {
  //         plugin.Rendevoz.Actions.Open.Editor.openEditor(one.id).then(editor => {
  //           const slateEditor = editor.getSlateEditor?.() as CustomEditor
  //           if (slateEditor) {
  //             slateEditor.children = []
  //             Transforms.insertNodes(slateEditor, [
  //               {
  //                 type: 'paragraph',
  //                 id: Id.getId(),
  //                 children: [{ text: 'This is your first daily note!' }]
  //               }
  //             ])
  //           }
  //         })
  //       })
  //   }
  // })
  plugin.register.registerInSettings({
    registerPanelName: 'plugins',
    settingItems: [
      {
        type: 'title',
        title: 'registeredNice'
      },
      {
        type: 'item',
        title: 'hello',
        children: <div>1232132132</div>
      }
    ]
  })
  plugin.register.registerObject('custom-ele', {
    normalizeDraggingEleToMetaObject: async d => {
      const metaStore = plugin.api.getMetaStore()
      metaStore.getMetaObjectById(1)
      return {
        normalizedMetaObject: {},
        shouldOpenEditMetaModal: true,
        alreadyHasMeta: true,
        preLinks: []
      }
    }
  })
  plugin.register.registerI18N('zh-CN', {
    general: {
      task: '任务'
    },
    settings: {
      plugins: '插件'
    }
  })
  plugin.register.registerEditorElement({
    type: 'weather',
    name: 'weather',
    renderElement: props => <WeatherPanelElement {...props} />
  })
}

const CustomEditorElement = (props: RenderElementProps & { plugin: PluginApi }) => {
  const { Rendevoz, api } = props.plugin
  api.getMetaStore()
  const instance = Rendevoz.InnerHooks.useEditorInstance()
  const objectStore = props.plugin.api.getObjectStore('note')
  objectStore.useAll()
  const [objState, setObjectState] = [objectStore.useValue(1), objectStore.updateOne]
  setObjectState({ ...objState, title: '121' })
  const metaStore = props.plugin.api.getMetaStore()
  const index = metaStore.useIndexedMetaObjects()
  if (index) {
    const { typeToMetaObjectIdsMap, tagToMetaObjectIdsMap, pinnedMetaObjectsSet, metaAttachmentIdToMetaIdsMap, objectIdToMetaObjectMap } =
      index
    console.log()
  }
  const allMeta = metaStore.useMetaObjectsMap()
  const scoped = Rendevoz.Events.Emit.GlobalEventEmitter

  const handler = Rendevoz.Events.Emit.useEventHandler('global')
  handler.on('globalDragPointerUp', ({ event, draggingElement }) => {


  })
  useEffect(() => {
    scoped.addListener('editor', handler)
    return () => {
      scoped.removeListener('editor', handler)
    }
  }, [])
  handler.on('operationApplied', data => {
    console.log(data)
  })
  Rendevoz.Actions.Notification.success({ message: 'Hello world!!!' })
  const allTasks = useMemo(() => {
    return Array.from(allMeta.values()).filter(i => i.type === 'task')
  }, [allMeta])
  return (
    <div
      style={{
        background: 'transparent',
        padding: '20px'
      }}
    >
      <h1
        contentEditable={false}
        onClick={() => {
          console.log('heelo')
          Rendevoz.Actions.Utils.uploadFile().then(file => {
            const a = document.createElement('a')
            const url = URL.createObjectURL(file[0])
            a.download = 'new item'
            a.href = url
            a.click()
            URL.revokeObjectURL(url)
          })
        }}
      >
        实体面板
      </h1>
      {allTasks.map(i => (
        <Renderer metaId={i.id} plugin={props.plugin} key={i.id} />
      ))}
      {props.children}
    </div>
  )
}

const WeatherPanelElement = (props: RenderElementProps) => {
  const [todayWeather, setTodayWeather] = useState()
  useEffect(() => {}, [])
  return (
    <div>
      <div>Today Weather Is: </div>
      {props.children}
    </div>
  )
}


