import { IEditorInstance } from '~/typings'
import { RefObject, useEffect, useRef } from 'react'
import { MetaStore, ObjectStore } from '@/api/stores'
import getInsideMetas from '@/core/components/editor/utils/getInsideMetas'

export default (instanceRef?: RefObject<IEditorInstance | undefined>, metaId?: number, noteId?: number) => {
  const prevMetas = useRef<Set<number>>(new Set())
  useEffect(() => {
    const instance = instanceRef?.current
    if (instance && metaId) {
      const i = setInterval(() => {
        requestIdleCallback(() => {
          const relatedMetas = new Set(instance.getInsideMetas?.())
          const deletedMetas = new Set<number>()
          if (prevMetas.current.size !== relatedMetas.size) {
            const v = instance.getSlateEditor?.().children
            if (v && noteId) {
              const insides = getInsideMetas(v)
              ObjectStore('note').updateOne({ id: noteId, insideMetas: insides })
            }
          }
          prevMetas.current.forEach(v => {
            if (!relatedMetas.has(v)) {
              deletedMetas.add(v)
            }
          })
          deletedMetas.forEach(i => {
            const link = MetaStore.getMetaLinkBySourceAndTarget(i, metaId) || MetaStore.getMetaLinkBySourceAndTarget(metaId, i)
            if (link) {
              MetaStore.deleteMetaLink(link, true)
            }
          })
          prevMetas.current = relatedMetas
        })
      }, 2000)
      return () => {
        clearTimeout(i)
      }
    }
  }, [metaId])
}
