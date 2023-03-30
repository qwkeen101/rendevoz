import { Content, Icon, Image } from '@/components'
import TabTitle from '@/components/layout/TabTitle'
import { DraggingElement, GlobalDragOverlayInstance, ReactEditor, Webpage, WebpageInnerRef } from '@/core'
import { deserializeHtmlNode, normalize } from '@/core/editor/plugins/deserializeHtml'
import WebpageEditor from '@/core/editor/WebpageEditor'
import { useGlobalAtomValue, useMemoizedFn } from '@/hooks'
import { NoteStore, ObjectStore } from '@/stores'
import Id from '@/utils/id'
import readibility from '@mozilla/readability'
import { useEffect, useMemo, useRef, useState } from 'react'
import { EditorInstance, WebpageInstance } from '~/typings'

const WebpagePage = ({
  webpageId,
  onWebpageInitialized
}: {
  webpageId: number
  onWebpageInitialized?: (instance: WebpageInstance) => void
}) => {
  const webpageAtom = ObjectStore('webpage').createAtom(webpageId)
  const webpage = useGlobalAtomValue(webpageAtom)
  const initializedFunctionRef = useRef<(i: EditorInstance) => void>()
  const initialized = useRef(false)
  const [clipped, setClipped] = useState<boolean>()
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

  const innerRef = useRef<WebpageInnerRef>()
  const [webpageState, setWebpageState] = useState<{
    isLoading?: boolean
    faviconUrl?: string
    title?: string
  }>()
  const clipContainerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (clipped) {
      const clipContainer = clipContainerRef.current
      if (clipContainer) {
        const dragHandler = (e: DragEvent) => {
          const dataTransfer = e.dataTransfer
          // text/plain
          // text/html
          dataTransfer?.types.forEach(type => {
            console.log(type, dataTransfer.getData(type))
          })
        }
        clipContainer.addEventListener('dragstart', dragHandler)
      }
    }
  }, [clipped])
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
  const webpageInstance = useMemo(() => {
    const i = {} as WebpageInstance
    if (webpage && initialized.current === false) {
      // wait for webpage load
      initialized.current = true
      console.log('get herezzz')
      setTimeout(() => onWebpageInitialized?.(i))
    }
    return i
  }, [webpage?.id])
  webpageInstance.transformToNote = () => {
    return new Promise(res => {
      initializedFunctionRef.current = i => {
        webpageInstance.editorInstance = i
        res(i)
      }
      if (!webpage?.noteId) {
        innerRef.current?.clip().then(({ html, url }) => handleClip(html, url))
      } else {
        setClipped(true)
      }
      if (webpageInstance.editorInstance) {
        res(webpageInstance.editorInstance)
      }
    })
  }
  const handleClip = (html: string, url: string) => {
    if (webpage?.noteId && url === webpage.url) {
      setClipped(true)
      return
    }
    const parsedUrl = new URL(url)
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const d = new readibility.Readability(doc).parse()
    if (d) {
      // setClipped(d?.content)
      const parsedDoc = parser.parseFromString(d.content, 'text/html')
      const fragment = deserializeHtmlNode(parsedDoc.body)
      fragment.forEach(i => (i.id = Id.getId()))
      const normalized = normalize(fragment).filter(i => 'type' in i)
      const contentId = NoteStore.saveNoteAsBuffer(normalized)
      //update current noteid
      NoteStore.addNote(
        {
          contentId,
          metaId: 1
        },
        true,
        true
      ).then(note => {
        ObjectStore('webpage').updateOne({ id: webpageId, noteId: note.id })
      })

      setClipped(true)
    }
    setClippedDetails({
      byline: d?.byline,
      title: d?.title,
      siteName: d?.siteName,
      excerpt: d?.excerpt,
      length: d?.length,
      originPathname: parsedUrl.href
    })
  }
  if (!webpage) return null
  return (
    <Content fullHeight fullWidth>
      <TabTitle
        title={webpageState?.title || 'Webpage'}
        icon={
          webpageState?.isLoading ? (
            <Icon size={16} name="park-loading-four" spin containerStyle={{ padding: 1 }} />
          ) : webpageState?.faviconUrl ? (
            <Image src={webpageState.faviconUrl} width={18} />
          ) : null
        }
      />
      <Webpage
        url={webpage?.url}
        clippable
        innerRef={innerRef}
        onClip={handleClip}
        onStartLoad={() => {
          setWebpageState(s => ({ ...s, isLoading: true }))
        }}
        onEndLoad={() => {
          setWebpageState(s => ({ ...s, isLoading: false }))
        }}
        onFaviconUpdated={data => {
          const favicon = data.favicons[data.favicons.length - 1]
          setWebpageState(s => ({ ...s, faviconUrl: favicon }))
        }}
        onTitleChange={data => {
          setWebpageState(s => ({ ...s, title: data.title }))
        }}
        onUrlChange={data => {
          if (data.url === webpage.url) {
            return
          }
          setClipped(undefined)
        }}
      >
        {clipped && (
          <WebpageEditor
            onLinkClick={contentClickHandler}
            onEditorInstanceInitialized={i => {
              initializedFunctionRef.current?.(i)
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
                noteId: webpage.noteId,
                textContent: highlightTextContent,
                webpageId
              }
              GlobalDragOverlayInstance.addDragElements?.(<DraggingElement text="Drop to add webpage label" />)
              GlobalDragOverlayInstance.startDrag?.()
            }}
            noteId={webpage.noteId}
            title={clippedDetails?.title}
            onHighlight={(h, e) => {
              ObjectStore('webpageLabel').addOne({
                id: h,
                highlightId: h,
                webpageId
              })
            }}
          />
        )}
      </Webpage>
    </Content>
  )
}

export default WebpagePage
