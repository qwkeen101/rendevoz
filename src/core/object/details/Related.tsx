import { memo, useMemo, useRef, useState } from 'react'
import { GlobalInstance, useGlobalAtomValue } from '@/hooks'
import { indexedMetaLinksAtom, metaLinksAtom, metaObjectsAtom } from '@/stores/meta.store'
import { useTranslation } from 'react-i18next'
import { globalStore, MetaStore } from '@/stores'
import { AnimatePopover, Button, Content, ContentEditor, Icon, IconWithPopover, TabPane, Tabs, WithBorder } from '@/components'
import { css } from '@emotion/css'
import FontSize from '@/consts/font'
import Colors from '@/consts/colors'
import { ClassName, MetaObject } from 'rendevoz'
import _ from 'lodash'
import Select from '@/components/base/select'
import { Rendevoz } from '@/core/rendevoz'
import { DraggableElement, useDropObjectArea, useRenderObject } from '@/core'
import { MetaLink } from '~/typings'
import useDropObject from '@/core/global/globalDragOverlay/useDropObject'
import MetaFilterer from '@/core/object/filter/MetaFilterer'
import HoverObjectDetails from '@/core/object/HoverObjectDetails'

export const RelatedPanel = memo(({ metaId }: { metaId: number }) => {
  const indexed = useGlobalAtomValue(indexedMetaLinksAtom)
  const sourceToTarget = useGlobalAtomValue(indexedMetaLinksAtom)?.sourceIdToLinkIdsMap.get(metaId)
  const targetToSource = useGlobalAtomValue(indexedMetaLinksAtom)?.targetIdToLinkIdMap.get(metaId)

  const { t } = useTranslation()

  const { allLinkIds, inboundLinkIds, outboundLinkIds } = useMemo(() => {
    const inboundLinkIds = Array.from(targetToSource?.values() || [])
    const outboundLinkIds = Array.from(sourceToTarget?.values() || [])
    const allLinkIds = [...inboundLinkIds, ...outboundLinkIds]

    return {
      inboundLinkIds,
      outboundLinkIds,
      allLinkIds
    }
  }, [metaId, indexed, sourceToTarget, targetToSource])
  const [visibleTab, setVisibleTab] = useState<'out' | 'in' | 'all'>('all')

  return (
    <Content
      flex
      column
      className={css({
        maxHeight: '600px',
        height: '100%',
        overflowY: 'auto',
        minWidth: '100%',
        maxWidth: 500
        // width: '300px'
      })}
    >
      <Tabs
        tabNavStyle={{
          fontSize: FontSize['12px'],
          padding: '2px 8px'
        }}
        defaultActiveKey={'all'}
        activeKey={visibleTab}
      >
        <TabPane
          key="all"
          onClick={() => setVisibleTab('all')}
          tab={
            <Content flex gap={6}>
              <Icon name={'park-all-application'} />
              <div>{t('general.all')}</div>
            </Content>
          }
        >
          <RelatedGroup direction={'all'} rootMetaId={metaId} linkIds={allLinkIds} />
        </TabPane>
        <TabPane
          onClick={() => setVisibleTab('in')}
          tab={
            <Content flex gap={6}>
              <Icon name={'park-link-in'} />
              <div>{t('general.inbound links')}</div>
            </Content>
          }
          key={'in'}
        >
          <RelatedGroup direction={'in'} rootMetaId={metaId} linkIds={inboundLinkIds} />
        </TabPane>
        <TabPane
          onClick={() => setVisibleTab('out')}
          tab={
            <Content flex gap={6}>
              <Icon name={'park-link-out'} />
              <div>{t('general.outbound links')}</div>
            </Content>
          }
          key={'out'}
        >
          <RelatedGroup direction={'out'} rootMetaId={metaId} linkIds={outboundLinkIds} />
        </TabPane>
      </Tabs>
    </Content>
  )
})
const RelatedGroup = ({ linkIds, rootMetaId, direction }: { direction: 'all' | 'in' | 'out'; linkIds: number[]; rootMetaId: number }) => {
  const [groupType, setGroupType] = useState<'all' | MetaObject['type']>('all')
  const ref = useRef(null)
  const handleAddLink = (metaId: number) => {
    if (direction === 'all') {
      MetaStore.addMetaLink(
        {
          sourceId: rootMetaId,
          targetId: metaId
        },
        true
      )
      MetaStore.addMetaLink({
        sourceId: metaId,
        targetId: rootMetaId
      })
    }
    if (direction === 'in') {
      MetaStore.addMetaLink({
        sourceId: metaId,
        targetId: rootMetaId
      })
    }
    if (direction === 'out') {
      MetaStore.addMetaLink({
        sourceId: rootMetaId,
        targetId: metaId
      })
    }
  }
  const { canDropAsMeta, isDragging } = useDropObjectArea(ref, {
    onDrop: async element => {
      let metaId
      if (canDropAsMeta.droppable) {
        metaId = (await GlobalInstance.metaOps?.addDraggableAsMeta(element))?.id
      }
      if (canDropAsMeta.existed) {
        metaId = canDropAsMeta.metaId
      }
      if (element.type === 'metaElement') {
        metaId = element.metaId
      }
      if (!metaId) return
      handleAddLink(metaId)
    }
  })
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
  const types = useMemo(() => {
    return Object.keys(_.groupBy(allLinkWithMetas, m => m.targetType))
  }, [allLinkWithMetas])
  const groupedMetas = useMemo(() => {
    if (groupType === 'all') return allLinkWithMetas
    return allLinkWithMetas.filter(i => i.targetType === groupType)
  }, [groupType, allLinkWithMetas])
  const { t } = useTranslation()
  const parentRef = useRef(null)
  return (
    <Content fullWidth ref={parentRef} fullHeight style={{ display: 'flex', flexDirection: 'column' }}>
      <Content
        flex
        column
        gap={8}
        ref={ref}
        style={{
          overflowY: 'auto',
          flex: 1,
          width: '100%',
          height: '100%',
          background: isDragging ? Colors.Common.SelectColorTransparent : undefined,
          transition: 'all 0.2s ease',
          padding: '8px 6px 0px 4px',
          minHeight: '200px'
        }}
      >
        {groupedMetas.map(i => (
          <RelatedItem metaId={i.targetMetaId} linkId={i.linkId} key={i.linkId} />
        ))}

        <Content
          flex
          gap={4}
          alignItems={'center'}
          style={{ fontSize: 13, width: '100%', color: Colors.Font.Transparent, lineHeight: 1.2, marginTop: 'auto' }}
        >
          <AnimatePopover
            closeOnClickOutside={true}
            positions={['top', 'bottom']}
            padding={6}
            content={setV => (
              <WithBorder padding={'4px 0px 4px 4px'}>
                <MetaFilterer
                  onChange={v => {
                    handleAddLink(v)
                    setV(false)
                  }}
                />
              </WithBorder>
            )}
          >
            <Button.IconButton style={{ border: `1px solid ${Colors.Background.Border}` }} text={'Select object'} />
          </AnimatePopover>
          <div style={{ marginRight: 'auto' }}>or drop here to add link.</div>
          <Select
            value={groupType}
            closeOnSelect={true}
            onSelect={v => setGroupType(v[0])}
            style={{ fontSize: '0.9rem', padding: '0px 6px', width: 160, height: 24 }}
            menuStyle={{
              fontSize: '0.9rem',
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
                children: Rendevoz.Utils.Meta.getTypeName(t),
                icon: Rendevoz.Utils.Object.getMetaObjectIcon(t)
              }))
            ]}
          />
        </Content>
      </Content>
    </Content>
  )
}
const RelatedItem = ({ metaId, linkId }: { metaId: number; linkId: number }) => {
  const { renderInline } = useRenderObject({ metaObjectId: metaId })
  const { t } = useTranslation()
  const link = MetaStore.useMetaLinksMap().get(linkId)
  const [editName, setEditName] = useState(false)
  return (
    <Content flex column>
      <Content flex gap={12} justifyContent={'space-between'} alignItems={'center'}>
        <HoverObjectDetails metaObjectId={metaId}>
          {renderInline({
            containerStyle: {
              fontSize: 14
            },
            ellipsisLine: 1
          })}
        </HoverObjectDetails>
        <IconWithPopover
          className={ClassName.circleButton(2)}
          name={'park-more'}
          closeOnContentClick={true}
          content={
            <WithBorder
              onPointerEnter={e => e.stopPropagation()}
              onPointerMove={e => e.stopPropagation()}
              width={160}
              padding={6}
              style={{ fontSize: 14 }}
            >
              <Button.IconButton
                text={t('general.Edit link')}
                icon={'park-edit'}
                onClick={() => {
                  setEditName(true)
                }}
              />
              <Button.IconButton
                icon={'park-unlink'}
                onClick={() => {
                  MetaStore.deleteMetaLink(linkId, true)
                }}
                dangerous
                text={t('general.Delete link')}
              />
              <Button.IconButton
                text={t('general.View details')}
                icon={'park-preview-open'}
                onClick={() => {
                  GlobalInstance.metaOps?.openDetails(metaId)
                }}
              />
              <Button.IconButton
                text={t('general.delete object')}
                icon={'park-delete'}
                dangerous
                onClick={() => {
                  setEditName(true)
                }}
              />
            </WithBorder>
          }
        ></IconWithPopover>
      </Content>

      {editName ? (
        <ContentEditor
          placeholder={"Edit link's name"}
          style={{
            marginTop: 6
          }}
          onChange={v => {
            MetaStore.updateMetaLink({ id: linkId, label: v }, true)
            setEditName(false)
          }}
          value={link?.label}
        />
      ) : (
        <div style={{ fontSize: 13, color: Colors.Font.Transparent }}>{link?.label}</div>
      )}
    </Content>
  )
}
