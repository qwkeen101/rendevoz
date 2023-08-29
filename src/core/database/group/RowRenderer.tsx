import { MetaStore } from '@/stores'
import { Colors } from '@/consts'
import { Rendevoz } from '@/core/rendevoz'
import { assignProperties, DateFormat } from '@/utils'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ClassName } from 'rendevoz'
import { useSelectAtomValue, useClickOutside } from '@/hooks'
import AutosizeTextarea from '@/components/custom/input/autosizeTextarea'
import { css } from '@emotion/css'
import { GroupAtomAtom, TableStateAtom } from '@/core/database/group/hooks/useTableState'
import { useGlobalIsDragging, useRenderObject } from '@/core'
import { Button, Content, Icon, Image, VirtualList, WithBorder } from '@/components'
import { useTableInstance } from '@/core/database/group/hooks/useTableInstance'
import useTableDrag from '@/core/database/group/hooks/useTableDrag'
import usePopoverCell from '@/core/database/group/hooks/usePopoverCell'
import Tag from '@/core/database/ObjectTag'
import MetaTagPicker from '@/core/database/MetaTagPicker'
import { Virtualizer } from '@tanstack/react-virtual'
import { MetaGroupChild, MetaObject } from '~/typings'
import InnerLabelsCell from '@/core/database/group/InnerLabelsCell'
import { InLinkCell, OutLinkCell } from '@/core/database/group/LinkCell'
import RelatedCell from '@/core/database/group/RelatedCell'
import { useAtomValue } from 'jotai'
import { PATH_TO_ELEMENT_MAP } from '@/core/database/group/hooks/weakmaps'
const rowClazz = css({
  ':hover': {
    background: Colors.Background.ButtonHover
  },
  transition: 'background 0.2s ease'
})
export const TableBodyRenderer = ({ value }: { value: MetaGroupChild[] }) => {
  const ref = useRef<HTMLDivElement>(null)
  const virtualizerRef = useRef<Virtualizer<any, any>>()
  const instance = useTableInstance()
  const headers = useSelectAtomValue(TableStateAtom, s => s.headers)
  assignProperties(instance, {
    scrollTable: movement => {
      if (movement.y !== 0 && movement.y !== undefined) {
        const v = virtualizerRef.current
        if (v) {
          v.scrollBy(movement.y, { behavior: 'auto' })
        }
      }
    }
  })
  const { renderTableHandle } = useTableDrag({ tableContainerRef: ref })
  // root layer, path is the first index
  return (
    <Content
      flex
      column
      fullHeight
      ref={ref}
      style={{
        width: headers.reduce((prev, curr) => prev + curr.width, 0) + 12
      }}
    >
      {renderTableHandle()}
      <VirtualList
        overscan={5}
        ref={virtualizerRef}
        estimateSize={30}
        items={value}
        style={{ width: '100%', height: '100%' }}
        renderItem={(i, idx, selected) => <RowWrapper rowDetails={i} key={i.id} path={[idx]} />}
      ></VirtualList>
    </Content>
  )
}
export const RowWrapper = ({ rowDetails, path }: { rowDetails: MetaGroupChild; path: number[] }) => {
  const headers = useSelectAtomValue(TableStateAtom, s => s.headers)
  const columns = useSelectAtomValue(TableStateAtom, s => s.headerColumn)
  const groupAtom = useAtomValue(GroupAtomAtom)
  const wrap = useSelectAtomValue(groupAtom, s => s?.tableProperties?.wrapColumns)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [globalDragging] = useGlobalIsDragging()
  const instance = useTableInstance()
  const [draggingIndicator, setDraggingIndicator] = useState<string>()
  const metaObject = MetaStore.useValue(rowDetails.id)
  const metaId = rowDetails.id
  useEffect(() => {
    PATH_TO_ELEMENT_MAP.get(instance)?.set(path.join(','), rowDetails)
  }, [...path])
  useEffect(() => {
    if (globalDragging) {
      const body = bodyRef.current
      if (body) {
        const pointermoveHandler = (e: PointerEvent) => {
          const bounding = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
          const { clientY } = e
          let position = 'top'
          if (bounding.top + bounding.height / 2 < clientY) {
            position = 'bottom'
          }
          position = 'inner'
          instance.setCurrentDragDetails?.({
            rowMetaId: metaId,
            position,
            path,
            rowNode: body
          })
          setDraggingIndicator(position)
        }
        const pointerleaveHandler = () => {
          setDraggingIndicator(undefined)
          instance.setCurrentDragDetails?.(undefined)
        }
        body.addEventListener('pointermove', pointermoveHandler)
        body.addEventListener('pointerleave', pointerleaveHandler)
        return () => {
          setDraggingIndicator(undefined)
          body.removeEventListener('pointerleave', pointerleaveHandler)
          body.removeEventListener('pointermove', pointermoveHandler)
        }
      }
    }
  }, [globalDragging])
  const renderIndicator = () => {
    if (draggingIndicator) {
      if (draggingIndicator === 'top') {
        return (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              pointerEvents: 'none',
              height: 4,
              background: 'rgba(35,131,226,0.43)'
            }}
          ></div>
        )
      } else {
        return (
          <div
            style={{
              position: 'absolute',
              bottom: -4,
              left: 0,
              pointerEvents: 'none',
              width: '100%',
              height: 4,
              background: 'rgba(35,131,226,0.43)'
            }}
          ></div>
        )
      }
    } else {
      return null
    }
  }
  if (!metaObject) return null
  const hasChildren = rowDetails.children?.length

  if (hasChildren) {
    return (
      <Content flex column>
        <div
          ref={bodyRef}
          style={{
            display: 'grid',
            position: 'relative',
            gridTemplateColumns: columns,
            borderBottom: `1px solid ${Colors.Background.Border}`
          }}
          className={rowClazz}
          onPointerEnter={e => {
            e.stopPropagation()
            instance.setDragHandle?.({
              element: rowDetails,
              node: bodyRef.current,
              path
            })
          }}
          onPointerMove={e => {
            e.stopPropagation()
            instance.setDragHandle?.({
              element: rowDetails,
              node: bodyRef.current,
              path
            })
          }}
          onPointerLeave={() => {
            setTimeout(() => {
              instance.removeDragHandle?.(path)
            }, 200)
          }}
        >
          {renderIndicator()}
          {headers.map(i => (
            <CellWrapper
              field={i.name}
              objectId={metaObject.objectId}
              value={metaObject[i.name]}
              type={metaObject.type}
              key={i.name}
              metaId={metaId}
              wrap={wrap}
              indent={path.length - 1}
              hasChildren={hasChildren}
              onToggle={() => instance.update?.({ toggled: !rowDetails.toggled }, path)}
            />
          ))}
        </div>
        {!rowDetails.toggled && rowDetails.children?.map((i, idx) => <RowWrapper rowDetails={i} path={[...path, idx]} />)}
      </Content>
    )
  }
  return (
    <div
      ref={bodyRef}
      style={{ display: 'grid', position: 'relative', gridTemplateColumns: columns, borderBottom: `1px solid ${Colors.Background.Border}` }}
      className={rowClazz}
      onPointerEnter={e => {
        e.stopPropagation()
        instance.setDragHandle?.({
          element: rowDetails,
          node: bodyRef.current,
          path
        })
      }}
      onPointerMove={e => {
        e.stopPropagation()
        instance.setDragHandle?.({
          element: rowDetails,
          node: bodyRef.current,
          path
        })
      }}
      onPointerLeave={() => {
        setTimeout(() => {
          instance.removeDragHandle?.(path)
        }, 200)
      }}
    >
      {renderIndicator()}
      {headers.map(i => (
        <CellWrapper
          field={i.name}
          objectId={metaObject.objectId}
          value={metaObject[i.name]}
          type={metaObject.type}
          key={i.name}
          metaId={metaId}
          wrap={wrap}
          indent={path.length - 1}
          hasChildren={hasChildren}
          onToggle={() => instance.update?.({ toggled: !rowDetails.toggled }, path)}
        />
      ))}
    </div>
  )
}

