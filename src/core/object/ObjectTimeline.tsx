import { AnimatePopover, Button, Content, Icon, WithBorder } from '@/components'
import { globalStore, MetaStore, ObjectStore } from '@/api/stores'
import { CSSProperties, Fragment, memo, useEffect, useMemo, useRef, useState } from 'react'
import _ from 'lodash'
import { css } from '@emotion/css'
import { DateFormat } from '@/utils'
import { Colors, KEY } from '@/consts'
import { useRenderObject } from '@/core'
import { metaLinksAtom, metaObjectsAtom } from '@/api/stores/meta.store'
import { ClassName } from 'rendevoz'
import FontSize from '@/consts/font'
import { IWhiteboardEdge, IWhiteboardNode, MetaLink } from '~/typings'
import { Rendevoz } from '@/core/rendevoz'
import { useSelectGlobalAtomValue } from '@/hooks'
import { useTranslation } from 'react-i18next'
import BorderInput from '@/components/base/BorderInput'
import isHotkey from 'is-hotkey'
import { useUpdate } from 'react-use'
import dagre from '@dagrejs/dagre'
import { getEdgePosition } from '@/core/object/timelineToWhiteboard'
import Id from '@/utils/id'

const groupInterval = 10 * 24 * 60 * 60000
type TimelineProps = {
  startTime: number
  endTime: number
  specMetaId: number
  shouldGroupLinks: boolean
}
export const ObjectTimeline = ({
  startTime = Number.MIN_SAFE_INTEGER,
  endTime = Number.MAX_SAFE_INTEGER,
  specMetaId,
  shouldGroupLinks = true
}: TimelineProps) => {
  const allObjects = MetaStore.useMetaObjectsMap()
  const allLinks = MetaStore.useMetaLinksMap()

  // grouped by time interval
  const grouped = useMemo(() => {
    let groupable: any[]
    if (specMetaId) {
      // first get depth 1 links, then get depth 2 links (like pdf => pdf label => note, get pdf)
      const index = MetaStore.getIndexedMetaLinks()
      const objectMap = MetaStore.getMetaObjectsMap()
      if (!index) return
      const { sourceIdToLinkIdsMap, targetIdToLinkIdMap } = index
      const linkMap = MetaStore.getMetaLinksMap()
      const sourceToLinks = Array.from(sourceIdToLinkIdsMap.get(specMetaId)?.values() || [])
      const targetToLinks = Array.from(targetIdToLinkIdMap.get(specMetaId)?.values() || [])
      const sourceToDepth2Links = sourceToLinks.flatMap(l => {
        const link = linkMap.get(l)
        if (!link) return []
        const depth2links = sourceIdToLinkIdsMap.get(link.targetId)
        return Array.from(depth2links?.values() || [])
      })
      const targetToDepth2Links = targetToLinks.flatMap(l => {
        const link = linkMap.get(l)
        if (!link) return []
        const depth2links = targetIdToLinkIdMap.get(link.sourceId)
        return Array.from(depth2links?.values() || [])
      })
      // depth 1 links
      const relatedLinks = [...sourceToLinks, ...sourceToDepth2Links, ...targetToLinks, ...targetToDepth2Links]
      const allLinksTime = relatedLinks.map(i => {
        const link = linkMap.get(i)
        if (!link) return
        return { type: 'link', id: i, time: link.createdAt, source: objectMap.get(link.sourceId), target: objectMap.get(link.targetId) }
      })
      groupable = [...allLinksTime, { type: 'object', id: specMetaId, time: objectMap.get(specMetaId)!.createdAt }].filter(
        i => i && i.time >= startTime && i.time <= endTime
      )
    } else {
      const allObjectsTime = Array.from(allObjects.values()).map(i => ({ type: 'object', id: i.id, time: i.createdAt }))
      const allLinksTime = Array.from(allLinks.values()).map(i => ({ type: 'link', id: i.id, time: i.createdAt }))
      groupable = [...allObjectsTime, ...allLinksTime].filter(i => i.time >= startTime && i.time <= endTime)
    }
    let groupTime: number | null = null

    const sortedGroupable = _.sortBy(groupable, i => i.time)
    const grouped = _.groupBy(sortedGroupable, i => {
      const time = i.time
      if (!groupTime) {
        groupTime = time + groupInterval
      }
      return time - groupTime <= groupInterval ? groupTime : (groupTime = time)
    })
    return grouped
  }, [allObjects, allLinks, specMetaId])
  if (!grouped) return
  return (
    <Content flex column fullWidth fullHeight style={{ overflowY: 'auto' }}>
      {Object.entries(grouped).map(entry => (
        <TimelineItem items={entry[1]} time={Number(entry[0])} key={entry[0]} specMetaId={specMetaId} />
      ))}
    </Content>
  )
}

