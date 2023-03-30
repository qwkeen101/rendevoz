import { Content, Icon, Image } from '@/components'
import { NoteStore, ObjectStore } from '@/stores'
import { objectIdToMetaObjectIdMapAtom } from '@/stores/meta.store'
import Id from '@/utils/id'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Descendant } from 'slate'
import { EditorInstance, IWebpage, WebpageInstance } from '~/typings'
import WebpageEditor from '../editor/WebpageEditor'
import { WebpageInnerRef } from './WebpageCore'
import { WebpageCore } from './WebpageCore'
import WebpageNavigation from './WebpageNavigation'
import readibility from '@mozilla/readability'
import { deserializeHtmlNode, normalize } from '../editor/plugins/deserializeHtml'
import TabTitle from '@/components/layout/TabTitle'
import { useGlobalAtomValue, useMemoizedFn } from '@/hooks'
import { ReactEditor } from '../editor'
import { DraggingElement, GlobalDragOverlayInstance } from '../global'

const WebpagePage = ({
  initialWebpageId,
  onWebpageChange,
  onWebpageInitialized
}: {
  initialWebpageId: number
  onWebpageChange?: (newWebpageDetails: { webpageId: number }) => void
  onWebpageInitialized?: (instance: WebpageInstance) => void
}) => {
  const initializedFunctionRef = useRef<(i: EditorInstance) => void>()
  const initialized = useRef(false)

  const [webpageState, setWebpageState] = useState<{
    showReaderMode: boolean
    currentWebpage?: IWebpage & { tempNoteValue?: Descendant[] }
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
  const webpageInstance = useMemo(() => {
    const i = {} as WebpageInstance
    if (webpageState.currentWebpage && webpageState.currentWebpage.id === initialWebpageId && initialized.current === false) {
      // wait for webpage load
      initialized.current = true
      setTimeout(() => onWebpageInitialized?.(i))
    }
    return i
  }, [webpageState.currentWebpage])
  webpageInstance.transformToNote = () => {
    return new Promise(res => {
      initializedFunctionRef.current = i => {
        webpageInstance.editorInstance = i
        res(i)
        console.log('get here')
      }
      if (!currentWebpage?.noteId) {
        coreRef.current?.clip().then(({ html, url }) => handleClip(html, url))
      } else {
        setWebpageState(s => ({ ...s, showReaderMode: true }))
      }
      if (webpageInstance.editorInstance) {
        res(webpageInstance.editorInstance)
      }
    })
  }
  const [clippedDetails, setClippedDetails] = useState<
    Partial<{
      byline: string
      excerpt: string
      siteName: string
      title: string
      length?: number
      originPathname?: string
    }>
  >()
  useEffect(() => {
    ObjectStore('webpage')
      .getOneById(initialWebpageId)
      .then(webpage => {
        setWebpageState(s => ({ ...s, initialUrl: webpage?.url, currentWebpage: webpage, navigationUrl: webpage?.url }))
      })
  }, [])

  const parseHTMLtoSlateDescandants = (
    html: string
  ):
    | {
        value: Descendant[]
        clippedDetails: typeof clippedDetails
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
        value: normalized,
        clippedDetails: {
          byline: d?.byline,
          title: d?.title,
          siteName: d?.siteName,
          excerpt: d?.excerpt,
          length: d?.length
        }
      }
    }
  }
  const handleClip = (html: string, url: string) => {
    const parsedUrl = new URL(url)
    // current webpage is the initial webpage
    if (currentWebpage?.id && currentWebpage.id === initialWebpageId) {
      if (currentWebpage.noteId) {
        setWebpageState(s => ({ ...s, showReaderMode: true }))
      } else {
        const result = parseHTMLtoSlateDescandants(html)
        if (result) {
          const { value, clippedDetails } = result
          setClippedDetails({ ...clippedDetails, originPathname: parsedUrl.href })
          const contentId = NoteStore.saveNoteAsBuffer(value)
          NoteStore.addNote(
            {
              contentId,
              metaId: 1
            },
            true,
            true
          ).then(note => {
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
      const result = parseHTMLtoSlateDescandants(html)
      if (result) {
        const { value, clippedDetails } = result
        setClippedDetails({ ...clippedDetails, originPathname: parsedUrl.href })
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        setWebpageState(s => ({ ...s, currentWebpage: { ...s.currentWebpage, tempNoteValue: value }, showReaderMode: true }))
      }
    }
  }
  const { showReaderMode, loaded, navigationUrl, editorId, currentWebpage, initialUrl, title, faviconUrl } = webpageState
  const coreRef = useRef<WebpageInnerRef>()
  useEffect(() => {
    if (navigationUrl !== initialUrl && navigationUrl && navigationUrl.length) {
      setWebpageState(s => ({
        ...s,
        showReaderMode: false,
        currentWebpage: {
          id: Id.getId(),
          specType: 'webpage',
          title: webpageState.title || '',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      }))
    } else if (navigationUrl === initialUrl) {
      ObjectStore('webpage')
        .getOneById(initialWebpageId)
        .then(obj => {
          setWebpageState(s => ({ ...s, currentWebpage: obj }))
        })
    }
  }, [navigationUrl])
  useEffect(() => {
    if (currentWebpage) {
      onWebpageChange?.({
        webpageId: currentWebpage?.id
      })
    }
  }, [currentWebpage])

  const objectIdToMeta = useGlobalAtomValue(objectIdToMetaObjectIdMapAtom)
  useEffect(() => {
    // if current add as meta object in reader mode
    if (navigationUrl !== initialUrl && navigationUrl && currentWebpage && currentWebpage?.noteId === undefined) {
      // current new page added as meta object
      if (objectIdToMeta?.has(currentWebpage?.id)) {
        ObjectStore('webpage')
          .getOneById(currentWebpage.id)
          .then(obj => {
            setWebpageState(s => ({
              ...s,
              currentWebpage: {
                ...currentWebpage,
                noteId: obj?.id
              }
            }))
          })
      }
    }
  }, [objectIdToMeta])
  const contentClickHandler: React.MouseEventHandler = useMemoizedFn(e => {
    const targetLink = (e.target as HTMLElement).closest('a')
    if (!targetLink) return
    e.preventDefault()
    const url = new URL(targetLink.href)
    if (!clippedDetails?.originPathname) return
    if (url.hostname === 'localhost') {
      const newHref = url.href.replace(`${url.origin}/`, '')
      const originUrl = new URL(clippedDetails.originPathname)
      const replacedUrl = new URL(newHref.startsWith('#') ? newHref : `/${newHref}`, originUrl)
      window.open(replacedUrl, '_blank')
    } else {
      window.open(url, '_blank')
    }
  })
  return (
    <Content flex column fullHeight fullWidth>
      <TabTitle
        title={title || 'Webpage'}
        icon={
          !loaded ? (
            <Icon size={16} name="park-loading-four" spin containerStyle={{ padding: 1 }} />
          ) : faviconUrl ? (
            <Image src={faviconUrl} width={18} />
          ) : null
        }
      />
      <WebpageNavigation
        on={event => {
          switch (event.action) {
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
              if (currentWebpage?.noteId || currentWebpage?.tempNoteValue) {
                setWebpageState(s => ({ ...s, showReaderMode: true }))
              } else {
                coreRef.current?.clip().then(({ html, url }) => {
                  handleClip(html, url)
                })
              }
              break
            }
            case 'showOriginPage':
              setWebpageState(s => ({ ...s, showReaderMode: false }))
              break
            case 'saveAsMetaObject': {
              if (currentWebpage?.tempNoteValue) {
                const contentId = NoteStore.saveNoteAsBuffer(currentWebpage.tempNoteValue)
                NoteStore.addNote(
                  {
                    contentId,
                    metaId: 1
                  },
                  true,
                  true
                ).then(note => {
                  ObjectStore('webpage').addOne(
                    {
                      url: navigationUrl,
                      title,
                      favicon: faviconUrl,
                      id: currentWebpage?.id,
                      noteId: note.id
                    },
                    {
                      showAddModal: true
                    }
                  )
                })
                return
              }
              ObjectStore('webpage').addOne(
                {
                  url: navigationUrl,
                  title,
                  favicon: faviconUrl,
                  id: currentWebpage?.id
                },
                {
                  showAddModal: true
                }
              )
              break
            }
            case 'loadUrl': {
              const { url } = event
              setWebpageState(s => ({ ...s, navigationUrl: url }))
              coreRef.current?.navigateTo(url)
            }
          }
        }}
        navigationState={{
          loaded,
          displayUrl: navigationUrl,
          canSave: !!(currentWebpage?.id && !objectIdToMeta?.has(currentWebpage.id)),
          readerMode: showReaderMode
        }}
      />
      <WebpageCore
        innerRef={coreRef}
        showReaderMode={showReaderMode}
        url={webpageState.initialUrl}
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
          setWebpageState(s => ({ ...s, faviconUrl: favicons[favicons.length - 1] }))
        }}
        onTitleChange={({ title }) => {
          setWebpageState(s => ({ ...s, title }))
        }}
      >
        {(currentWebpage?.noteId || currentWebpage?.tempNoteValue) && (
          <WebpageEditor
            key={currentWebpage.noteId}
            id={editorId}
            initialValue={currentWebpage.tempNoteValue}
            noteId={currentWebpage.noteId}
            onLinkClick={contentClickHandler}
            onEditorInstanceInitialized={i => {
              if (currentWebpage.id === initialWebpageId) {
                initializedFunctionRef.current?.(i)
                initializedFunctionRef.current = undefined
              }
            }}
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
            title={webpageState.title || clippedDetails?.excerpt || 'Untitled Webpage'}
            onHighlight={(h, e) => {
              ObjectStore('webpageLabel').addOne({
                id: h,
                highlightId: h,
                webpageId: currentWebpage.id
              })
            }}
          />
        )}
      </WebpageCore>
    </Content>
  )
}

export default WebpagePage
