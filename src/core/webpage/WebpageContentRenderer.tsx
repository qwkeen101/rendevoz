import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Id from '@/utils/id'
import useWebpageState, { IWebpageState } from '@/core/webpage/hooks/useWebpageState'
import NoteEditor from '@/core/editor/noteEditor/NoteEditor'
import { Editor } from '@/core'
import { Content } from '@/components'
import { Colors } from '@/consts'
import { Descendant } from 'slate'
import { EditorProps, IEditorEvent, IEditorInstance } from '~/typings'
import { useUpdateEffect } from '@/hooks'
import KeyvalueStore from '@/stores/keyvalue.store'
import { DefaultEditorSettings } from '@/lifycycle/startup/initializeSettings'
import { MetaStore, ObjectStore } from '@/stores'
import { fetchRemoteImageAndSaveLocally } from '@/utils'
import addWebpageAsMeta from '@/core/webpage/utils/addWebpageAsMeta'
import { Rendevoz } from '@/core/rendevoz'
import useWebpageInstance from '@/core/webpage/hooks/useWebpageInstance'
import { IWebpageProps } from '@/core/webpage/Webpage'

const WebpageTitle = ({
  title = 'Untitled',
  author,
  domain = 'UNKNOWN',
  favicon,
  url
}: {
  title?: string
  author?: string
  domain?: string
  favicon?: string
  url?: string
}) => {
  return (
    <Content flex column>
      <div
        style={{
          fontSize: 28,
          fontWeight: 600,
          hyphens: 'auto'
        }}
      >
        {title}
      </div>
      <Content
        flex
        gap={10}
        alignItems={'center'}
        style={{ color: Colors.Font.Transparent, fontSize: 12, lineHeight: 1, textTransform: 'uppercase', marginTop: 12 }}
      >
        {favicon && <img src={favicon} height={14} />}
        <div
          onClick={() => url && window.open(url)}
          style={{
            cursor: 'pointer'
          }}
        >
          {domain}
        </div>
        {author && (
          <>
            <div style={{ fontSize: 18, lineHeight: 0 }}>•</div>
            <div>{author}</div>
          </>
        )}
      </Content>
    </Content>
  )
}

