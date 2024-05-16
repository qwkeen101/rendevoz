import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Id from '@/utils/id'
import useWebpageState from '@/core/components/webpage/hooks/useWebpageState'
import NoteEditor from '@/core/components/editor/noteEditor/NoteEditor'
import { Content, Tooltip, Icon } from '@/components'
import { Colors } from '@/consts'
import { CustomEditor, EditorProps, IEditorEvent, IEditorInstance } from '~/typings'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { DefaultEditorSettings } from '@/api/lifycycle/initializeApp/initializeSettings'
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
          fontSize: 24,
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
          className={'ellipsis-font-1'}
        >
          {domain || url}
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
  onInstanceInitialized,
  initialHeight
}: {
  editorOptions?: EditorProps
  initialHeight?: number
  onInstanceInitialized: IWebpageProps['onInstanceInitialized']
}) => {
  const editorId = useMemo(() => Id.getStrId(), [])
  const [webpageState] = useWebpageState()
  const [isReadOnly, setIsReadOnly] = useState(true)
  const editorInstanceRef = useRef<IEditorInstance>()
  const currentWepbage = ObjectStore('webpage').useValue(webpageState.currentWebpageId)
  const webpageInstance = useWebpageInstance()
  const webpageMeta = MetaStore.useObjectToMetaValue(webpageState.currentWebpageId)
  const [showOriginal, setShowOriginal] = useState(false)
  const realShowOriginal = currentWepbage?.showOriginal ?? showOriginal
  const isLoading = webpageState.isLoading
  const failLoading = webpageState.failLoading

  const getWebpageMeta = async (editor: CustomEditor) => {
    let m = webpageMeta
    let id = webpageState.currentWebpageId
    if (!m) {
      const state = webpageState.externalState || webpageState.currentWebpage
      console.log(webpageState)
      if (!state) {
        throw ''
      }
      const result = await addWebpageAsMeta({ ...state, url: webpageState.currentUrl }, editor.children)
      m = result.meta
      id = result.one.id
      return {
        meta: m,
        id
      }
    }
    return {
      meta: m,
      id
    }
  }
  const webpageEditorOnHandler = async (e: IEditorEvent & { editor: CustomEditor }) => {
    editorOptions?.on?.(e)
    switch (e.type) {
      case 'AI summarize': {
        const { meta, id } = await getWebpageMeta(e.editor)
        if (id) {
          const questions = await Promise.all(
            e.questions?.map(async i => await ObjectStore('question').addOne({ ...i, parentObjectId: id })) || []
          )
          AIStore.updateMetaAI(meta.id, {
            summary: e.summary,
            questions: questions
          })
        }
        return true
      }
      case 'copyLink': {
        const { meta } = await getWebpageMeta(e.editor)
        if (meta) {
          const links = e.blocks.map(i => `rendevoz://object/${meta.id}?blockId=${i.id}`).join('\n')
          const html = e.blocks.map(i => `<p><a href="rendevoz://object/${meta.id}?blockid=${i.id}">${i.text}</a></p>`).join('')
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
        const { id } = await getWebpageMeta(e.editor)
        const label = await ObjectStore('webpageLabel').addOne({ ...e.currentLabel, specType: 'webpageLabel', parentObjectId: id })
        const webpage = await ObjectStore('webpage').getOneById(id)
        if (!webpage) return
        await ObjectStore('webpage').updateOne({ id: id, labels: [...(webpage.labels || []), label.id] })
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
    console.log(webpageState)
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
        <NoteEditor
          {...editorOptions}
          initialHeight={initialHeight}
          labelType={'webpageLabel'}
          styles={{
            ...editorOptions?.styles,
            containerStyle: {
              ...editorOptions?.styles?.containerStyle,
              opacity: isLoading || (failLoading && !webpageState.externalState?.content) ? 0 : 1
            }
          }}
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
          state={editorOptions?.state}
          header={{
            ...editorOptions?.header,
            rightExtra: (
              <>
                {editorOptions?.header?.rightExtra}
                <Tooltip content={t('general.Show original webpage')}>
                  <Icon
                    size={16}
                    strokeWidth={3}
                    className={ClassName.flatButton(4, '5px')}
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
              padding: '15px 0px 10px'
            }
          }}
        />
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
