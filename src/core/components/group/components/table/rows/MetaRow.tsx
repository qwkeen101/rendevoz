import { IGroupRow } from './types'
import { MetaStore, ObjectStore } from '@/api/stores'
import { useSelectAtomValue } from '@/hooks'
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
  const showOriginal = useSelectAtomValue(GroupStateAtom, s => s.showOriginalText)
  const toggled = !useSelectAtomValue(GroupStateAtom, s => s.unToggledIdSet).has(rowDetails.rowId)
  const metaObject = MetaStore.useValue(metaId)
  const hasChildren = !!rowDetails.children?.length
  useChildrenSyncAsAttachment(metaObject, rowDetails.children)
  const wrap = useSelectAtomValue(GroupStateAtom, s => s.currentView?.options.wrapColumns)
  const shiftKeyPressed = useSelectAtomValue(GroupStateAtom, s => s.shiftPressed)
  const instance = useGroupInstance()
  if (!metaObject) return null

  return (
    <Container hasChildren={hasChildren}>
      <Content
        onContextMenu={e => {
          e.preventDefault()
          instance.selectOps?.selectItem(rowDetails.rowId, true)
          instance.overlayOps?.open(
            {
              type: 'itemContextMenu',
              details: rowDetails,
              align: 'start'
            },
            {
              x: e.clientX,
              y: e.clientY
            }
          )
        }}
        style={{
          position: 'relative',
          background: isSelected ? Colors.Common.SelectColorTransparent : undefined,
          borderBottom: `1px solid ${Colors.Background.Border}`,
          transition: 'background 0.15s ease'
        }}
        flex
        alignItems={'stretch'}
        ref={rowRef}
      >
        {renderCheckbox()}
        {renderIndicator()}
        <Content
          onPointerDown={e => {
            if (shiftKeyPressed) {
              e.preventDefault()
              window.getSelection()?.empty()
              e.stopPropagation()
              if (instance.values.selectedRowIdSet.has(rowDetails.rowId)) {
                instance.values.inViewRowFuncs.get(rowDetails.rowId)?.clearSelectState()
                instance.values.lastSelectRowId = undefined
              } else {
                let lastSelected = instance.values.lastSelectRowId
                instance.values.lastSelectRowId = rowDetails.rowId
                if (!lastSelected) {
                  if (instance.values.selectedRowIdSet.size === 1) {
                    lastSelected = instance.values.selectedRowIdSet.keys().next().value
                  }
                }
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
          onClickCapture={e => {
            if (shiftKeyPressed) {
              e.stopPropagation()
            }
          }}
          style={{
            display: 'grid',
            position: 'relative',
            gridTemplateColumns: 'var(--table-columns)'
          }}
        >
          {headers.map((i, idx) => {
            let fieldValue = metaObject[i.name]
            let field = i.name
            if (i.type === 'custom') {
              const prop = metaObject.properties?.[i.id]
              if (!prop) {
                MetaStore.updateProperty(metaId, i.id, {
                  value: undefined
                })
              }
              field = i.id
              fieldValue = metaObject.properties?.[i.id]?.value
            }
            return (
              <CellWrapper
                type={i.type}
                rowId={rowDetails.rowId}
                placeholder={
                  metaObject.type.includes('Label') && !showOriginal
                    ? metaObject.placeholderName
                    : undefined
                }
                index={idx}
                field={field}
                value={fieldValue}
                metaObject={metaObject}
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
