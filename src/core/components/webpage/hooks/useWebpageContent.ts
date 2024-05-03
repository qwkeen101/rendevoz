import { globalStore, MetaStore, NoteStore, ObjectStore } from '@/api/stores'
import { useEffect, useLayoutEffect } from 'react'
import useWebpageState, { IWebpageState } from '@/core/components/webpage/hooks/useWebpageState'
import { atom } from 'jotai'
import { useMemoizedFn } from '@/hooks'
import { Rendevoz } from '@/core/rendevoz'
import { useLatest } from 'react-use'
import FileSystem from '@/api/fileSystem'

export const UrlToWebpageMap = atom(new Map<string, number>())

document.addEventListener('DOMContentLoaded', () => {
  const webpagesAtom = ObjectStore('webpage').objectMapAtom
  ObjectStore('webpage')
    .fetchAll()
    .then(data => {
      const map = new Map()
      data.forEach(i => {
        map.set(i.url, i.id)
      })
      globalStore.set(UrlToWebpageMap, map)
    })
  globalStore.sub(webpagesAtom, () => {
    const currentValue = globalStore.get(webpagesAtom)
    const map = new Map()
    currentValue.forEach(i => {
      map.set(i.url, i.id)
    })
    globalStore.set(UrlToWebpageMap, map)
  })
})
/**
 * 三种情况：1 为实体，有noteId， 2 没有实体，url变化时重新获取 3 没有实体，但是添加为实体
 */
const useWebpageContent = (options: {
  onParsed?: (s: IWebpageState['externalState']) => void
  onStartLoad?: VoidFunction
  onEndLoad?: VoidFunction
  onFailLoad?: VoidFunction
}) => {
  const [webpageState, setWebpageState] = useWebpageState()
  const currentWebpage = ObjectStore('webpage').useValue(webpageState.currentWebpageId)
  const latestUrl = useLatest(webpageState.currentUrl)
  const memoedLoadUrl = useMemoizedFn(async () => {
    const startUrl = latestUrl.current
    if (webpageState.externalState?.content) {
      setWebpageState(s => ({
        ...s,
        currentParsedContent: webpageState.externalState?.content,
        loaded: true,
        isLoading: false,
        failLoading: false,
        currentWebpage: webpageState.externalState
      }))
      options.onEndLoad?.()
      return
    }
    if (webpageState.currentUrl) {
      const url = webpageState.currentUrl
      if (!webpageState.currentWebpageId || (webpageState.currentWebpageId && !webpageState.currentWebpageNoteId)) {
        // check if already has this webpage registered
        const map = globalStore.get(UrlToWebpageMap)
        if (map.has(url)) {
          const id = map.get(url)
          const wp = await ObjectStore('webpage').getOneById(id)
          if (wp && wp.noteId) {
            options.onEndLoad?.()
            setWebpageState(s => ({ ...s, currentWebpageId: wp.id, loaded: true, isLoading: false, failLoading: false }))
            return
          }
        }
      }
      if (webpageState.currentWebpageNoteId) {
        setWebpageState(s => ({ ...s, loaded: true, isLoading: false, failLoading: false }))
        options.onEndLoad?.()
        return
      }
      setWebpageState(s => ({ ...s, loaded: false, isLoading: true, failLoading: false }))
      options.onStartLoad?.()
      Rendevoz.Utils.Web.parseWebpage(url)
        .then(async res => {
          options.onEndLoad?.()
          if (webpageState.externalState?.content) {
            return
          }
          const currentUrl = latestUrl.current
          console.log(currentUrl, startUrl)
          if (currentUrl !== startUrl) {
            return
          }
          if (res) {
            const { content, author, domain, title, favicon, image, description } = res
            if (webpageState.currentWebpageId && !currentWebpage?.noteId) {
              const note = await NoteStore.initializeNoteWithValue(content)
              if (note) {
                await ObjectStore('webpage').updateOne({
                  id: webpageState.currentWebpageId,
                  noteId: note.id,
                  author,
                  domain,
                  name: title,
                  favicon
                })
              }
              const webpageMeta = MetaStore.getMetaObjectByObjectId(webpageState.currentWebpageId)
              if (webpageMeta && !webpageMeta.name) {
                let imgPath = undefined
                if (image) {
                  const f = await fetch(image).then(i => i.blob())
                  imgPath = await FileSystem.saveImage(f)
                }
                MetaStore.updateMetaObject({ id: webpageMeta.id, name: title, coverImgSrc: imgPath, description })
              }
            }
            setWebpageState(s => ({
              ...s,
              currentParsedContent: content,
              loaded: true,
              isLoading: false,
              failLoading: false,
              currentWebpage: {
                author,
                domain,
                title,
                favicon,
                image: res.image
              }
            }))
            options.onParsed?.({
              title,
              author,
              favicon,
              domain,
              link: url,
              content,
              image: res.image
            })
            return
          }
        })
        .catch(e => {
          console.error(e)
          if (webpageState.externalState?.content) {
            options.onEndLoad?.()
            setWebpageState(s => ({ ...s, loaded: true, isLoading: false, failLoading: false }))
            return
          }
          setWebpageState(s => ({ ...s, loaded: false, isLoading: false, failLoading: true }))
          options.onFailLoad?.()
        })
    }
  })
  useLayoutEffect(() => {
    memoedLoadUrl()
  }, [webpageState.currentUrl])
  useEffect(() => {
    console.log(currentWebpage)
    if (currentWebpage) {
      setWebpageState(s => ({
        ...s,
        currentWebpageNoteId: currentWebpage.noteId,
        loaded: true,
        currentUrl: currentWebpage.url,
        currentWebpage: {
          favicon: currentWebpage.favicon,
          title: currentWebpage.title || 'Untitled',
          author: currentWebpage.author,
          domain: currentWebpage.domain || 'Unknown',
          image: currentWebpage.image
        }
      }))
    } else {
      setWebpageState(s => ({
        ...s,
        loaded: s.externalState?.content ? true : false,
        currentWebpageNoteId: undefined,
        currentWebpage: undefined
      }))
    }
  }, [currentWebpage])
}

export default useWebpageContent
