import { CSSProperties, memo, useMemo, useRef, useState } from 'react'
import { GlobalInstance, useGlobalAtomValue } from '@/hooks'
import { indexedMetaLinksAtom, metaLinksAtom, metaObjectsAtom } from '@/api/stores/meta/meta.store'
import { useTranslation } from 'react-i18next'
import { globalStore, MetaStore } from '@/api/stores'
import { AnimatePopover, Button, Content, ContentEditor, Icon, IconWithPopover, TabPane, Tabs, WithBorder } from '@/components'
import { css } from '@emotion/css'
import FontSize from '@/consts/font'
import Colors from '@/consts/colors'
import { ClassName, MetaObject } from 'rendevoz'
import _ from 'lodash'
import Select from '@/components/base/select'
import { Rendevoz } from '@/core/rendevoz'
import { ObjectActionMenu, useDropObjectArea, useRenderObject } from '@/core'
import { MetaLink } from '~/typings'

export const RelatedPanel = memo(({ metaId, style }: { metaId: number; style?: CSSProperties }) => {
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
  const ref = useRef<HTMLElement>(null)
  const handleAddLink = (targetMetaId: number) => {
    const rootMetaId = metaId
    if (visibleTab === 'all') {
      MetaStore.addMetaLink(
        {
          sourceId: rootMetaId,
          targetId: targetMetaId
        },
        true
      )
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
  const { canDropAsMeta, isDragOver } = useDropObjectArea(ref, {
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
  const [groupType, setGroupType] = useState<'all' | MetaObject['type']>('all')
  const filterlinks = visibleTab === 'in' ? inboundLinkIds : visibleTab === 'out' ? outboundLinkIds : allLinkIds
  console.log(filterlinks)
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
    <Content
      flex
      column
      ref={ref}
      style={{
        ...style,
        boxShadow: isDragOver ? '0 0 0 2px var(--select-color)' : style?.boxShadow,
        transition: 'box-shadow 0.36s ease',
        borderRadius: isDragOver ? 4 : style?.borderRadius
      }}
      className={css({
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
              style={{ fontSize: '0.9rem', padding: '0px 6px', width: 120, height: 24 }}
              menuStyle={{
                fontSize: '13px',
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
          ) : null
        }
        defaultActiveKey={'all'}
        activeKey={visibleTab}
      >
        <TabPane
          key="all"
          tab={
            <Content flex gap={6}>
              <Icon name={'park-all-application'} />
              <div>{t('general.all')}</div>
            </Content>
          }
        >
          <RelatedGroup linkType={'all'} groupType={groupType} rootMetaId={metaId} linkIds={allLinkIds} />
        </TabPane>
        <TabPane
          tab={
            <Content flex gap={6}>
              <Icon name={'park-link-in'} />
              <div>{t('general.inbound links')}</div>
            </Content>
          }
          key={'in'}
        >
          <RelatedGroup linkType={'in'} groupType={groupType} rootMetaId={metaId} linkIds={inboundLinkIds} />
        </TabPane>
        <TabPane
          tab={
            <Content flex gap={6}>
              <Icon name={'park-link-out'} />
              <div>{t('general.outbound links')}</div>
            </Content>
          }
          key={'out'}
        >
          <RelatedGroup linkType={'out'} groupType={groupType} rootMetaId={metaId} linkIds={outboundLinkIds} />
        </TabPane>
      </Tabs>
    </Content>
  )
})
const RelatedGroup = ({
  linkIds,
  rootMetaId,
  groupType,
  linkType
}: {
  linkIds: number[]
  rootMetaId: number
  groupType: string
  linkType: 'in' | 'out' | 'all'
}) => {
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
  const createAndAddLink = () => {
    GlobalInstance.metaOps?.createObject().then(m => {
      if (linkType === 'all') {
        MetaStore.addMetaLink({
          sourceId: m.id,
          targetId: rootMetaId
        })
        MetaStore.addMetaLink({
          sourceId: rootMetaId,
          targetId: m.id
        })
      }
      if (linkType === 'in') {
        MetaStore.addMetaLink({
          sourceId: m.id,
          targetId: rootMetaId
        })
      }
      if (linkType === 'out') {
        MetaStore.addMetaLink({
          sourceId: rootMetaId,
          targetId: m.id
        })
      }
    })
  }
  return (
    <Content fullWidth ref={parentRef} fullHeight style={{ display: 'flex', flexDirection: 'column' }}>
      <Content
        flex
        column
        gap={4}
        ref={ref}
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          transition: 'all 0.2s ease',
          padding: '8px 6px 0px 4px',
          minHeight: '100px'
        }}
      >
        {groupedMetas.length > 0 ? (
          <>
            {groupedMetas.map(i => (
              <RelatedItem metaId={i.targetMetaId} linkId={i.linkId} key={i.linkId} />
            ))}
            <Button.IconButton
              className={'font-size-12 transparent-font'}
              text={t('general.New')}
              style={{
                marginBottom: 1,
                padding: '3px 6px',
                width: 'fit-content',
                minWidth: 140,
                maxWidth: '100%'
              }}
              icon={'park-plus'}
              onClick={createAndAddLink}
            />
          </>
        ) : (
          <Content
            flex
            column
            centered
            gap={6}
            className={'font-size-13 transparent-font'}
            style={{
              margin: 'auto'
            }}
          >
            {t('general.Drop object here to add link')}
            <Button.IconButton
              text={t('general.New')}
              icon={'park-plus'}
              onClick={createAndAddLink}
            />
          </Content>
        )}
      </Content>
    </Content>
  )
}
const RelatedItem = ({ metaId, linkId }: { metaId: number; linkId: number }) => {
  const { renderInline, metaObject } = useRenderObject({ metaObjectId: metaId })
  const { t } = useTranslation()
  const link = MetaStore.useMetaLinksMap().get(linkId)
  const [editName, setEditName] = useState(false)
  if (metaObject?.deleted || metaObject?.temp) return null
  return (
    <Content flex column>
      <Content flex gap={12} justifyContent={'space-between'} alignItems={'center'}>
        {renderInline({
          containerStyle: {
            fontSize: 13
          },
          onClick: () => {
            GlobalInstance.metaOps?.closeDetails()
            GlobalInstance.searchOps?.closeSearchPanel()
            GlobalInstance.layoutOps?.openObject(metaId)
          },
          ellipsisLine: 1
        })}
        <IconWithPopover
          className={ClassName.flatButton(4, '3px')}
          name={'park-more'}
          placement={['right', 'left']}
          closeOnContentClick={true}
          renderOnParent={false}
          content={setV => (
            <WithBorder onPointerEnter={e => e.stopPropagation()} onPointerMove={e => e.stopPropagation()} width={200}>
              <ObjectActionMenu
                onClose={() => setV(false)}
                onDeleteLink={() => {
                  MetaStore.deleteMetaLink(linkId, true)
                }}
                onEditLink={() => {
                  setEditName(true)
                }}
                metaObjectId={metaId}
                visibility={{
                  editLink: true,
                  deleteLink: true
                }}
              />
            </WithBorder>
          )}
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
