import { MetaObject } from '~/typings'
import { MetaStore } from '@/stores'
import { Colors } from '@/consts'
import { RelatedCell, InnerLabelsCell, InLinkCell, OutLinkCell, FromCell, DisplayCell, EditableCell, TagCell } from './cells'
import { useGroupInstance } from '@/core/group/hooks/useGroupInstance'
import { Path } from 'slate'

const CellWrapper = ({
  field,
  value,
  metaId,
  type,
  objectId,
  wrap,
  hasChildren,
  path,
  toggled,
  indent = 0
}: {
  objectId?: number
  field: string
  value: string
  metaId: number
  type: MetaObject['type']
  wrap?: boolean
  hasChildren?: boolean
  indent?: number
  toggled?: boolean
  path: Path
}) => {
  const instance = useGroupInstance()
  const showToggle = field === 'name' && !!hasChildren
  const renderer = () => {
    switch (field) {
      case 'name':
        return (
          <EditableCell
            value={value}
            showToggle={!!hasChildren}
            openMeta={metaId}
            toggled={toggled}
            path={path}
            indent={indent}
            onChange={v => {
              instance.metaOps?.updateMeta({ id: metaId, [field]: v })
            }}
          />
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

export default CellWrapper
