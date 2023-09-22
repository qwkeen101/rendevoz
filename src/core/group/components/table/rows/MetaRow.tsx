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
import { ReactNode } from 'react'
export const Container = ({ children, hasChildren }: { children: ReactNode; hasChildren: boolean }) =>
  hasChildren ? (
    <Content flex column>
      {children}
    </Content>
  ) : (
    <>{children}</>
  )
const MetaRow = ({ rowDetails, path, rowRef, renderIndicator, isSelected, renderCheckbox }: IGroupRow) => {
  const metaId = rowDetails.id
  const headers = useSelectAtomValue(TableStateAtom, s => s.headers)
  const columns = useSelectAtomValue(TableStateAtom, s => s.headerColumn)
  const metaObject = MetaStore.useValue(metaId)
  const groupOfMeta = useMetaWithGroup(rowDetails, metaId, path)
  const hasChildren = !!rowDetails.children?.length
  const instance = useGroupInstance()

  if (!metaObject) return null

  return (
    <Container hasChildren={hasChildren}>
      <Content
        style={{
          position: 'relative',
          background: isSelected ? Colors.Common.SelectColorTransparent : undefined,
          borderBottom: `1px solid ${Colors.Background.Border}`,
          transition: 'background 0.2s ease'
        }}
        flex
        alignItems={'center'}
        ref={rowRef}
      >
        {renderCheckbox()}
        {renderIndicator()}
        <Content
          style={{
            display: 'grid',
            position: 'relative',
            gridTemplateColumns: columns
          }}
        >
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
              toggled={rowDetails.toggled}
              path={path}
            />
          ))}
        </Content>
      </Content>
      {hasChildren &&
        !rowDetails.toggled &&
        rowDetails.children?.map((i, idx) => <RowWrapper key={i.rowId} rowDetails={i} path={[...path, idx]} />)}
    </Container>
  )
}

export default MetaRow
