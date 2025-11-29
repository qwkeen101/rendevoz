import { Descendant } from 'slate'
import { useLayoutEffect, useState } from 'react'
import Webpage, { IWebpageProps } from '@/core/components/webpage/Webpage'
import { MetaStore, NoteStore, ObjectStore } from '@/api/stores'
import { GlobalSetting } from '@/core'
import { CustomEditor } from '~/typings'
import addWebpageAsMeta from '@/core/components/webpage/utils/addWebpageAsMeta'
import { AI_SUMMARY_PROP_ID } from '@/api/stores/meta/meta.store'
import { useURLToId } from '@/api/indexData'

export default ({
  id: outerId,
  name = '',
  value,
  onWebpageParsed,
  onTitleChanged,
  favicon,
  editorOptions,
  url: outerUrl,
  image,
  onInstanceInitialized,
  onEndLoad,
  onFailLoad,
  onStartLoad,
  feedCollectionId
}: Omit<IWebpageProps, 'name' | 'value' | 'url'> & {
  name?: string
  id?: number
  value?: Descendant[]
  url?: string
  image?: string
  onTitleChanged?: (v: string) => void
}) => {
  const id = useURLToId(outerUrl, outerId)
  const webpage = ObjectStore('webpage').useValue(id)
  const webpageMeta = MetaStore.useObjectToMetaValue(id)
  const url = webpage?.url || outerUrl
  const [showOriginal, setOriginal] = useState(webpage?.showOriginal ?? !GlobalSetting.getSetting().webpage.defaultCleanMode)
  useLayoutEffect(() => {
    if (webpage?.showOriginal !== undefined) {
      setOriginal(webpage.showOriginal)
    }
  }, [webpage?.showOriginal])
  if (!url) return null
  const getWebpageMeta = async (editor: CustomEditor, temp?: boolean) => {
    let m = webpageMeta
    if (!m) {
      const result = await addWebpageAsMeta({ name, url, image, favicon }, editor.children, { temp })
      m = result.meta
      return {
        meta: m,
        id: result.one.id
      }
    }
    if (!id) throw ''
    return {
      meta: m,
      id
    }
  }
  if (id && !webpage) return null
  return (
    <Webpage
      url={url}
      name={webpageMeta?.name ?? name}
      onInstanceInitialized={onInstanceInitialized}
      editorOptions={{
        ...editorOptions,
        noteId: webpage?.noteId,
        aiSummary: webpage?.aiSummary,
        layout: {
          showProps: !!webpageMeta,
          propsMetaId: webpageMeta?.id,
          ...editorOptions?.layout
        },
        metaId: webpageMeta?.id,
        labelIds: webpage?.labels || [],
        state: { ...editorOptions?.state, saveImgLocally: !!webpageMeta, aiChat: webpage?.aiChat },
        on: async e => {
          const res = await editorOptions?.on?.(e)
          switch (e.type) {
            case 'getMeta': {
              getWebpageMeta(e.editor, e.temp).then(({ meta: { id } }) => {
                e.onSuccess(id)
              })
              return true
            }
            case 'chatChange': {
              if (webpage) {
                await ObjectStore('webpage').updateOne({ id: webpage.id, aiChat: e.chat })
              }
              return true
            }
            case 'getSource': {
              const { id } = await getWebpageMeta(e.editor)
              return {
                type: 'webpage',
                objectId: id,
                ...res
              }
            }
            case 'removeSummary': {
              const { meta, id } = await getWebpageMeta(e.editor)
              if (meta) {
                MetaStore.property.updateProperty(meta.id, AI_SUMMARY_PROP_ID, null)
              }
              if (id) {
                ObjectStore('webpage').updateOne({ id: id, aiSummary: undefined })
              }
              return true
            }
            case 'AI summarize': {
              const { meta, id } = await getWebpageMeta(e.editor)
              if (meta) {
                MetaStore.addAIForMeta(meta.id, {
                  summary: e.summary.summary.summary
                })
              }
              if (id) {
                ObjectStore('webpage').updateOne({ id: id, aiSummary: e.summary })
              }
              return true
            }
            case 'addLabel': {
              const { id } = await getWebpageMeta(e.editor)
              const label = await ObjectStore('webpageLabel').addOne({ ...e.currentLabel, specType: 'webpageLabel', parentObjectId: id })
              const webpage = await ObjectStore('webpage').getOneById(id)
              if (!webpage) return true
              await ObjectStore('webpage').updateOne({ id: id, labels: [...(webpage.labels || []), label.id] })
              return label
            }
            case 'deleteLabel': {
              if (!webpage) return true
              const ids = Array.isArray(e.labelId) ? e.labelId : [e.labelId]
              await Promise.allSettled(ids.map(async i => await ObjectStore('webpageLabel').deleteOneById(i, { force: true })))
              return await ObjectStore('webpage').updateOne({ id: webpage.id, labels: webpage?.labels?.filter(i => !ids.includes(i)) })
            }
            case 'titleChange': {
              onTitleChanged?.(e.value)
              if (webpageMeta) {
                MetaStore.updateMetaObject({ id: webpageMeta.id, name: e.value })
              }
              return true
            }
          }
        }
      }}
      favicon={favicon ?? webpage?.favicon}
      onShowOriginal={v => {
        if (webpage) {
          ObjectStore('webpage').updateOne({ id: webpage.id, showOriginal: v })
        } else {
          setOriginal(v)
        }
      }}
      showOriginal={showOriginal}
      value={value}
      feedCollectionId={feedCollectionId ?? webpage?.feedCollectionId}
      onStartLoad={onStartLoad}
      onFailLoad={onFailLoad}
      onEndLoad={onEndLoad}
      onWebpageParsed={async i => {
        onWebpageParsed?.(i)
        if (webpage) {
          if (!webpage.noteId) {
            const note = await NoteStore.initializeNoteWithValue(i.content, { metaId: webpageMeta?.id })
            await ObjectStore('webpage').updateOne({ id: webpage.id, noteId: note.id })
          }
        }
      }}
    />
  )
}
