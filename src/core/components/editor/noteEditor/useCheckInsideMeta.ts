import { IEditorInstance } from '~/typings'
import { RefObject, useEffect, useRef } from 'react'
import { MetaStore } from '@/api/stores'

export default (instanceRef?: RefObject<IEditorInstance | undefined>, metaId?: number) => {
  const prevMetas = useRef<Set<number>>(new Set())
  useEffect(() => {
    const instance = instanceRef?.current
    if (instance && metaId) {
      const i = setInterval(() => {
        requestIdleCallback(() => {
          const relatedMetas = new Set(instance.getInsideMetas?.())
          const deletedMetas = new Set<number>()
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
