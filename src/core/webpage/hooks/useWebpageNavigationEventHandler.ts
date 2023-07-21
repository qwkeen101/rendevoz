import { globalStore, NoteStore, ObjectStore } from '@/stores'
import { NavigationEvent } from '../WebpageNavigation'
import useWebpageInstance from './useWebpageInstance'
import useWebpageState from './useWebpageState'
import { captureWebpage, saveImageLocally } from '@/utils/img'
import { Regexp } from '@/utils'
import { searchToUrl } from '../utils'
import readibility from '@mozilla/readability'
import { Descendant } from 'slate'
import { deserializeHtmlNode, normalize } from '@/core/editor/plugins/deserializeHtml'
import Id from '@/utils/id'
import { objectIdToMetaObjectIdMapAtom } from '@/stores/meta.store'

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
    // transformHTML(d.content).then(result => console.log(result))
    console.log(parsedDoc.body)
    const fragment = deserializeHtmlNode(parsedDoc.body)
    console.log(fragment)
    fragment.forEach(i => (i.id = Id.getId()))
    const normalized = normalize(fragment).filter(i => 'type' in i)
    return {
      value: normalized
    }
  }
}

const useWebpageNavigationEventHandler = () => {
  const [webpageState, setWebpageState] = useWebpageState()
  const instance = useWebpageInstance()
  const { currentWebpage, showReaderMode, navigationUrl, title, faviconUrl, initialUrl, webpageFrom } = webpageState
  const saveNote = async (value: Descendant[]) => {
    const contentId = await NoteStore.saveNoteAsBuffer(value)
    return ObjectStore('note').addOne({
      contentId
    })
  }
  const handleClip = async (html: string) => {
    const objectToIdMeta = globalStore.get(objectIdToMetaObjectIdMapAtom)
    // current webpage is a saved meta
    if (currentWebpage?.id && objectToIdMeta?.has(currentWebpage?.id)) {
      if (currentWebpage.noteId) {
        setWebpageState(s => ({ ...s, showReaderMode: true }))
      } else {
        const result = parseHTMLtoSlateDescandants(html)
        console.log(result)
        if (result) {
          const { value } = result
          const contentId = await NoteStore.saveNoteAsBuffer(value)
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
                  obj &&
                    setWebpageState(s => ({
                      ...s,
                      showReaderMode: true,
                      currentWebpage: obj
                    }))
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
        console.log(result, html)
        const { value } = result

        saveNote(value).then(note => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          setWebpageState(s => ({
            ...s,
            currentWebpage: { ...s.currentWebpage, tempNoteId: note.id },
            showReaderMode: true
          }))
        })
      }
    }
  }
  instance.handleClipHTML = handleClip
  const handle = async (event: NavigationEvent) => {
    switch (event.action) {
      case 'zoom in': {
        instance.zoomIn?.()
        break
      }
      case 'zoom out': {
        instance.zoomOut?.()
        break
      }
      case 'stop':
        instance.stop?.()
        break
      case 'refresh':
        instance.refresh?.()
        break
      case 'back': {
        const newUrl = instance.navigateBack?.()
        setWebpageState(s => ({ ...s, navigationUrl: newUrl }))
        break
      }
      case 'forward': {
        const newUrl = instance.navigateForward?.()
        setWebpageState(s => ({ ...s, navigationUrl: newUrl }))
        break
      }
      case 'showReaderPage': {
        if (currentWebpage?.noteId || currentWebpage?.tempNoteId) {
          setWebpageState(s => ({ ...s, showReaderMode: true }))
        } else {
          instance.clipHTML?.().then(({ html }) => {
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
          const webcontentId = await instance.getId?.()
          if (webcontentId) {
            const dataUrl = await captureWebpage(webcontentId)
            if (dataUrl) {
              coverImgSrc = await saveImageLocally(dataUrl, {
                compress: false
              })
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
          instance.navigateTo?.(realUrl)
        } else {
          setWebpageState(s => ({ ...s, initialUrl: realUrl }))
        }
      }
    }
  }

  return {
    handleNavigationEvent: handle
  }
}

export default useWebpageNavigationEventHandler