// group info by time period (10min? or 5min?)
type TimelineItemProps = {
  items: (
    | {
        type: 'object'
        id: number
      }
    | {
        type: 'link'
        id: number
      }
  )[]
  specMetaId?: number
  time: number
}

const barClazz = css({
  ':after': {
    content: '""',
    background: Colors.Background.Border,
    height: 'calc(100% - 20px)',
    position: 'absolute',
    left: 0,
    top: 20,
    right: 0,
    width: 3,
    marginLeft: 'auto',
    marginRight: 'auto',
    zIndex: -1
  }
})
const TimelineBar = memo(({ count }: { count: number }) => {
  return (
    <div className={barClazz} style={{ display: 'flex', width: '100px', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          color: 'white',
          background: 'rgb(11, 107, 233)',
          fontSize: 11,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
          fontWeight: 600
        }}
      >
        <div>{count}</div>
      </div>
    </div>
  )
})

type LinkGroup = {
  sourceMetaId?: number
  targetMetaId?: number
  includedLinkIds: Set<number>
}

export const TimelineItem = ({ time, items, specMetaId }: TimelineItemProps) => {
  const allLinks = MetaStore.useMetaLinksMap()
  // group links here
  // group type:
  // n => 1, same target id, targetToLinkIdSetMap
  // 1 => n, same source id, sourceToLinkIdSetMap
  // 1 => n => 1 ok
  const { linkGroup, realItems } = useMemo(() => {
    const linkMap = MetaStore.getMetaLinksMap()
    const links = items.filter(i => i.type === 'link')
    const sourceToLinkMap = new Map<number, number>()
    const sourceToLinkIdSetMap = new Map<number, Set<number>>()
    const targetToLinkIdSetMap = new Map<number, Set<number>>()
    links.forEach(i => {
      const link = linkMap.get(i.id)
      if (!link) return
      const idSet = sourceToLinkIdSetMap.get(link.sourceId) || new Set()
      idSet.add(link.id)
      sourceToLinkIdSetMap.set(link.sourceId, idSet)
      const secondIdSet = targetToLinkIdSetMap.get(link.targetId) || new Set()
      secondIdSet.add(link.id)
      targetToLinkIdSetMap.set(link.targetId, secondIdSet)
      sourceToLinkMap.set(link.sourceId, link.id)
    })
    let linkGroups: LinkGroup[] = []
    targetToLinkIdSetMap.forEach((v, k) => {
      const linkGroup: LinkGroup = {
        targetMetaId: k,
        includedLinkIds: v
      }
      linkGroups.push(linkGroup)
    })
    // combine groups
    // maybe 1 => n, and n split to 2 and 3, then 2 => 1, 3 => 1
    // so we need to reverse find
    // tainted: sourceId => tainted link ids
    const taintedSources = new Map<number, Set<number>>()
    linkGroups.forEach(group => {
      if (group.targetMetaId) {
        const included = group.includedLinkIds
        const size = included.size
        const maybeCombinableSources = Array.from(sourceToLinkIdSetMap.entries()).filter(i => i[1].size >= size)
        const maybeLinkTargets = new Set([
          ...Array.from(included.values())
            .map(i => linkMap.get(i)?.sourceId)
            .filter(i => i)
        ]) as Set<number>
        maybeCombinableSources.find(source => {
          const sourceToLinks = source[1]
          const linkData = Array.from(sourceToLinks.values()).map(id => linkMap.get(id))
          const maybeTaintedLinks = linkData.filter(link => link && maybeLinkTargets.has(link.targetId)) as MetaLink[]
          if (maybeTaintedLinks.length) {
            const tainted = taintedSources.get(source[0]) || new Set()
            maybeTaintedLinks.forEach(l => {
              tainted.add(l.id)
              group.includedLinkIds.add(l.id)
              group.sourceMetaId = source[0]
            })
            taintedSources.set(source[0], tainted)
            return true
          }
          return false
        })
      }
    })

    sourceToLinkIdSetMap.forEach((v, k) => {
      if (taintedSources.has(k)) {
        taintedSources.get(k)?.forEach(i => {
          v.delete(i)
        })
        if (v.size > 1) {
          linkGroups.push({
            sourceMetaId: k,
            includedLinkIds: v
          })
        }
      } else {
        if (v.size > 1) {
          linkGroups.push({
            sourceMetaId: k,
            includedLinkIds: v
          })
        }
      }
    })
    linkGroups = linkGroups.filter(i => {
      if (!i.sourceMetaId && i.includedLinkIds.size === 1) {
        return false
      }
      return true
    })
    if (linkGroups.length) {
      console.log(linkGroups)
    }
    const linkGroup = linkGroups.filter(group => {
      if (!specMetaId) return true
      if (group.targetMetaId !== specMetaId && group.sourceMetaId !== specMetaId) return false
      return true
    })
    const realItems = items.filter(i => {
      if (i.type === 'object') return true
      if (linkGroup.some(p => p.includedLinkIds.has(i.id))) return false
      if (specMetaId && i.type === 'link') {
        const link = linkMap.get(i.id)
        if (!link) return false
        if (link.sourceId !== specMetaId && link.targetId !== specMetaId) return false
        return true
      }
      return true
    })
    return { linkGroup, realItems }
  }, [items, allLinks])
  const handleGetWhiteboard = () => {
    const input = {
      nodes: [],
      links: []
    }
    const linkMap = MetaStore.getMetaLinksMap()
    const nodesSet = new Set<number>()
    items.forEach(i => {
      // if (i.type === 'object') {
      //   nodesSet.add(i.id)
      // }
      if (i.type === 'link') {
        const link = linkMap.get(i.id)
        if (!link) return
        nodesSet.add(link.sourceId)
        nodesSet.add(link.targetId)
        input.links.push({
          id: link.id,
          source: String(link.sourceId),
          target: String(link.targetId)
        })
      }
    })

    input.nodes = Array.from(nodesSet.values()).map(i => ({
      id: String(i)
    }))
    const graph = new dagre.graphlib.Graph()
    graph.setGraph({
      nodesep: 100,
      ranksep: 600,
      align: 'UR',
      rankdir: 'LR'
    })
    const objectMap = MetaStore.getMetaObjectsMap()
    graph.setDefaultEdgeLabel(() => ({}))
    input.nodes.forEach(i => {
      const meta = objectMap.get(Number(i.id))
      if (!meta) return
      let height = 80
      if (meta.type === 'webpage') {
        height += 20
      }
      if (meta.name) {
        const extraLines = Math.floor(meta.name.length / 50)
        if (extraLines) {
          height += 26 * extraLines
        }
      }
      if (meta.coverImgSrc) {
        height += 380
      }
      if (meta.description) {
        const descLength = meta.description.length
        const lines = Math.min(Math.floor(descLength / 63) + 1, 4)
        // 4 -> 94
        // 3 -> 70
        height += lines * 24
      }
      if (meta.fromObject) {
        height += 20
      }
      graph.setNode(i.id, { label: i.id, width: 450, height })
    })
    input.links.forEach(l => graph.setEdge(l.source, l.target))
    const sourceTargetToLinkMap = new Map(input.links.map(l => [`${l.source}_${l.target}`, l.id]))
    dagre.layout(graph)
    // metaId => whiteboard node
    const registeredWhiteboardNodes = new Map<number, IWhiteboardNode>()
    const usedEdgeIds = new Set<number>()
    const edges: IWhiteboardEdge[] = []
    graph.nodes().forEach(v => {
      const node = graph.node(v)
      if (!node) return
      const registeredNode = registeredWhiteboardNodes.get(Number(node.label)) || {
        type: 'metaObject',
        width: 450,
        metaObjectId: Number(node.label),
        id: Id.getId(),
        x: node.x,
        y: node.y
      }
      registeredWhiteboardNodes.set(Number(node.label), registeredNode)
      const inEdges = graph.inEdges(v)
      const outEdges = graph.outEdges(v)
      inEdges?.forEach(e => {
        const source = graph.node(e.v)
        if (!source) return
        const sourceRegistered = registeredWhiteboardNodes.get(Number(source.label)) || {
          type: 'metaObject',
          width: 450,
          metaObjectId: Number(source.label),
          id: Id.getId(),
          x: source.x,
          y: source.y
        }
        registeredWhiteboardNodes.set(Number(source.label), sourceRegistered)
        const edgePos = getEdgePosition(
          {
            left: source.x,
            top: source.y,
            width: source.width,
            height: source.height
          },
          {
            left: node.x,
            top: node.y,
            width: node.width,
            height: node.height
          }
        )
        if (!edgePos) return
        const edgeId = sourceTargetToLinkMap.get(`${e.v}_${e.w}`)
        if (!edgeId) return
        if (edgeId) {
          if (usedEdgeIds.has(edgeId)) return
          usedEdgeIds.add(edgeId)
        }
        const metaLink = linkMap.get(edgeId)
        if (!metaLink) return
        const link: IWhiteboardEdge = {
          id: Id.getId(),
          sourcePosition: edgePos.sourcePos,
          targetPosition: edgePos.targetPos,
          sourceId: sourceRegistered.id,
          targetId: registeredNode.id,
          label: DateFormat.format(metaLink.createdAt, DateFormat.Formats.withMinute)
        }
        edges.push(link)
      })
      outEdges?.forEach(e => {
        const target = graph.node(e.w)
        if (!target) return
        const targetRegistered = registeredWhiteboardNodes.get(Number(target.label)) || {
          type: 'metaObject',
          width: 450,
          metaObjectId: Number(target.label),
          id: Id.getId(),
          x: target.x,
          y: target.y
        }
        registeredWhiteboardNodes.set(Number(target.label), targetRegistered)
        const edgePos = getEdgePosition(
          {
            left: node.x,
            top: node.y,
            width: node.width,
            height: node.height
          },
          {
            left: target.x,
            top: target.y,
            width: target.width,
            height: target.height
          }
        )
        if (!edgePos) return
        const edgeId = sourceTargetToLinkMap.get(`${e.v}_${e.w}`)
        if (!edgeId) return
        if (edgeId) {
          if (usedEdgeIds.has(edgeId)) return
          usedEdgeIds.add(edgeId)
        }
        const metaLink = linkMap.get(edgeId)
        if (!metaLink) return
        const link: IWhiteboardEdge = {
          id: Id.getId(),
          sourcePosition: edgePos.sourcePos,
          targetPosition: edgePos.targetPos,
          sourceId: registeredNode.id,
          targetId: targetRegistered.id,
          label: DateFormat.format(metaLink.createdAt, DateFormat.Formats.withMinute)
        }
        edges.push(link)
      })
    })

    ObjectStore('whiteboard')
      .addOneWithMeta(
        {
          edges: new Map(edges.map(i => [i.id, i])),
          nodes: new Map(Array.from(registeredWhiteboardNodes.values()).map(i => [i.id, i]))
        },
        {
          currentMeta: {
            name: 'timeline whiteboard'
          }
        }
      )
      .then(one => {
        Rendevoz.Actions.Open.Whiteboard.openWhiteboard(one.one.id)
      })
  }
  return (
    <Content flex>
      <TimelineBar count={items.length} />
      <div style={{ marginTop: -7, paddingBottom: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div onClick={() => handleGetWhiteboard()}>get whiteboard</div>
        <div style={{ position: 'sticky', top: 0 }} className={ClassName.description(FontSize['12px'])}>
          {DateFormat.format(time, DateFormat.Formats.withMinute)}
        </div>
        {realItems.map(i => (
          <Fragment key={i.id}>
            {i.type === 'link' && <LinkRenderer linkId={i.id} />}
            {i.type === 'object' && <ObjectRenderer renderIcon objectId={i.id} />}
          </Fragment>
        ))}
        {linkGroup.map(i => (
          <LinkGroupRenderer linkGroup={i} key={i.sourceMetaId} />
        ))}
      </div>
    </Content>
  )
}

const LinkGroupRenderer = ({ linkGroup }: { linkGroup: LinkGroup }) => {
  const includedLinks = Array.from(linkGroup.includedLinkIds.values())
  if (!linkGroup.sourceMetaId && !linkGroup.targetMetaId) return null
  return (
    <Content
      flex
      column
      style={{
        position: 'relative',
        padding: '6px 12px',
        borderRadius: 6,
        background: Colors.Background.ButtonHover,
        width: 'fit-content'
      }}
    >
      {/*<ObjectRenderer objectId={linkGroup.sourceMetaId} renderIcon={true} />*/}
      {includedLinks.map((i, idx, arr) => (
        <LinkRenderer
          linkId={i}
          key={i}
          renderSource={idx === 0 || !linkGroup.sourceMetaId}
          containerStyle={{
            position: 'relative',
            padding: 0,
            borderRadius: 0,
            background: undefined,
            width: '100%'
          }}
          includedLinks={idx === arr.length - 1 ? includedLinks : undefined}
          renderTarget={id => id !== linkGroup.targetMetaId || !!(idx === arr.length - 1 && linkGroup.targetMetaId)}
          targetStyle={
            idx === arr.length - 1
              ? {
                  marginLeft: 32
                }
              : undefined
          }
        />
      ))}
    </Content>
  )
}

const ObjectRenderer = ({ objectId, renderIcon }: { objectId: number; renderIcon: boolean }) => {
  const { renderInline, metaObject } = useRenderObject({ metaObjectId: objectId })
  if (renderIcon && metaObject) {
    return (
      <Content flex gap={4}>
        <Icon name={Rendevoz.Utils.Object.getMetaObjectIcon(metaObject.type)} />
        {renderInline({ ellipsisLine: 1, showHoverObjectDetails: true })}
      </Content>
    )
  }
  return renderInline({ ellipsisLine: 1, showHoverObjectDetails: true })
}

const LinkRenderer = ({
  linkId,
  renderSource = true,
  renderTarget = () => true,
  containerStyle,
  targetStyle,
  includedLinks
}: {
  linkId: number
  renderSource?: boolean
  renderTarget?: (targetId: number) => boolean
  containerStyle?: CSSProperties
  targetStyle?: CSSProperties
  includedLinks?: number[]
}) => {
  const link = useSelectGlobalAtomValue(metaLinksAtom, s => s.get(linkId))
  const info = useMemo(() => {
    const link = globalStore.get(metaLinksAtom).get(linkId)
    if (link) {
      const source = globalStore.get(metaObjectsAtom).get(link.sourceId)
      const target = globalStore.get(metaObjectsAtom).get(link.targetId)
      return {
        source,
        target
      }
    }
  }, [linkId])

  const includedLabels = useMemo(() => {
    if (includedLinks && link) {
      const map = MetaStore.getMetaLinksMap()
      const objectMap = MetaStore.getMetaObjectsMap()
      const labels = includedLinks
        .map(i => {
          const link = map.get(i)
          if (!link) return
          return {
            id: i,
            source: objectMap.get(link.sourceId)?.name,
            label: link.label,
            targetId: link.targetId
          }
        })
        .filter(i => i && i.targetId === link.targetId)
      return labels
    }
  }, [includedLinks])
  if (!link) return null
  if (renderSource === false && info?.target && renderTarget(info.target.id) === false) return null
  if (info?.source && info?.target) {
    return (
      <div
        style={{
          position: 'relative',
          padding: '6px 12px',
          borderRadius: 6,
          background: Colors.Background.ButtonHover,
          width: 'fit-content',
          ...containerStyle
        }}
      >
        {renderSource && (
          <>
            <Content flex gap={6}>
              <Icon
                name="park-link"
                containerStyle={{
                  background: 'rgb(11, 107, 233)',
                  borderRadius: '50%',
                  padding: 2,
                  cursor: 'pointer',
                  position: 'absolute',
                  left: -72
                }}
              />
              <div>
                <ObjectRenderer objectId={info.source.id} />
              </div>
            </Content>
          </>
        )}
        {!includedLinks && link.label && (
          <div
            className={ClassName.description(FontSize['12px'])}
            style={{
              marginLeft: (targetStyle?.marginLeft || 10) + 20,
              marginBottom: -4,
              textTransform: 'none',
              border: `1px solid ${Colors.Background.Border}`,
              padding: '4px 12px 4px 4px',
              borderRadius: 8,
              width: 'fit-content'
            }}
          >
            <div style={{ fontSize: 11 }}>来源于 {info.source.name}:</div>
            <div style={{ textTransform: 'none', color: Colors.Font.Primary }}>{link.label}</div>
          </div>
        )}
        {includedLabels && (
          <div
            style={{
              marginLeft: (targetStyle?.marginLeft || 10) + 20,
              marginBottom: -4,
              border: `1px solid ${Colors.Background.Border}`,
              padding: '4px 12px 4px 4px',
              borderRadius: 8,
              width: 'fit-content'
            }}
            className={ClassName.description(FontSize['12px'])}
          >
            {includedLabels.map(
              i =>
                i?.label && (
                  <div style={{ textTransform: 'none' }} key={i.id}>
                    <div style={{ fontSize: 11 }}>来源于 {i.source}:</div>
                    <div style={{ textTransform: 'none', color: Colors.Font.Primary }}>{i.label}</div>
                  </div>
                )
            )}
          </div>
        )}
        {renderTarget(info.target.id) && (
          <>
            <div style={{ position: 'relative', marginLeft: 10, marginTop: 4, ...targetStyle }}>
              <AnimatePopover content={<LinkActionMenu linkId={linkId} includedLinks={includedLinks} />}>
                <svg
                  width={16}
                  style={{ position: 'absolute', top: 'calc(50% - 4px)', transform: 'translateY(-50%)', left: 0, cursor: 'pointer' }}
                  viewBox="0 0 28 22"
                >
                  <path strokeWidth={2} fill="none" d={'M0,0 Q0,16 16,16 L28,16 M18,10 L 28,16 L 18,22'} stroke={'currentColor'} />
                </svg>
              </AnimatePopover>
              <div
                style={{ position: 'absolute', left: 0, top: 0, width: 1, height: 'calc(50% - 10px)', background: Colors.Font.Primary }}
              ></div>
              <div style={{ paddingLeft: 21 }}>
                <ObjectRenderer objectId={info.target.id} />
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  return null
}

const LinkActionMenu = ({ linkId, includedLinks }: { linkId: number; includedLinks?: number[] }) => {
  const { t } = useTranslation()
  const [currentSelectLink, setCurrentSelectLink] = useState<MetaLink>()

  const includedAllLinks = useMemo(() => {
    if (!includedLinks) return

    const linkMap = MetaStore.getMetaLinksMap()
    const myLink = linkMap.get(linkId)!
    const objectMap = MetaStore.getMetaObjectsMap()
    const allLinks = includedLinks.map(l => {
      const link = linkMap.get(l)
      if (!link) return
      if (link.targetId !== myLink.targetId) return
      const realLink = {
        ...link,
        target: objectMap.get(link.targetId),
        source: objectMap.get(link.sourceId)
      }
      return realLink
    })
    return allLinks
  }, [includedLinks?.length])
  useEffect(() => {
    forceRender()
  }, [])
  const forceRender = useUpdate()
  const parentEleRef = useRef<HTMLDivElement>(null)
  return (
    <WithBorder padding={6} ref={parentEleRef}>
      {currentSelectLink ? (
        <BorderInput
          textarea={false}
          defaultValue={currentSelectLink.label}
          onKeyDown={e => {
            if (isHotkey(KEY.Enter, e)) {
              MetaStore.updateMetaLink({ id: currentSelectLink.id, label: e.target.value }, true)
            }
          }}
          placeholder="Change Link's Label"
        />
      ) : (
        <>
          {includedLinks && includedAllLinks ? (
            <AnimatePopover
              parentElement={parentEleRef.current}
              content={
                <WithBorder padding={6}>
                  <div>Choose One Link</div>
                  {includedAllLinks.map(
                    i =>
                      i && (
                        <div key={i.id} onClick={() => setCurrentSelectLink(i)}>
                          {i.source?.name}
                        </div>
                      )
                  )}
                </WithBorder>
              }
            >
              <Button.IconButton text={t('general.edit link label')} icon="park-edit" suffixIcon={'park-right'} />
            </AnimatePopover>
          ) : (
            <Button.IconButton
              text={t('general.edit link label')}
              icon="park-edit"
              onClick={() => setCurrentSelectLink(MetaStore.getMetaLinksMap().get(linkId))}
            />
          )}
          {includedLinks && includedAllLinks ? (
            <AnimatePopover
              parentElement={parentEleRef.current}
              content={
                <WithBorder padding={6}>
                  <div>Choose One Link</div>
                  {includedAllLinks.map(
                    i =>
                      i && (
                        <div
                          onClick={() => {
                            MetaStore.deleteMetaLink(i.id)
                          }}
                          key={i?.id}
                        >
                          {i?.source?.name}
                        </div>
                      )
                  )}
                </WithBorder>
              }
            >
              <Button.IconButton text={t('general.delete')} icon="park-delete" dangerous suffixIcon={'park-right'} />
            </AnimatePopover>
          ) : (
            <Button.IconButton
              text={t('general.delete')}
              icon="park-delete"
              dangerous
              onClick={() => {
                MetaStore.deleteMetaLink(linkId)
              }}
            />
          )}
        </>
      )}
    </WithBorder>
  )
}
