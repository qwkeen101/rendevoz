import { IEditorInstance } from '~/typings'
import { useEffect, useRef } from 'react'
import { MetaStore } from '@/api/stores'

export default (instance?: IEditorInstance, metaId?: number) => {
  const prevMetas = useRef<Set<number>>(new Set())
  useEffect(() => {
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
  }, [instance, metaId])
}
