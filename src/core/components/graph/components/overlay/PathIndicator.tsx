import { useAtomValue } from 'jotai'
import { GraphPathFilterAtom } from '../GraphPathFilter'
import { useEffect, useState } from 'react'
import { findPathsBetweenTwoMetaObjects } from '../../utils/findPathsBetweenTwoNodes'
import { Content, Icon } from '@/components'
import { useTranslation } from 'react-i18next'
import { globalStore } from '@/api/stores'
import { metaObjectsAtom } from '@/api/stores/meta/meta.store'
import ClassName from '@/styles/classNames'
import FontSize from '@/consts/font'

const PathIndicator = () => {
  const pathFilter = useAtomValue(GraphPathFilterAtom)
  const [indicatorState, setIndicatorState] = useState<{
    pathsNum?: number
    reversePathsNum?: number
    startNodeName?: string
    shortest?: number
    longest?: number
  }>()
  const { t } = useTranslation()
  useEffect(() => {
    if (!pathFilter?.visiblePath?.length) {
      if (pathFilter?.startNodeId && pathFilter.tempEndNodeId) {
        const { startNodeId, tempEndNodeId } = pathFilter
        const startNode = globalStore.get(metaObjectsAtom).get(startNodeId)
        const paths = findPathsBetweenTwoMetaObjects(startNodeId, tempEndNodeId)
        const revertPaths = findPathsBetweenTwoMetaObjects(tempEndNodeId, startNodeId)
        paths.sort((b, a) => b.length - a.length)
        setIndicatorState({
          pathsNum: paths.length,
          startNodeName: startNode?.name,
          shortest: paths[0]?.length,
          longest: paths[paths.length - 1]?.length,
          reversePathsNum: revertPaths.length
        })
      }
    }
  }, [pathFilter?.startNodeId, pathFilter?.tempEndNodeId])

  return (
    <Content style={{ maxWidth: 350, overflow: 'hidden', padding: '2px 6px' }}>
      {indicatorState?.pathsNum ? (
        <>
          <div className={ClassName.ellipsisFont(1)} style={{ fontSize: FontSize['12px'] }}>
            {t('graph.found paths from', { num: indicatorState?.pathsNum })} {indicatorState?.startNodeName}
          </div>
          <Content flex gap={16} className={ClassName.description(FontSize['11px'])}>
            <span>
              {t('graph.shortest path length')} {indicatorState?.shortest}
            </span>
            <span>
              {t('graph.longest path length')} {indicatorState?.longest}
            </span>
          </Content>
        </>
      ) : (
        <Content flex gap={10} alignItems="center" style={{ fontWeight: 700 }}>
          <Icon name="park-close" fill={'#E76161'} theme="filled" />
          {t('graph.no path found')}
        </Content>
      )}
      {(indicatorState?.reversePathsNum || 0) > 0 ? (
        <div style={{ fontWeight: 600 }}>
          {t('graph.total reverse paths')}: {indicatorState.reversePathsNum}
        </div>
      ) : undefined}
    </Content>
  )
}

export default PathIndicator
