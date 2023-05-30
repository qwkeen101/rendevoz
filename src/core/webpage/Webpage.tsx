import { Content, Icon, Image, Tooltip } from '@/components'
import { MetaStore, NoteStore, ObjectStore, globalStore } from '@/stores'
import { objectIdToMetaObjectIdMapAtom } from '@/stores/meta.store'
import Id from '@/utils/id'
import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import { Descendant } from 'slate'
import { CustomEditor, IWebpage, MetaObject, WebpageInstance } from '~/typings'
import WebpageEditor from '../editor/WebpageEditor'
import { WebpageInnerRef, WebpageProps } from './WebpageCore'
import { WebpageCore } from './WebpageCore'
import WebpageNavigation from './WebpageNavigation'
import readibility from '@mozilla/readability'
import { deserializeHtmlNode, normalize } from '../editor/plugins/deserializeHtml'
import TabTitle from '@/components/layout/TabTitle'
import { useGlobalAtomValue, useMemoizedFn, useToggle } from '@/hooks'
import { ReactEditor } from '../editor'
import { DraggingElement, GlobalDragOverlayInstance } from '../global'
import { EditorTitleClassName } from '../editor/EditorTitle'
import ClassName from '@/styles/classNames'
import { Provider } from 'jotai'
import SidebarToolbar from '@/scenes/editor/HoverOutline'
import FontSize from '@/consts/font'
import { GlobalTranslateInstance } from '../global/translate/GlobalTranslatePanel'
import { captureWebpage, saveImageLocally } from '@/utils/img'
import { GlobalSearchInstance } from '../global/GlobalSearchPanel'
import { deepEquals } from '../editor/yjs/utils/object'
import { webpageUrlToIdAtom } from '@/stores/index.atoms'
import { IpcWebpageEvent } from './webpageIpcEvent'
import { Regexp } from '@/utils'
import { searchToUrl } from './utils'
const parseHTMLtoSlateDescandants = (
  html: string
):
  | {
      value: Descendant[]
    }
  | undefined => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const d = new readibility.Readability(doc).parse()
  if (d) {
    const parsedDoc = parser.parseFromString(d.content, 'text/html')
    const fragment = deserializeHtmlNode(parsedDoc.body)
    fragment.forEach(i => (i.id = Id.getId()))
    const normalized = normalize(fragment).filter(i => 'type' in i)
    return {
      value: normalized
    }
  }
}

