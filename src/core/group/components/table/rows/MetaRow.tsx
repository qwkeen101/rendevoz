import { IGroupRow } from './types'
import { MetaStore } from '@/stores'
import useMetaWithGroup from '@/core/group/hooks/useMetaWithGroup'
import { useSelectAtomValue } from '@/hooks'
import { TableStateAtom } from '@/core/group/hooks/useTableState'
import { Rendevoz } from '@/core/rendevoz'
import { Colors } from '@/consts'
import CellWrapper from '@/core/group/components/table/CellWrapper'
import { Content } from '@/components'
import { useGroupInstance } from '@/core/group/hooks/useGroupInstance'
import { RowWrapper } from '@/core/group/components/table/RowWrapper'

const MetaRow = ({ rowDetails, path, rowRef, renderIndicator, isSelected, renderCheckbox }: IGroupRow) => {
  const metaId = rowDetails.id
  const headers = useSelectAtomValue(TableStateAtom, s => s.headers)
  const columns = useSelectAtomValue(TableStateAtom, s => s.headerColumn)
  const metaObject = MetaStore.useValue(metaId)
  const groupOfMeta = useMetaWithGroup(rowDetails, metaId, path)
  const hasChildren = rowDetails.children?.length
  const instance = useGroupInstance()
  console.log(metaObject, metaId, rowDetails)
  if (!metaObject) return null
  if (hasChildren) {
    return (
      <Content flex column>
        <Content flex alignItems={'center'} ref={rowRef}>
          {renderCheckbox()}
          <div
            onClick={() => {
              if (groupOfMeta) {
                Rendevoz.Actions.Layout.openNewTab({
                  data: {
                    type: 'group',
                    objectId: groupOfMeta.id
                  }
                })
              }
            }}
            style={{
              display: 'grid',
              position: 'relative',
              gridTemplateColumns: columns,
              background: isSelected ? Colors.Common.SelectColorTransparent : undefined,
              borderBottom: `1px solid ${Colors.Background.Border}`,
              transition: 'background 0.2s ease'
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
                // wrap={wrap}
                indent={path.length - 1}
                hasChildren={hasChildren}
                onToggle={() => instance.valueOps?.updateValueByPath?.({ toggled: !rowDetails.toggled }, path)}
              />
            ))}
          </div>
        </Content>

        {!rowDetails.toggled && rowDetails.children?.map((i, idx) => <RowWrapper rowDetails={i} path={[...path, idx]} />)}
      </Content>
    )
  } else {
    return (
      <Content ref={rowRef} flex alignItems={'center'}>
        {renderCheckbox()}
        <div
          onClick={() => {
            if (groupOfMeta) {
              Rendevoz.Actions.Layout.openNewTab({
                data: {
                  type: 'group',
                  objectId: groupOfMeta.id
                }
              })
            }
          }}
          style={{
            display: 'grid',
            position: 'relative',
            gridTemplateColumns: columns,
            background: isSelected ? Colors.Common.SelectColorTransparent : undefined,
            borderBottom: `1px solid ${Colors.Background.Border}`,
            transition: 'background 0.2s ease'
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
              // wrap={wrap}
              indent={path.length - 1}
              hasChildren={hasChildren}
              onToggle={() => instance.valueOps?.updateValueByPath?.({ toggled: !rowDetails.toggled }, path)}
            />
          ))}
        </div>
      </Content>
    )
  }
}

export default MetaRow
