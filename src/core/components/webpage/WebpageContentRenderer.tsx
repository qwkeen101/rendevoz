import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Id from '@/utils/id'
import useWebpageState from '@/core/components/webpage/hooks/useWebpageState'
import NoteEditor from '@/core/components/editor/noteEditor/NoteEditor'
import { Content, Tooltip, Icon } from '@/components'
import { Colors } from '@/consts'
import { CustomEditor, EditorProps, IEditorEvent, IEditorInstance } from '~/typings'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { DefaultEditorSettings } from '@/api/lifycycle/startup/initializeSettings'
import { AIStore, MetaStore, ObjectStore } from '@/api/stores'
import addWebpageAsMeta from '@/core/components/webpage/utils/addWebpageAsMeta'
import { Rendevoz } from '@/core/rendevoz'
import useWebpageInstance from '@/core/components/webpage/hooks/useWebpageInstance'
import { IWebpageProps } from '@/core/components/webpage/Webpage'
import { ClassName } from 'rendevoz'
import { GlobalSearchInstance } from '@/core/global/GlobalSearchPanel'
import { AI_QUESTION_PROP_ID, AI_SUMMARY_PROP_ID } from '@/api/stores/meta/meta.store'
import { useTranslation } from 'react-i18next'

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
          fontSize: 26,
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
            <div className={ClassName.ellipsisFont(1)}>{author}</div>
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
  const [showOriginal, setShowOriginal] = useState(false)
  const realShowOriginal = currentWepbage?.showOriginal ?? showOriginal
  const isLoading = webpageState.isLoading
  const failLoading = webpageState.failLoading

  const webpageEditorOnHandler = async (e: IEditorEvent & { editor: CustomEditor }) => {
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
      case 'AI summarize': {
        let m = webpageMeta
        let p = webpageState.currentWebpageId
        if (!m) {
          const stateWebpage = webpageState.currentWebpage || webpageState.externalState
          if (!stateWebpage) return true
          const result = await addWebpageAsMeta({ ...stateWebpage, url: webpageState.currentUrl }, e.editor.children)
          m = result.meta
          p = result.one.id
        }
        if (p) {
          const questions = await Promise.all(e.questions.map(async i => await ObjectStore('question').addOne({ ...i, parentObjectId: p })))
          AIStore.updateMetaAI(m.id, {
            summary: e.summary,
            questions: questions
          })
        }
        return true
      }
      case 'copyLink': {
        let m = webpageMeta
        if (!m) {
          const stateWebpage = webpageState.currentWebpage || webpageState.externalState
          if (!stateWebpage) return true
          const result = await addWebpageAsMeta({ ...stateWebpage, url: webpageState.currentUrl }, e.editor.children)
          m = result.meta
        }
        if (m) {
          const links = e.blocks.map(i => `rendevoz://object/${m.id}?blockId=${i.id}`).join('\n')
          const html = e.blocks.map(i => `<p><a href="rendevoz://object/${m.id}?blockid=${i.id}">${i.text}</a></p>`).join('')
          const content = [
            new ClipboardItem({
              'text/html': new Blob([html], { type: 'text/html' }),
              'text/plain': new Blob([links], { type: 'text/plain' })
            })
          ]
          navigator.clipboard.write(content)
        }
        return true
      }
      case 'linkAddAsValue': {
        ObjectStore('webpage').addOneWithMeta(
          { url: e.url },
          {
            currentMeta: {
              fromObject: webpageMeta
                ? {
                    type: 'webpage',
                    metaId: webpageMeta.id
                  }
                : undefined
            },
            showMetaModal: true
          }
        )
        return true
      }
      case 'search': {
        GlobalSearchInstance.open?.({
          query: e.searchedText,
          from: webpageMeta
            ? {
                type: 'webpage',
                metaId: webpageMeta.id
              }
            : undefined
        })
        return true
      }
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
          MetaStore.updateMetaObject({ id: webpageMeta.id, name: e.value })
        }
      }
    }
  }
  const { t } = useTranslation()
  useLayoutEffect(() => {
    if (webpageState.loaded) {
      editorInstanceRef.current?.scrollToPosition?.(0)
    }
  }, [webpageState.currentUrl, webpageState.loaded])

  if (
    !webpageState.currentWebpageNoteId &&
    !webpageState.currentParsedContent &&
    !webpageState.externalState?.content &&
    !webpageState.currentUrl
  )
    return null
  const renderer = () => {
    return (
      <>
        <div style={{ width: '100%', height: '100%', opacity: isLoading || (failLoading && !webpageState.externalState?.content) ? 0 : 1 }}>
          <NoteEditor
            {...editorOptions}
            labelType={'webpageLabel'}
            onInstanceInitialized={i => {
              editorInstanceRef.current = i
              webpageInstance.editorInstance = i
              onInstanceInitialized?.(webpageInstance)
            }}
            ai={{
              summary: webpageMeta?.properties?.[AI_SUMMARY_PROP_ID]?.value,
              questions: webpageMeta?.properties?.[AI_QUESTION_PROP_ID]?.value
            }}
            defaultValue={webpageState.externalState?.content || webpageState.currentParsedContent}
            id={editorId}
            noteId={webpageState.currentWebpageNoteId}
            layout={{
              showLastSave: false,
              showProps: !!webpageMeta,
              propsMetaId: webpageMeta?.id,
              ...editorOptions?.layout
            }}
            state={{
              lineSpacing:
                editorOptions?.state?.lineSpacing ||
                (isReadOnly ? editorSetting.readerMode.lineSpacing : editorSetting.editMode.lineSpacing),
              pageWidth:
                editorOptions?.state?.pageWidth || (isReadOnly ? editorSetting.readerMode.pageWidth : editorSetting.editMode.pageWidth),
              fontSize:
                editorOptions?.state?.fontSize || (isReadOnly ? editorSetting.readerMode.fontSize : editorSetting.editMode.fontSize),
              typeface: editorOptions?.state?.typeface || (isReadOnly ? editorSetting.readerMode.typeface : editorSetting.editMode.typeface)
            }}
            header={{
              ...editorOptions?.header,
              rightExtra: (
                <>
                  {editorOptions?.header?.rightExtra}
                  <Tooltip content={t('general.Show original webpage')}>
                    <Icon
                      className={ClassName.flatButton(4, '4px')}
                      onClick={() => {
                        if (currentWepbage) {
                          ObjectStore('webpage').updateOne({ id: currentWepbage.id, showOriginal: !realShowOriginal })
                        }
                        setShowOriginal(!realShowOriginal)
                      }}
                      name={'park-web-page'}
                    />
                  </Tooltip>
                </>
              )
            }}
            metaId={webpageMeta?.id}
            labelIds={currentWepbage?.labels || []}
            on={webpageEditorOnHandler}
            stringTitle={webpageMeta?.name || webpageState.externalState?.title || webpageState.currentWebpage?.title || 'Untitled'}
            readOnly={isReadOnly}
            onReadOnlyChange={v => setIsReadOnly(v)}
            title={{
              customTitleRenderer: () => (
                <WebpageTitle
                  url={webpageState.currentUrl}
                  {...webpageState.currentWebpage}
                  {...webpageState.externalState}
                  title={webpageMeta?.name || webpageState.externalState?.title || webpageState.currentWebpage?.title}
                />
              ),
              titleContainerStyle: {
                padding: '20px 0px'
              }
            }}
          />
        </div>
        {(isLoading || (failLoading && !webpageState.externalState?.content)) && (
          <Content
            style={{ margin: 'auto', zIndex: 100, position: 'absolute', inset: 0 }}
            flex
            column
            alignItems={'center'}
            justifyContent={'center'}
            gap={10}
            fullWidth
          >
            {failLoading ? (
              <>
                <Icon name={'park-error'} theme={'filled'} style={{ color: Colors.Common.Red }} size={48} />
                <Content flex column fullWidth alignItems={'center'} justifyContent={'center'} gap={4}>
                  <div style={{ color: Colors.Font.Transparent, fontSize: 13, maxWidth: '60%', wordBreak: 'break-word' }}>
                    Failed to load webpage
                  </div>
                  <div style={{ color: Colors.Font.Transparent, fontSize: 13, maxWidth: '80%', wordBreak: 'break-word' }}>
                    {webpageState.currentUrl}
                  </div>
                </Content>
              </>
            ) : (
              <>
                <Icon name={'park-loading-four'} spin size={48} style={{ color: Colors.Common.SelectColor }} />
                <Content flex column fullWidth alignItems={'center'} justifyContent={'center'} gap={4} style={{ marginTop: 18 }}>
                  <div
                    style={{
                      fontSize: 16,
                      maxWidth: '80%',
                      wordBreak: 'break-all',
                      fontWeight: 600,
                      marginBottom: 12,
                      textAlign: 'center'
                    }}
                  >
                    {webpageMeta?.name || webpageState.externalState?.title || webpageState.currentWebpage?.title}
                  </div>
                  <div
                    style={{
                      color: Colors.Font.Transparent,
                      fontSize: 13,
                      maxWidth: '80%',
                      wordBreak: 'break-all',
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={() => window.open(webpageState.currentUrl)}
                  >
                    {webpageState.currentUrl}
                  </div>
                </Content>
              </>
            )}
          </Content>
        )}
      </>
    )
  }
  return (
    <>
      {realShowOriginal && (
        <Icon
          name={'park-close'}
          containerStyle={{
            position: 'absolute',
            right: 20,
            cursor: 'pointer',
            top: 15,
            zIndex: 15,
            borderRadius: 999,
            color: 'white',
            padding: '6px',
            background: 'rgba(0,0,0,0.7)'
          }}
          onClick={() => {
            if (currentWepbage) {
              ObjectStore('webpage').updateOne({ id: currentWepbage.id, showOriginal: !realShowOriginal })
            }
            setShowOriginal(!realShowOriginal)
          }}
        />
      )}
      {realShowOriginal ? (
        <webview src={webpageState.currentUrl} style={{ width: '100%', height: '100%', background: 'white' }} />
      ) : (
        renderer()
      )}
    </>
  )
}

export default WebpageContentRenderer
