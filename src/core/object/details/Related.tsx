import { memo, useMemo, useRef, useState } from 'react'
import { GlobalInstance, useGlobalAtomValue } from '@/hooks'
import { indexedMetaLinksAtom, metaLinksAtom, metaObjectsAtom } from '@/stores/meta.store'
import { useTranslation } from 'react-i18next'
import { globalStore, MetaStore } from '@/stores'
import { Button, Content, ContentEditor, Icon, IconWithPopover, TabPane, Tabs, WithBorder } from '@/components'
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
  }, [metaId, indexed])
  const [visibleTab, setVisibleTab] = useState<'out' | 'in' | 'all'>('all')

  return (
    <Content
      flex
      column
      onClick={e => {
        e.stopPropagation()
        e.preventDefault()
      }}
      className={css({
        minHeight: '100%',
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
        tabNavContainerStyle={{
          paddingBottom: 6,
          borderBottom: `1px solid ${Colors.Background.Border}`
        }}
        defaultActiveKey={'all'}
        activeKey={visibleTab}
      >
        <TabPane
          key="all"
          style={{
            paddingTop: 6
          }}
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
          style={{
            paddingTop: 6
          }}
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
          style={{
            paddingTop: 6
          }}
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
  const { canDropAsMeta, isDragging } = useDropObjectArea(ref, {
    onDrop: async element => {
      let metaId
      if (canDropAsMeta) {
        metaId = (await GlobalInstance.metaOps?.addDraggableAsMeta(element))?.id
      }
      if (element.type === 'metaElement') {
        metaId = element.metaId
      }
      if (!metaId) return
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
  return (
    <Content fullWidth fullHeight style={{ padding: '0px 8px 12px 0px', display: 'flex', flexDirection: 'column' }}>
      <Select
        value={groupType}
        closeOnSelect={true}
        onSelect={v => setGroupType(v[0])}
        style={{ fontSize: '0.9rem', marginBottom: 10, border: `1px solid ${Colors.Background.Border}` }}
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
      <Content
        ref={ref}
        style={{
          overflowY: 'auto',
          flex: 1,
          width: '100%',
          height: '100%',
          background: isDragging ? Colors.Common.SelectColorTransparent : undefined,
          transition: 'all 0.2s ease'
        }}
      >
        {groupedMetas.map(i => (
          <RelatedItem metaId={i.targetMetaId} linkId={i.linkId} key={i.linkId} />
        ))}
      </Content>
    </Content>
  )
}
const RelatedItem = ({ metaId, linkId }: { metaId: number; linkId: number }) => {
  const { renderWhole, renderTags, renderTitle } = useRenderObject({ metaObjectId: metaId })
  const { t } = useTranslation()
  const link = MetaStore.useMetaLinksMap().get(linkId)
  const [editName, setEditName] = useState(false)
  return (
    <Content flex column style={{ padding: '8px 2px' }}>
      <IconWithPopover
        containerStyle={{
          position: 'absolute',
          top: 0,
          right: 0,
          zIndex: 10
        }}
        className={ClassName.circleButton(2)}
        name={'park-more'}
        closeOnContentClick={true}
        content={
          <WithBorder padding={6} style={{ fontSize: 14 }}>
            <Button.IconButton
              text={t('general.Edit link')}
              icon={'park-edit'}
              onClick={() => {
                setEditName(true)
              }}
            />
            <Button.IconButton icon={'park-delete'} dangerous text={t('general.Delete link')} />
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
              onClick={() => {
                setEditName(true)
              }}
            />
          </WithBorder>
        }
      ></IconWithPopover>
      {renderTags({})}
      {renderTitle({
        style: {
          fontSize: 13
        }
      })}
      {editName ? (
        <ContentEditor
          placeholder={"Edit link's name"}
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
