import { ObjectStore } from '@/stores'
import { NavigationEvent } from '../WebpageNavigation'
import useWebpageInstance from './useWebpageInstance'
import useWebpageState from './useWebpageState'
import { Regexp } from '@/utils'
import { searchToUrl } from '../utils'

const useWebpageNavigationEventHandler = () => {
  const [webpageState, setWebpageState] = useWebpageState()
  const instance = useWebpageInstance()
  const { currentWebpage } = webpageState

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
      case 'showOriginPage':
        setWebpageState(s => ({ ...s, showReaderMode: false }))
        break
      case 'saveAsMetaObject': {
        let coverImgSrc: string | undefined = undefined
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