const WebpagePage = ({
  initialWebpageId,
  onWebpageChange,
  onWebpageInitialized,
  onTitleChange,
  initialUrl: externalInitialUrl,
  navigationStyle,
  webpageFrom,
  userAgent,
  disableImageClick,
  onEvent,
  navigationState
}: {
  initialUrl?: string
  initialWebpageId?: number
  onTitleChange?: (title: string) => void
  onWebpageChange?: (newWebpageDetails: { webpageId: number }) => void
  onWebpageInitialized?: (instance: WebpageInstance) => void
  navigationStyle?: CSSProperties
  webpageFrom?: MetaObject['fromObject']
  userAgent?: string
  navigationState?: {
    showReaderMode?: boolean
    showAddAsObject?: boolean
  }
} & Pick<WebpageProps, 'onEvent' | 'disableImageClick'>) => {
  const initializedFunctionRef = useRef<(i: CustomEditor) => void>()
  const [value, setValue] = useState<Descendant[]>()
  const [webpageState, setWebpageState] = useState<{
    showReaderMode: boolean
    currentWebpage?: IWebpage & { tempNoteId?: number }
    loaded: boolean
    initialUrl?: string
    navigationUrl?: string
    editorId: string
    faviconUrl?: string
    title?: string
  }>({
    showReaderMode: false,
    loaded: false,
    editorId: Id.getStrId()
  })
  const [editor, setEditor] = useState<CustomEditor>()
  const webpageInstance = useMemo(() => {
    const i = {} as WebpageInstance
    setTimeout(() => onWebpageInitialized?.(i), 100)
    return i
  }, [])
  webpageInstance.editor = editor
  webpageInstance.transformToNote = () => {
    return new Promise(res => {
      initializedFunctionRef.current = i => {
        webpageInstance.editor = i
        res(i)
      }
      if (!currentWebpage?.noteId) {
        coreRef.current?.clip().then(({ html }) => handleClip(html))
      } else {
        setWebpageState(s => ({ ...s, showReaderMode: true }))
      }
      if (webpageInstance.editor) {
        res(webpageInstance.editor)
      }
    })
  }
  webpageInstance.changeUrl = url => {
    setWebpageState(s => ({ ...s, navigationUrl: url }))
    coreRef.current?.navigateTo(url)
  }

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

  const saveNote = (value: Descendant[]) => {
    const contentId = NoteStore.saveNoteAsBuffer(value)
    return ObjectStore('note').addOne({
      contentId
    })
  }
  const handleClip = (html: string) => {
    // current webpage is a saved meta
    if (currentWebpage?.id && objectToIdMeta?.has(currentWebpage?.id)) {
      if (currentWebpage.noteId) {
        setWebpageState(s => ({ ...s, showReaderMode: true }))
      } else {
        const result = parseHTMLtoSlateDescandants(html)
        if (result) {
          const { value } = result
          const contentId = NoteStore.saveNoteAsBuffer(value)
          ObjectStore('note')
            .addOne(
              {
                contentId,
                metaId: globalStore.get(objectIdToMetaObjectIdMapAtom)?.get(currentWebpage.id)
              },
              { silent: true }
            )
            .then(note => {
              ObjectStore('webpage')
                .updateOne({ id: currentWebpage.id, noteId: note.id })
                .then(obj => {
                  obj && setWebpageState(s => ({ ...s, showReaderMode: true, currentWebpage: obj }))
                })
            })
        }
      }
    }

    // current webpage is a temp webpage
    else {
      // parse document and save as a temp note, maybe delete after url change if not save as meta object
      const result = parseHTMLtoSlateDescandants(html)
      if (result) {
        const { value } = result

        saveNote(value).then(note => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          setWebpageState(s => ({ ...s, currentWebpage: { ...s.currentWebpage, tempNoteId: note.id }, showReaderMode: true }))
        })
      }
    }
  }

  const { showReaderMode, loaded, navigationUrl, editorId, currentWebpage, initialUrl, title, faviconUrl } = webpageState
  const coreRef = useRef<WebpageInnerRef>()
  webpageInstance.webview = coreRef.current
  useEffect(() => {
    // delete temp note when url change
    if (currentWebpage?.tempNoteId) {
      ObjectStore('note').deleteOneById(currentWebpage.tempNoteId, { silent: true, force: true })
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
    if (title) {
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
                ObjectStore('note').updateOne({ id: currentWebpage.noteId!, metaId: currentWebpageMeta })
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
  const url = currentWebpage?.url ? new URL(currentWebpage?.url) : navigationUrl ? new URL(navigationUrl) : undefined
  const [editorReaderMode, toggleEditorReaderMode] = useToggle(true)
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
        on={async event => {
          switch (event.action) {
            case 'zoom in': {
              coreRef.current?.zoomIn()
              break
            }
            case 'zoom out': {
              coreRef.current?.zoomOut()
              break
            }
            case 'stop':
              coreRef.current?.stop()
              break
            case 'refresh':
              coreRef.current?.refresh()
              break
            case 'back': {
              const newUrl = coreRef.current?.navigateBack()
              setWebpageState(s => ({ ...s, navigationUrl: newUrl }))
              break
            }
            case 'forward': {
              const newUrl = coreRef.current?.navigateForward()
              setWebpageState(s => ({ ...s, navigationUrl: newUrl }))
              break
            }
            case 'showReaderPage': {
              if (currentWebpage?.noteId || currentWebpage?.tempNoteId) {
                setWebpageState(s => ({ ...s, showReaderMode: true }))
              } else {
                coreRef.current?.clip().then(({ html }) => {
                  handleClip(html)
                })
              }
              break
            }
            case 'showOriginPage':
              setWebpageState(s => ({ ...s, showReaderMode: false }))
              break
            case 'saveAsMetaObject': {
              let coverImgSrc: string | undefined = undefined
              if (!showReaderMode) {
                const webcontentId = await coreRef.current?.getId()
                if (webcontentId) {
                  const dataUrl = (await captureWebpage(webcontentId)).data
                  if (dataUrl) {
                    coverImgSrc = (await saveImageLocally(dataUrl, { compress: false })).data
                  }
                }
              }

              if (currentWebpage?.tempNoteId) {
                ObjectStore('webpage')
                  .addOneWithMeta(
                    {
                      url: navigationUrl,
                      title,
                      favicon: faviconUrl,
                      id: currentWebpage?.id,
                      noteId: currentWebpage.tempNoteId
                    },
                    {
                      showMetaModal: true,
                      currentMeta: {
                        fromObject: webpageFrom,
                        coverImgSrc
                      }
                    }
                  )
                  .then(({ one, meta }) => {
                    console.log(one)
                    setWebpageState(s => ({ ...s, currentWebpage: one }))
                    if (one.noteId) {
                      ObjectStore('note').updateOne({ id: one.noteId, metaId: meta.id }, { silent: true })
                    }
                  })
                return
              }

              ObjectStore('webpage')
                .addOneWithMeta(
                  {
                    url: navigationUrl,
                    title,
                    favicon: faviconUrl,
                    id: currentWebpage?.id
                  },
                  {
                    showMetaModal: true,
                    currentMeta: {
                      fromObject: webpageFrom,
                      coverImgSrc
                    }
                  }
                )
                .then(({ one }) => {
                  setWebpageState(s => ({ ...s, currentWebpage: one }))
                })
              break
            }
            case 'loadUrl': {
              const { url } = event
              const valid = Regexp.isValidWebUrl(url)
              console.log(valid, url)
              let realUrl = valid ? url : searchToUrl(url)
              if (!realUrl.startsWith('http://') && !realUrl.startsWith('https://')) {
                realUrl = 'https://' + realUrl
              }
              if (initialUrl && initialUrl.length) {
                setWebpageState(s => ({ ...s, navigationUrl: realUrl }))
                coreRef.current?.navigateTo(realUrl)
              } else {
                setWebpageState(s => ({ ...s, initialUrl: realUrl }))
              }
            }
          }
        }}
        navigationState={{
          loaded,
          displayUrl: navigationUrl,
          canSave: !!(currentWebpage?.id && !objectToIdMeta?.has(currentWebpage.id)) && navigationState?.showAddAsObject !== false,
          readerMode: showReaderMode && navigationState?.showReaderMode !== false
        }}
      />
      <div style={{ height: 0, flex: 1, width: '100%' }}>
        <WebpageCore
          webpageId={currentWebpage?.id}
          innerRef={coreRef}
          showReaderMode={showReaderMode}
          url={webpageState.initialUrl}
          userAgent={userAgent}
          onEvent={onEvent}
          disableImageClick={disableImageClick}
          onUrlChange={({ url }) => {
            if (url !== navigationUrl) {
              setWebpageState(s => ({ ...s, navigationUrl: url }))
            }
          }}
          onStartLoad={() => {
            setWebpageState(s => ({ ...s, loaded: false }))
          }}
          onEndLoad={() => {
            setWebpageState(s => ({ ...s, loaded: true }))
          }}
          onFaviconUpdated={({ favicons }) => {
            const favicon = favicons[favicons.length - 1]
            currentWebpage?.id && ObjectStore('webpage').updateOne({ id: currentWebpage?.id, favicon })
            setWebpageState(s => ({ ...s, faviconUrl: favicon }))
          }}
          onTitleChange={({ title }) => {
            setWebpageState(s => ({ ...s, title }))
          }}
        >
          {(currentWebpage?.noteId || currentWebpage?.tempNoteId) && (
            <>
              <Provider>{editor && value && <SidebarToolbar value={value} editor={editor} />}</Provider>
              <div
                style={{
                  position: 'absolute',
                  top: 30,
                  right: 30,
                  zIndex: 10
                }}
              >
                <Content
                  flex
                  alignItems="center"
                  style={{
                    borderRadius: 999,
                    background: 'rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                    fontSize: FontSize['18px']
                  }}
                >
                  <Tooltip position="bottom" content={editorReaderMode ? 'Editor Mode' : 'Reader Mode'}>
                    <Icon
                      className={ClassName.circleButton()}
                      name={editorReaderMode ? 'park-editor' : 'park-book-open'}
                      onClick={toggleEditorReaderMode}
                    />
                  </Tooltip>
                </Content>
              </div>
              <WebpageEditor
                id={editorId}
                noteId={currentWebpage.noteId || currentWebpage.tempNoteId}
                onLinkClick={contentClickHandler}
                readonly={editorReaderMode}
                onEditorInitialized={e => {
                  initializedFunctionRef.current?.(e)
                  setEditor(e)
                  webpageInstance.editor = e
                }}
                onChange={v => setValue(v)}
                showToolbar={currentWebpage.tempNoteId || currentWebpage.noteId ? (currentWebpage.noteId ? true : false) : false}
                onHighlightDrag={(highlightId, editor) => {
                  const editorNode = ReactEditor.toDOMNode(editor, editor)
                  const highlightTextContent = Array.from(editorNode.querySelectorAll(`[data-highlight="${highlightId}"]`)).reduce(
                    (prev, curr) => {
                      return prev + curr.textContent
                    },
                    ''
                  )
                  GlobalDragOverlayInstance.draggingDetails = {
                    type: 'webpage label',
                    highlightId,
                    noteId: currentWebpage.noteId,
                    textContent: highlightTextContent,
                    webpageId: currentWebpage.id
                  }
                  GlobalDragOverlayInstance.addDragElements?.(<DraggingElement text="Drop to add webpage label" />)
                  GlobalDragOverlayInstance.startDrag?.()
                }}
                onTranslate={(text, id, e) => {
                  GlobalTranslateInstance.open?.({
                    e,
                    query: text,
                    source: {
                      type: 'webpage',
                      objectId: currentWebpage.id,
                      blockId: id
                    }
                  })
                }}
                onSearch={(text, id, e, editor) => {
                  GlobalSearchInstance.open?.({
                    e,
                    query: text,
                    from: {
                      type: 'webpage',
                      blockId: id,
                      selectedText: text,
                      metaId: globalStore.get(objectIdToMetaObjectIdMapAtom)?.get(currentWebpage.id)
                    }
                  })
                }}
                title={
                  <Content
                    flex
                    column
                    ref={node => editor && (editor.titleEle = node)}
                    style={{
                      maxWidth: 'calc(100% - 100px)',
                      width: 800,
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
                    <div
                      className={EditorTitleClassName}
                      style={{ padding: 0 }}
                      onClick={() => {
                        // console.log(Outliner.headingListToTree(initialValue))
                        // toggleReadonly(!readonly)
                      }}
                    >
                      {title}
                    </div>
                    <hr style={{ marginTop: 24 }} />
                  </Content>
                }
                onHighlight={(h, e) => {
                  ObjectStore('webpageLabel').addOne({
                    id: h,
                    highlightId: h,
                    webpageId: currentWebpage.id
                  })
                }}
                onHighlightRemove={h => {
                  ObjectStore('webpageLabel').deleteOneById(h, { force: true, silent: true })
                }}
              />
            </>
          )}
        </WebpageCore>
      </div>
    </Content>
  )
}

export default WebpagePage
