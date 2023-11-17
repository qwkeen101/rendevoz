import { IGroupRow } from './types'
import { MetaStore, ObjectStore } from '@/api/stores'
import useMetaWithGroup from '@/core/components/group/hooks/useMetaWithGroup'
import { useSelectAtomValue } from '@/hooks'
import { TableStateAtom } from '@/core/components/group/hooks/useTableState'
import { Rendevoz } from '@/core/rendevoz'
import { Colors } from '@/consts'
import CellWrapper from '@/core/components/group/components/table/CellWrapper'
import { Content } from '@/components'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { RowWrapper } from '@/core/components/group/components/table/RowWrapper'
import { ReactNode } from 'react'
import useChildrenSyncAsAttachment from '@/core/components/group/hooks/useChildrenSyncAsAttachment'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
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
  const headers = useSelectAtomValue(GroupStateAtom, s => s.visibleHeaders)
  const columns = useSelectAtomValue(GroupStateAtom, s => s.headerColumn)
  const toggled = !useSelectAtomValue(GroupStateAtom, s => s.unToggledIdSet).has(rowDetails.rowId)
  const metaObject = MetaStore.useValue(metaId)
  const hasChildren = !!rowDetails.children?.length
  const targetObject = ObjectStore(metaObject?.type).useValue(metaObject?.objectId)
  useChildrenSyncAsAttachment(metaObject, rowDetails.children)
  const wrap = useSelectAtomValue(GroupStateAtom, s => s.currentView?.options.wrapColumns)
  const shiftKeyPressed = useSelectAtomValue(GroupStateAtom, s => s.shiftPressed)
  const instance = useGroupInstance()
  if (!metaObject) return null

  return (
    <Container hasChildren={hasChildren}>
      <Content
        style={{
          position: 'relative',
          background: isSelected ? Colors.Common.SelectColorTransparent : undefined,
          borderBottom: `1px solid ${Colors.Background.Border}`,
          transition: 'background 0.15s ease'
        }}
        flex
        alignItems={'center'}
        ref={rowRef}
      >
        {renderCheckbox()}
        {renderIndicator()}
        <Content
          onClickCapture={e => {
            if (shiftKeyPressed) {
              e.preventDefault()
              window.getSelection()?.empty()
              e.stopPropagation()
              if (instance.values.selectedRowIdSet.has(rowDetails.rowId)) {
                instance.values.inViewRowFuncs.get(rowDetails.rowId)?.clearSelectState()
                instance.values.lastSelectRowId = undefined
              } else {
                const lastSelected = instance.values.lastSelectRowId
                instance.values.lastSelectRowId = rowDetails.rowId
                if (lastSelected) {
                  const lastSelectedPath = instance.pathOps?.getPathById(lastSelected, true)
                  if (lastSelectedPath) {
                    const currentPath = instance.pathOps?.getPathById(rowDetails.rowId, true)
                    if (currentPath) {
                      instance.selectOps?.selectBetweenPath(currentPath, lastSelectedPath)
                      return
                    }
                  }
                }
                instance.values.inViewRowFuncs.get(rowDetails.rowId)?.select()
              }
            }
          }}
          style={{
            display: 'grid',
            position: 'relative',
            gridTemplateColumns: columns
          }}
        >
          {headers.map(i => {
            let fieldValue = metaObject[i.name]
            if (i.name === 'originalText') {
              if (targetObject && 'selectedText' in targetObject) {
                fieldValue = targetObject.selectedText || null
              }
            }
            return (
              <CellWrapper
                rowId={rowDetails.rowId}
                field={i.name}
                value={fieldValue}
                key={i.name}
                metaId={metaId}
                wrap={wrap}
                indent={path.length - 1}
                hasChildren={hasChildren}
                toggled={toggled}
                path={path}
              />
            )
          })}
        </Content>
      </Content>
      {hasChildren && !toggled && rowDetails.children?.map((i, idx) => <RowWrapper key={i.rowId} rowDetails={i} path={[...path, idx]} />)}
    </Container>
  )
}

export default MetaRow