const CellWrapper = ({
  field,
  value,
  metaId,
  type,
  objectId,
  wrap,
  hasChildren,
  onToggle,
  indent = 0
}: {
  objectId?: number
  field: string
  value: string
  metaId: number
  type: MetaObject['type']
  wrap?: boolean
  hasChildren?: boolean
  onToggle?: (v: boolean) => void
  indent?: number
}) => {
  const renderer = () => {
    switch (field) {
      case 'name':
        return (
          <EditableCell
            value={value}
            showToggle={!!hasChildren}
            openMeta={metaId}
            onToggle={onToggle}
            indent={indent}
            onChange={v => {
              MetaStore.updateMetaObject({ id: metaId, [field]: v }, true)
            }}
          />
        )
      case 'description':
        return (
          <EditableCell
            value={value}
            onChange={v => {
              MetaStore.updateMetaObject({ id: metaId, [field]: v }, true)
            }}
          />
        )
      case 'fromObject':
        return <FromCell value={value} />
      case 'tags':
        return <TagCell wrap={wrap} value={value} metaId={metaId} />
      case 'viewAt':
      case 'updatedAt':
      case 'createdAt':
        return <DisplayCell value={value} type={field} />
      case 'related':
        return <RelatedCell metaId={metaId} />
      case 'outLinks':
        return <OutLinkCell metaId={metaId} />
      case 'inLinks':
        return <InLinkCell metaId={metaId} />
      case 'innerLabels': {
        if (objectId) {
          return <InnerLabelsCell objectId={objectId} type={type} />
        }
      }
    }
  }
  return (
    <div
      style={{
        padding: '5px 8px',
        position: 'relative',
        height: wrap ? undefined : '34px',
        minHeight: '34px',
        wordBreak: 'break-all',
        overflow: wrap ? 'visible' : 'hidden',
        whiteSpace: wrap ? 'pre-wrap' : 'nowrap',
        borderRight: `1px solid ${Colors.Background.Border}`
      }}
    >
      {renderer()}
    </div>
  )
}

