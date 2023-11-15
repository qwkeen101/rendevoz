import { intersectionOfMultipleSets } from '@/core'
import { usePrevious } from '@/hooks'
import { indexedMetaLinksAtom } from '@/api/stores/meta.store'
import { globalStore } from '@/api/stores'
import { css } from '@emotion/css'
import produce from 'immer'
import { selectAtom } from 'jotai/utils'
import { memo, useEffect, useMemo } from 'react'
import useEdges, { useSetOppsiteEdgesMap } from '../hooks/useEdges'
import Edge from './Edge'
import { Container, useApp } from '@pixi/react'
import PixiEdge from '@/core/graph/components/PixiEdge'
import { UpOne } from '@icon-park/svg'
import { SVGScene } from '@pixi-essentials/svg'
import { RenderTexture } from 'pixi.js'
import useGraph from '@/core/graph/hooks/useGraph'

const svgContainerClassName = css({
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
  overflow: 'visible',
  pointerEvents: 'none'
})

export const cachedArrowTexture: {
  current: undefined | RenderTexture
} = {
  current: undefined
}
const EdgeContainer = ({ type = 'canvas' }: { type: 'canvas' | 'svg' }) => {
  const [edges] = useEdges()
  const setOppositeEdgesMap = useSetOppsiteEdgesMap()
  const sourceIdToLinkIdsMapAtom = useMemo(() => selectAtom(indexedMetaLinksAtom, i => i?.sourceIdToLinkIdsMap), [])
  const targetIdToLinkIdsMapAtom = useMemo(() => selectAtom(indexedMetaLinksAtom, i => i?.targetIdToLinkIdMap), [])
  const previousEdges = usePrevious(edges)
  const app = type === 'canvas' && useApp()
  const graph = useGraph()
  // if (type === 'canvas' && app && !graph?.CACHED_ICON_TEXTURE.has('_edge_arrow')) {
  //   graph?.CACHED_ICON_TEXTURE.set('_edge_arrow', texture)
  // }
  useEffect(() => {
    if (edges && edges?.length !== previousEdges?.length && edges?.length > 0) {
      const sourceIdToLinkIdsMap = globalStore.get(sourceIdToLinkIdsMapAtom)
      const targetIdToLinkIdsMap = globalStore.get(targetIdToLinkIdsMapAtom)
      setOppositeEdgesMap(map => {
        const newMap = produce(map, draft => {
          edges?.forEach(edge => {
            const { sourceId, targetId } = edge
            // find another link which sourceId === targetId && targetId === sourceId
            const oppositeSourceToLinkSet = targetIdToLinkIdsMap?.get(sourceId)
            const oppositeTargetToLinkSet = sourceIdToLinkIdsMap?.get(targetId)
            if (oppositeSourceToLinkSet && oppositeTargetToLinkSet) {
              const intersected = intersectionOfMultipleSets(oppositeSourceToLinkSet, oppositeTargetToLinkSet) as Set<number>
              if (intersected.size === 1) {
                const [first] = intersected
                draft.set(edge.id, first)
              }
            }
          })
        })
        console.log(newMap)
        return newMap
      })
    }
  }, [edges])
  console.log(edges)
  if (type === 'svg') {
    return (
      <svg className={svgContainerClassName}>
        {edges
          ?.filter(i => !i.hidden)
          ?.map(edge => (
            <Edge edge={edge} key={`${edge.id}`} />
          ))}
      </svg>
    )
  } else {
    return (
      <Container position={[0, 0]} sortableChildren={true}>
        {edges?.map(e => (
          <PixiEdge edge={e} key={e.id} />
        ))}
      </Container>
    )
  }
}
export default memo(EdgeContainer)