const WebpageContentRenderer = ({
  editorOptions,
  onInstanceInitialized
}: {
  editorOptions?: EditorProps
  onInstanceInitialized: IWebpageProps['onInstanceInitialized']
}) => {
  const editorId = useMemo(() => Id.getStrId(), [])
  const [webpageState, setWebpageState] = useWebpageState()
  const [isReadOnly, setIsReadOnly] = useState(true)
  const editorSetting = KeyvalueStore.useValue('editorSettings') || DefaultEditorSettings
  const editorInstanceRef = useRef<IEditorInstance>()
  const hasWebpageMeta = !!MetaStore.useObjectToMetaValue(webpageState.currentWebpageId || 0)
  const currentWepbage = ObjectStore('webpage').useValue(webpageState.currentWebpageId)
  const webpageInstance = useWebpageInstance()
  const webpageMeta = MetaStore.useObjectToMetaValue(webpageState.currentWebpageId)
  const webpageEditorOnHandler = async (e: IEditorEvent) => {
    editorOptions?.on?.(e)
    if (e.type === 'stateChange') {
      const event = e.event
      switch (event.type) {
        case 'fontSize': {
          if (isReadOnly) {
            KeyvalueStore.updateOne('editorSettings', {
              ...editorSetting,
              readerMode: {
                ...editorSetting.readerMode,
                fontSize: event.fontSize
              }
            })
          } else {
            KeyvalueStore.updateOne('editorSettings', {
              ...editorSetting,
              editMode: {
                ...editorSetting.editMode,
                fontSize: event.fontSize
              }
            })
          }
          break
        }
        case 'lineSpacing': {
          if (isReadOnly) {
            KeyvalueStore.updateOne('editorSettings', {
              ...editorSetting,
              readerMode: {
                ...editorSetting.readerMode,
                lineSpacing: event.lineSpacing
              }
            })
          } else {
            KeyvalueStore.updateOne('editorSettings', {
              ...editorSetting,
              editMode: {
                ...editorSetting.editMode,
                lineSpacing: event.lineSpacing
              }
            })
          }
          break
        }
        case 'pageWidth': {
          if (isReadOnly) {
            KeyvalueStore.updateOne('editorSettings', {
              ...editorSetting,
              readerMode: {
                ...editorSetting.readerMode,
                pageWidth: event.width
              }
            })
          } else {
            KeyvalueStore.updateOne('editorSettings', {
              ...editorSetting,
              editMode: {
                ...editorSetting.editMode,
                pageWidth: event.width
              }
            })
          }
          break
        }
        case 'typeface': {
          if (isReadOnly) {
            KeyvalueStore.updateOne('editorSettings', {
              ...editorSetting,
              readerMode: {
                ...editorSetting.readerMode,
                typeface: event.typeface
              }
            })
          } else {
            KeyvalueStore.updateOne('editorSettings', {
              ...editorSetting,
              editMode: {
                ...editorSetting.editMode,
                typeface: event.typeface
              }
            })
          }
          break
        }
      }
    }
    switch (e.type) {
      case 'addLabel': {
        let webpage = currentWepbage
        if (!hasWebpageMeta) {
          const stateWebpage = webpageState.currentWebpage || webpageState.externalState
          if (!stateWebpage) return
          webpage = (await addWebpageAsMeta({ ...stateWebpage, url: webpageState.currentUrl }, e.afterAddValue)).one
        }
        if (!webpage) {
          return
        }
        const label = await ObjectStore('webpageLabel').addOne({ ...e.currentLabel, specType: 'webpageLabel', parentObjectId: webpage.id })
        await ObjectStore('webpage').updateOne({ id: webpage.id, labels: [...(webpage.labels || []), label.id] })
        return label
      }
      case 'deleteLabel': {
        const webpage = currentWepbage
        if (!webpage?.labels) return
        return await ObjectStore('webpage').updateOne({ id: webpage.id, labels: webpage?.labels?.filter(i => i !== e.labelId) })
      }
      case 'labelDrag': {
        Rendevoz.Actions.State.Drag.setDraggingDetails({
          type: 'webpageLabel',
          labelId: e.labelId
        })
        return true
      }
      case 'titleChange': {
        if (currentWepbage) {
          ObjectStore('webpage').updateOne({ id: currentWepbage.id, title: e.value })
        }
        if (webpageMeta) {
          MetaStore.updateMetaObject({ id: webpageMeta.id, name: e.value }, true)
        }
      }
    }
  }

  useEffect(() => {
    console.log(editorInstanceRef.current)
    editorInstanceRef.current?.scrollToPosition?.(0)
  }, [webpageState.currentUrl])

  console.log(webpageState.externalState, webpageState.currentParsedContent, webpageState)
  if (!webpageState.currentWebpageNoteId && !webpageState.currentParsedContent && !webpageState.externalState?.content) return null
  const renderer = () => {
    return (
      <NoteEditor
        {...editorOptions}
        labelType={'webpageLabel'}
        onInstanceInitialized={i => {
          console.log(i)
          editorInstanceRef.current = i
          webpageInstance.editorInstance = i
          onInstanceInitialized?.(webpageInstance)
        }}
        defaultValue={webpageState.externalState?.content || webpageState.currentParsedContent}
        id={editorId}
        noteId={webpageState.currentWebpageNoteId}
        state={{
          lineSpacing: isReadOnly ? editorSetting.readerMode.lineSpacing : editorSetting.editMode.lineSpacing,
          pageWidth: isReadOnly ? editorSetting.readerMode.pageWidth : editorSetting.editMode.pageWidth,
          fontSize: isReadOnly ? editorSetting.readerMode.fontSize : editorSetting.editMode.fontSize,
          typeface: isReadOnly ? editorSetting.readerMode.typeface : editorSetting.editMode.typeface
        }}
        labelIds={currentWepbage?.labels || []}
        on={webpageEditorOnHandler}
        stringTitle={webpageState.currentWebpage?.title || webpageState.externalState?.title || 'Untitled'}
        readOnly={isReadOnly}
        onReadOnlyChange={v => setIsReadOnly(v)}
        title={{
          customTitleRenderer: () => (
            <WebpageTitle
              url={webpageState.currentUrl}
              {...webpageState.externalState}
              {...webpageState.currentWebpage}
              title={webpageMeta?.name || webpageState.currentWebpage?.title || webpageState.externalState?.title}
            />
          ),
          titleContainerStyle: {
            padding: '20px 0px'
          }
        }}
      />
    )
  }
  return (
    <Content fullHeight fullWidth style={{ overflow: 'hidden' }}>
      {renderer()}
    </Content>
  )
}

export default WebpageContentRenderer