const DisplayCell = ({ value, type }: { value: any; type: 'type' | 'createdAt' | 'viewAt' | 'updatedAt' }) => {
  if (!value) return null
  const displayed = () => {
    switch (type) {
      case 'type':
        return Rendevoz.Utils.Meta.getTypeName(value)
      case 'viewAt':
      case 'createdAt':
      case 'updatedAt':
        return DateFormat.format(value, DateFormat.Formats.withMinute)
    }
  }
  return displayed()
}

const EditableCell = ({
  value,
  onChange,
  openMeta,
  showToggle,
  onToggle,
  indent = 0
}: {
  value: string
  openMeta?: number
  onChange: (v: string) => void
  showToggle: boolean
  onToggle: (v: boolean) => void
  indent?: number
}) => {
  const [toggled, setToggled] = useState(false)
  const containerRef = useRef<HTMLTextAreaElement>(null)
  const { openPopover, renderPopover } = usePopoverCell({
    onClose: () => {
      if (valueRef.current !== value) {
        onChange(valueRef.current || 'Unnamed Object')
      }
      valueRef.current = ''
    },
    onOpen: () => {
      valueRef.current = value
    },
    targetRef: containerRef
  })
  const [isIn, setIsIn] = useState(false)
  const valueRef = useRef('')
  return (
    <>
      <div
        onPointerEnter={() => setIsIn(true)}
        onPointerLeave={() => setIsIn(false)}
        style={{ width: '100%', height: '100%', display: 'flex', gap: 6, paddingLeft: indent * 40 }}
        onClick={e => {
          const parent = e.currentTarget.parentElement
          if (!parent) return
          openPopover(parent, box => (
            <AutosizeTextarea
              autoFocus={true}
              minRows={1}
              maxRows={999}
              ref={containerRef}
              spellCheck="false"
              onChange={e => (valueRef.current = e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                boxShadow: Colors.Background.BoxShadow,
                background: Colors.Background.Secondary,
                resize: 'none',
                borderRadius: 4,
                padding: '6px 6px',
                left: box?.left,
                top: box?.top,
                width: box?.width,
                position: 'fixed'
              }}
              defaultValue={value}
            />
          ))
        }}
      >
        {showToggle && (
          <Icon
            name={'park-right'}
            onClick={e => {
              e.stopPropagation()
              setToggled(!toggled)
              onToggle(!toggled)
            }}
          />
        )}
        <div>{value}</div>
        {openMeta && isIn && (
          <Icon
            size={13}
            name="park-expand-text-input"
            onClick={e => {
              e.stopPropagation()
              Rendevoz.Actions.Open.Meta.openMetaObject(openMeta)
            }}
            containerStyle={{
              border: `1px solid ${Colors.Background.Border}`,
              borderRadius: 4,
              position: 'absolute',
              right: 4,
              top: '50%',
              transform: 'translateY(-50%)',
              padding: 3,
              cursor: 'pointer',
              background: Colors.Background.Secondary
            }}
          ></Icon>
        )}
      </div>
      {renderPopover()}
    </>
  )
}

const TagCell = ({ value = [], metaId, wrap }: { value: number[]; metaId: number; wrap?: boolean }) => {
  const tagRef = useRef<HTMLDivElement>(null)
  const { openPopover, renderPopover } = usePopoverCell({
    targetRef: tagRef
  })
  return (
    <>
      <Content
        flex
        fullWidth
        gap={4}
        style={{ flexWrap: wrap ? 'wrap' : 'nowrap', overflow: 'hidden', height: 'fit-content', minHeight: 24 }}
        alignItems="center"
        onClick={e => {
          const parent = e.currentTarget.parentElement
          if (parent) {
            openPopover(parent, box => (
              <MetaTagPicker
                ref={tagRef}
                style={{
                  boxShadow: Colors.Background.BoxShadow,
                  background: Colors.Background.Secondary,
                  borderRadius: 4,
                  left: box?.left,
                  top: box?.top,
                  width: box?.width,
                  position: 'fixed'
                }}
                metaId={metaId}
              />
            ))
          }
        }}
      >
        {value.map(i => (
          <Tag hideDelete square hideSize tag={i} key={i} />
        ))}
      </Content>
      {renderPopover()}
    </>
  )
}

const FromCell = ({ value }: { value: MetaObject['fromObject'] }) => {
  const meta = MetaStore.useValue(value?.metaId)
  if (!meta) return null
  return (
    <Content flex gap={6} alignItems="center">
      {meta.coverImgSrc && <Image src={meta.coverImgSrc} preview width={20} />}
      <div className={ClassName.ellipsisFont(1)}>{meta.name}</div>
    </Content>
  )
}
