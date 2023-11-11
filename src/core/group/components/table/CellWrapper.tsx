import { Colors } from '@/consts'
import { RelatedCell, FromCell, DisplayCell, EditableCell, TagCell } from './cells'
import { useGroupInstance } from '@/core/group/hooks/useGroupInstance'
import { Path } from 'slate'
import ImageCell from '@/core/group/components/table/cells/ImageCell'
import TypeCell from '@/core/group/components/table/cells/TypeCell'
import ParentItemCell from '@/core/group/components/table/cells/ParentItemCell'
import LabelsCell from '@/core/group/components/table/cells/LabelsCell'
import { MetaStore, ObjectStore } from '@/stores'
import { memo } from 'react'

const CellWrapper = memo(
  ({
    field,
    value,
    metaId,
    wrap,
    hasChildren,
    toggled,
    indent = 0,
    rowId
  }: {
    field: string
    value: string
    metaId: number
    wrap?: boolean
    hasChildren?: boolean
    rowId: number
    indent?: number
    toggled?: boolean
    path: Path
  }) => {
    const instance = useGroupInstance()
    const showToggle = field === 'name' && !!hasChildren
    const renderer = () => {
      switch (field) {
        case 'name': {
          const emptyValue = ['Untitled', 'Unnamed object', 'Unnamed Label', 'Unnamed Whiteboard', 'Unnamed group'].includes(value)
          return (
            <EditableCell
              value={emptyValue ? '' : value}
              showToggle={!!hasChildren}
              openMeta={metaId}
              toggled={toggled}
              rowId={rowId}
              indent={indent}
              style={{
                fontWeight: 600
              }}
              onChange={v => {
                console.log(v)
                instance.metaOps?.updateMeta({ id: metaId, [field]: v })
              }}
            />
          )
        }
        case 'originalText':
          return (
            value !== undefined && (
              <EditableCell
                value={value}
                onChange={async v => {
                  const targetObject = await MetaStore.getMetaObjectById(metaId)
                  if (targetObject && targetObject.objectId) {
                    await ObjectStore(targetObject.type).updateOne({ id: targetObject.objectId, selectedText: v })
                  }
                }}
              />
            )
          )
        case 'description':
          return (
            <EditableCell
              value={value}
              onChange={v => {
                instance.metaOps?.updateMeta({ id: metaId, [field]: v })
              }}
            />
          )
        case 'labels':
          return <LabelsCell metaId={metaId} />
        case 'parentItems':
          return <ParentItemCell metaId={metaId} />
        case 'type':
          return <TypeCell value={value} />
        case 'coverImgSrc': {
          return (
            <ImageCell
              value={value}
              onChange={v => {
                if (!v) {
                  instance.metaOps?.updateMeta({ id: metaId, coverImgSrc: undefined })
                } else {
                  instance.metaOps?.updateMeta({ id: metaId, coverImgSrc: v })
                }
              }}
            />
          )
        }
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
      }
    }
    return (
      <div
        style={{
          padding: showToggle ? '5px 8px 5px 2px' : '5px 8px',
          position: 'relative',
          height: wrap ? undefined : '34px',
          minHeight: '34px',
          wordBreak: 'break-all',
          overflow: wrap ? 'visible' : 'hidden',
          whiteSpace: wrap ? 'pre-wrap' : 'nowrap',
          borderRight: `1px solid ${Colors.Background.Border}`,
          cursor: 'pointer'
        }}
      >
        {renderer()}
      </div>
    )
  }
)

export default CellWrapper
