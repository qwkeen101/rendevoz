import { Content, Icon, Image } from '@/components'
import { globalStore, ObjectStore } from '@/stores'
import { objectIdToMetaObjectIdMapAtom } from '@/stores/meta.store'
import Id from '@/utils/id'
import { CSSProperties, FC, useEffect, useMemo, useState } from 'react'
import { Descendant } from 'slate'
import { CustomEditor, IWebpageInstance, MetaObject } from '~/typings'
import WebpageEditor from '../editor/WebpageEditor'
import { WebpageCore, WebpageProps } from './WebpageCore'
import WebpageNavigation from './WebpageNavigation'
import TabTitle from '@/components/layout/TabTitle'
import { useGlobalAtomValue, useMemoizedFn, useToggle } from '@/hooks'
import { ReactEditor } from '../editor'
import { GlobalDragOverlayInstance } from '../global'
import { EditorTitleClassName } from '../editor/EditorTitle'
import ClassName from '@/styles/classNames'
import { createStore, Provider } from 'jotai'
import { GlobalTranslateInstance } from '../global/translate/GlobalTranslatePanel'
import { GlobalSearchInstance } from '../global/GlobalSearchPanel'
import { deepEquals } from '../editor/yjs/utils/object'
import { webpageUrlToIdAtom } from '@/stores/index.atoms'
import useWebpageInstance, { useAssignWebpageInstance, WebpageInstanceAtom } from './hooks/useWebpageInstance'
import useWebpageState from './hooks/useWebpageState'
import useWebpageNavigationEventHandler from './hooks/useWebpageNavigationEventHandler'
import { Regexp } from '@/utils'

type Props = {
  initialUrl?: string
  initialWebpageId?: number
  onTitleChange?: (title: string) => void
  onWebpageChange?: (newWebpageDetails: { webpageId: number }) => void
  onInstanceInitialized?: (instance: IWebpageInstance) => void
  navigationStyle?: CSSProperties
  webpageFrom?: MetaObject['fromObject']
  userAgent?: string
  navigationState?: {
    showReaderMode?: boolean
    showAddAsObject?: boolean
  }
} & Pick<WebpageProps, 'onEvent' | 'disableImageClick'>

