import { CSSProperties, memo, useMemo, useRef, useState } from 'react'
import { useGlobalAtomValue } from '@/hooks'
import { indexedMetaLinksAtom } from '@/api/stores/meta/meta.store'
import { useTranslation } from 'react-i18next'
import { MetaStore } from '@/api/stores'
import { Button, Content, ContentEditor, Icon, IconWithPopover, TabPane, Tabs, WithBorder } from '@/components'
import _ from 'lodash'
import Select from '@/components/base/select'
import { InlineObject } from '@/core'
import { MetaLink, MetaObject } from '~/typings'
import classnames from 'classnames'
import usePasteMetaObject from '@/core/object/usePasteMetaObject'
import { Icons } from '@/consts'

export const RelatedPanel = memo(
  ({
    metaId,
    style,
    className,
    onRelatedChange
  }: {
    metaId: number
    style?: CSSProperties
    className?: string
    onRelatedChange?: (value: number) => void
  }) => {
    const indexed = useGlobalAtomValue(indexedMetaLinksAtom)
    const sourceToTarget = useGlobalAtomValue(indexedMetaLinksAtom)?.sourceIdToLinkIdsMap.get(metaId)
    const targetToSource = useGlobalAtomValue(indexedMetaLinksAtom)?.targetIdToLinkIdMap.get(metaId)

    const { t } = useTranslation()

    const { allLinkIds, inboundLinkIds, outboundLinkIds } = useMemo(() => {
      const inboundLinkIds = Array.from(targetToSource?.values() || [])
      const outboundLinkIds = Array.from(sourceToTarget?.values() || [])
      const allLinkIds = [...inboundLinkIds, ...outboundLinkIds]
      onRelatedChange?.(allLinkIds.length)
      return {
        inboundLinkIds,
        outboundLinkIds,
        allLinkIds
      }
    }, [metaId, indexed, sourceToTarget, targetToSource])
    const [visibleTab, setVisibleTab] = useState<'out' | 'in' | 'all'>('all')
    const ref = useRef<HTMLElement>(null)
    const handleAddLink = (targetMetaId: number) => {
      const rootMetaId = metaId
      if (visibleTab === 'all') {
        MetaStore.addMetaLink({
          sourceId: rootMetaId,
          targetId: targetMetaId
        })
        MetaStore.addMetaLink({
          sourceId: targetMetaId,
          targetId: rootMetaId
        })
      }
      if (visibleTab === 'in') {
        MetaStore.addMetaLink({
          sourceId: targetMetaId,
          targetId: rootMetaId
        })
      }
      if (visibleTab === 'out') {
        MetaStore.addMetaLink({
          sourceId: rootMetaId,
          targetId: targetMetaId
        })
      }
    }
    usePasteMetaObject(ref, objs => {
      objs.forEach(i => {
        handleAddLink(i.id)
      })
    })
    const [groupType, setGroupType] = useState<'all' | MetaObject['type']>('all')
    const filterlinks = visibleTab === 'in' ? inboundLinkIds : visibleTab === 'out' ? outboundLinkIds : allLinkIds
    const allLinkWithMetas = useMemo(() => {
      const map = MetaStore.getMetaLinksMap()
      const linkDetails = filterlinks.map(id => map.get(id)).filter(i => i) as MetaLink[]
      const objectMap = MetaStore.getMetaObjectsMap()
      const allTargets = new Set()
      return linkDetails
        .map(detail => {
          const targetMetaId = detail.sourceId === metaId ? detail.targetId : detail.sourceId
          if (allTargets.has(targetMetaId)) return
          const targetType = objectMap.get(targetMetaId)?.type
          if (targetType) {
            allTargets.add(targetMetaId)
            return {
              linkId: detail.id,
              targetMetaId,
              targetType
            }
          }
        })
        .filter(i => i)
    }, [filterlinks, metaId, visibleTab])
    const types = useMemo(() => {
      return Object.keys(_.groupBy(allLinkWithMetas, m => m.targetType))
    }, [allLinkWithMetas])
    return (
      <div ref={ref} style={style} className={classnames('h-full w-full flex min-h-60 flex-col', className)}>
        <Tabs
          onTabClick={key => {
            setVisibleTab(key)
          }}
          extra={
            types.length ? (
              <Select
                padding={4}
                value={groupType}
                closeOnSelect={true}
                onSelect={v => setGroupType(v[0])}
                className={'min-w-24 font-size-12 h-7'}
                menuStyle={{
                  overflowY: 'auto',
                  maxHeight: 240
                }}
                options={[
                  {
                    value: 'all',
                    children: t('general.all'),
                    icon: 'park-all-application'
                  },
                  ...types.map(t => ({
                    value: t,
                    children: Global.utils.getTypeName(t),
                    icon: Global.utils.getIcon(t)
                  }))
                ]}
              />
            ) : null
          }
          defaultActiveKey={'all'}
          activeKey={visibleTab}
          tabNavLeftClassName={'-ml-1'}
        >
          <TabPane
            key="all"
            tab={
              <div className={'flex gap-2'}>
                <Icon name={'park-all-application'} />
                <div>{t('general.all')}</div>
              </div>
            }
          >
            <RelatedGroup groupType={groupType} rootMetaId={metaId} linkIds={allLinkIds} />
          </TabPane>
          <TabPane
            tab={
              <div className={'flex gap-2'}>
                <Icon name={'park-link-in'} />
                <div>{t('general.inbound links')}</div>
              </div>
            }
            key={'in'}
          >
            <RelatedGroup groupType={groupType} rootMetaId={metaId} linkIds={inboundLinkIds} />
          </TabPane>
          <TabPane
            tab={
              <div className={'flex gap-2'}>
                <Icon name={'park-link-out'} />
                <div>{t('general.outbound links')}</div>
              </div>
            }
            key={'out'}
          >
            <RelatedGroup groupType={groupType} rootMetaId={metaId} linkIds={outboundLinkIds} />
          </TabPane>
        </Tabs>
      </div>
    )
  }
)
const RelatedGroup = ({ linkIds, rootMetaId, groupType }: { linkIds: number[]; rootMetaId: number; groupType: string }) => {
  const ref = useRef(null)
  const allLinkWithMetas = useMemo(() => {
    const map = MetaStore.getMetaLinksMap()
    const linkDetails = linkIds.map(id => map.get(id)).filter(i => i) as MetaLink[]
    const objectMap = MetaStore.getMetaObjectsMap()
    const allTargets = new Set()
    return linkDetails
      .map(detail => {
        const targetMetaId = detail.sourceId === rootMetaId ? detail.targetId : detail.sourceId
        if (allTargets.has(targetMetaId)) return
        const targetType = objectMap.get(targetMetaId)?.type
        if (targetType) {
          allTargets.add(targetMetaId)
          return {
            linkId: detail.id,
            targetMetaId,
            targetType
          }
        }
      })
      .filter(i => i)
  }, [linkIds, rootMetaId])
  const { t } = useTranslation()
  const groupedMetas = useMemo(() => {
    if (groupType === 'all') return allLinkWithMetas
    return allLinkWithMetas.filter(i => i.targetType === groupType)
  }, [groupType, allLinkWithMetas])
  const parentRef = useRef(null)
  return (
    <div className={'w-full flex flex-col pt-1.5'} ref={parentRef}>
      <div
        ref={ref}
        className={'gap-2 py-1 pl-0.5 flex flex-col flex-1 w-full h-full transition-all'}
        style={{
          minHeight: '100px'
        }}
      >
        {groupedMetas.length > 0 ? (
          <>
            {groupedMetas.map(i => (
              <RelatedItem metaId={i.targetMetaId} linkId={i.linkId} key={i.linkId} />
            ))}
          </>
        ) : (
          <div className={'transparent-font my-auto py-12 flex flex-col items-center justify-center gap-2'}>
            {t('general.Drop object here to add link')}
          </div>
        )}
      </div>
    </div>
  )
}
const RelatedItem = ({ metaId, linkId }: { metaId: number; linkId: number }) => {
  return (
    <Content flex column>
      <div className={'gap-3 font-size-13 flex justify-between items-center'}>
        <InlineObject
          onClick={() => {
            Global.layoutOps?.openObject(metaId)
          }}
          id={metaId}
        />
        <Icon
          size={15}
          name={Icons.Delete}
          className={'hover-active-button'}
          onClick={() => {
            MetaStore.deleteMetaLink(linkId)
          }}
        />
      </div>
    </Content>
  )
}