const WebpageInner = ({
  initialWebpageId,
  onWebpageChange,
  onTitleChange,
  initialUrl: externalInitialUrl,
  navigationStyle,
  webpageFrom,
  userAgent,
  disableImageClick,
  onEvent,
  navigationState,
  onInstanceInitialized
}: Props) => {
  const [value, setValue] = useState<Descendant[]>()
  const [webpageState, setWebpageState] = useWebpageState()
  const [editor, setEditor] = useState<CustomEditor>()
  const instance = useWebpageInstance()
  useAssignWebpageInstance()
  const { handleNavigationEvent } = useWebpageNavigationEventHandler()
  useEffect(() => {
    onInstanceInitialized?.(instance)
  }, [])

  useEffect(() => {
    if (initialWebpageId) {
      ObjectStore('webpage')
        .getOneById(initialWebpageId)
        .then(webpage => {
          setWebpageState(s => ({
            ...s,
            initialUrl: webpage?.url,
            currentWebpage: webpage,
            navigationUrl: webpage?.url,
            showReaderMode: !!webpage?.readerMode
          }))
        })
    } else if (externalInitialUrl) {
      setWebpageState(s => ({
        ...s,
        initialUrl: externalInitialUrl,
        navigationUrl: externalInitialUrl,
        currentWebpage: {
          id: Id.getId(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          specType: 'webpage',
          title: webpageState.title || 'Unnamed Webpage'
        },
        showReaderMode: false
      }))
    }
  }, [])

  const { showReaderMode, loaded, navigationUrl, editorId, currentWebpage, initialUrl, title, faviconUrl } = webpageState

  useEffect(() => {
    // delete temp note when url change
    if (currentWebpage?.tempNoteId) {
      ObjectStore('note').deleteOneById(currentWebpage.tempNoteId, {
        silent: true,
        force: true
      })
    }
    const action = async () => {
      if (navigationUrl !== initialUrl && navigationUrl && navigationUrl.length) {
        const navigationUrlUrl = new URL(navigationUrl)
        const initialUrlUrl = new URL(initialUrl || '')
        if (
          navigationUrlUrl.pathname === initialUrlUrl.pathname &&
          deepEquals(Object.fromEntries(navigationUrlUrl.searchParams.entries()), Object.fromEntries(initialUrlUrl.searchParams.entries()))
        ) {
          return
        }
        await ObjectStore('webpage').getAll()
        const maybeExistWebpage = globalStore.get(webpageUrlToIdAtom).get(navigationUrl)
        setWebpageState(s => ({
          ...s,
          showReaderMode: false,
          currentWebpage: maybeExistWebpage || {
            id: Id.getId(),
            specType: 'webpage',
            title: webpageState.title || '',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            url: navigationUrl
          }
        }))
      } else if (navigationUrl === initialUrl && initialWebpageId) {
        ObjectStore('webpage')
          .getOneById(initialWebpageId)
          .then(obj => {
            setWebpageState(s => ({ ...s, currentWebpage: obj }))
          })
      }
    }
    action()
  }, [navigationUrl])

  useEffect(() => {
    setWebpageState(s => ({ ...s, webpageFrom }))
  }, [webpageFrom])
  useEffect(() => {
    if (title) {
      if (currentWebpage?.id) {
        ObjectStore('webpage').updateOne({ id: currentWebpage?.id, title })
      }
      onTitleChange?.(title)
    }
  }, [title])

  useEffect(() => {
    if (currentWebpage) {
      if (currentWebpage.noteId) {
        const currentWebpageMeta = objectToIdMeta?.get(currentWebpage.id)
        if (currentWebpageMeta) {
          ObjectStore('note')
            .getOneById(currentWebpage.noteId)
            .then(note => {
              if (note && note?.metaId !== currentWebpageMeta) {
                ObjectStore('note').updateOne({
                  id: currentWebpage.noteId!,
                  metaId: currentWebpageMeta
                })
              }
            })
        }
      }
      onWebpageChange?.({
        webpageId: currentWebpage.id,
        ...currentWebpage
      })
    }
  }, [currentWebpage])

  useEffect(() => {
    if (currentWebpage?.id) {
      ObjectStore('webpage')
        .getOneById(currentWebpage.id)
        .then(webpage => {
          if (webpage) {
            ObjectStore('webpage').updateOne(
              {
                id: webpage.id,
                readerMode: showReaderMode
              },
              {
                silent: true
              }
            )
          }
        })
    }
  }, [showReaderMode])
  const realLoaded = loaded || !initialUrl || initialUrl.length === 0
  const contentClickHandler: React.MouseEventHandler = useMemoizedFn(e => {
    const targetLink = (e.target as HTMLElement).closest('a')
    if (!targetLink || !currentWebpage?.url) return
    e.preventDefault()

    const url = new URL(targetLink.href)
    const originUrl = new URL(currentWebpage?.url)

    if (url.hostname === 'localhost') {
      const newHref = url.href.replace(`${url.origin}/`, '')
      const replacedUrl = new URL(newHref.startsWith('#') ? newHref : `/${newHref}`, originUrl)
      window.open(replacedUrl, '_blank')
    } else {
      window.open(url, '_blank')
    }
  })
  const url = Regexp.isValidWebUrl(currentWebpage?.url || '')
    ? new URL(currentWebpage?.url)
    : Regexp.isValidWebUrl(navigationUrl)
    ? new URL(navigationUrl)
    : undefined
  const objectToIdMeta = useGlobalAtomValue(objectIdToMetaObjectIdMapAtom)

  return (
    <Content flex column fullHeight fullWidth>
      <TabTitle
        title={title || 'Webpage'}
        icon={
          !realLoaded ? (
            <Icon size={16} name="park-loading-four" spin />
          ) : faviconUrl ? (
            <Image src={faviconUrl} width={16} />
          ) : (
            'park-web-page'
          )
        }
      />
      <WebpageNavigation
        style={navigationStyle}
        on={e => handleNavigationEvent(e)}
        navigationState={{
          loaded,
          displayUrl: navigationUrl,
          canSave: !!(currentWebpage?.id && !objectToIdMeta?.has(currentWebpage.id)) && navigationState?.showAddAsObject !== false,
          readerMode: showReaderMode && navigationState?.showReaderMode !== false
        }}
      />
      <div style={{ height: 0, flex: 1, width: '100%' }}>
        <WebpageCore url={webpageState.initialUrl} userAgent={userAgent} onEvent={onEvent} disableImageClick={disableImageClick}>
          {(currentWebpage?.noteId || currentWebpage?.tempNoteId) && (
            <>
              <WebpageEditor
                id={editorId}
                stringTitle={title}
                noteId={currentWebpage.noteId || currentWebpage.tempNoteId}
                on={event => {
                  switch (event.type) {
                    case 'linkClick': {
                      event.e.preventDefault()
                      contentClickHandler?.(event.e)
                      break
                    }
                    case 'valueChange': {
                      setValue(event.value)
                      break
                    }
                    case 'highlightDrag': {
                      const editorNode = ReactEditor.toDOMNode(event.editor, event.editor)
                      const highlightTextContent = Array.from(
                        editorNode.querySelectorAll(`[data-highlight="${event.highlightId}"]`)
                      ).reduce((prev, curr) => {
                        return prev + curr.textContent
                      }, '')
                      GlobalDragOverlayInstance.draggingDetails = {
                        type: 'webpageLabel',
                        highlightId: event.highlightId,
                        noteId: currentWebpage.noteId,
                        textContent: highlightTextContent,
                        webpageId: currentWebpage.id
                      }
                      break
                    }
                    case 'translate': {
                      GlobalTranslateInstance.open?.({
                        e: event.e,
                        query: event.translatedText,
                        source: {
                          type: 'webpage',
                          objectId: currentWebpage.id,
                          blockId: event.blockId
                        }
                      })
                      break
                    }
                    case 'search': {
                      GlobalSearchInstance.open?.({
                        e: event.e,
                        query: event.searchedText,
                        from: {
                          type: 'webpage',
                          blockId: event.blockId,
                          selectedText: event.searchedText,
                          metaId: globalStore.get(objectIdToMetaObjectIdMapAtom)?.get(currentWebpage.id)
                        }
                      })
                      break
                    }
                    case 'highlight': {
                      const { labelId } = event
                      setTimeout(() => {
                        ObjectStore('webpageLabel').updateOne({
                          id: labelId,
                          webpageId: currentWebpage.id,
                          specType: 'webpageLabel'
                        })
                      }, 10)
                      break
                    }
                    case 'highlightRemove': {
                      ObjectStore('webpageLabel').deleteOneById(event.highlightId, { force: true, silent: true })
                    }
                  }
                }}
                onInstanceInitialized={i => {
                  instance.editor = i
                  console.log(instance.editor)
                  setEditor(i.getSlateEditor?.())
                }}
                showToolbar={currentWebpage.tempNoteId || currentWebpage.noteId ? (currentWebpage.noteId ? true : false) : false}
                title={
                  <Content
                    flex
                    column
                    ref={node => editor && (editor.titleEle = node)}
                    style={{
                      maxWidth: 'calc(100% - 40px)',
                      width: 790,
                      padding: '20px 0px',
                      margin: 'auto'
                    }}
                  >
                    {(faviconUrl || url) && (
                      <Content flex alignItems="center" className={ClassName.description()} gap={10} style={{ marginBottom: 12 }}>
                        {faviconUrl && <Image src={faviconUrl} width={16} />}
                        {url && (
                          <div className={ClassName.description('12px')} style={{ textTransform: 'uppercase' }}>
                            {url.host}
                          </div>
                        )}
                      </Content>
                    )}
                    <div className={EditorTitleClassName} style={{ padding: 0 }}>
                      {title}
                    </div>
                    <hr style={{ marginTop: 18 }} />
                  </Content>
                }
              />
            </>
          )}
        </WebpageCore>
      </div>
    </Content>
  )
}
const Webpage: FC<Props> = props => {
  const store = useMemo(() => {
    const store = createStore()
    store.set(WebpageInstanceAtom, {})
    return store
  }, [])
  return (
    <Provider store={store}>
      <WebpageInner {...props}></WebpageInner>
    </Provider>
  )
}
export default Webpage
