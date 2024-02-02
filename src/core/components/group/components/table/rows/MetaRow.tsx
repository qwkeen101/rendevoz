import { IGroupRow, IGroupRowStateProps } from './types'
import { MetaStore } from '@/api/stores'
import { Colors } from '@/consts'
import CellWrapper from '@/core/components/group/components/table/CellWrapper'
import { Content } from '@/components'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { RowWrapper } from '@/core/components/group/components/table/RowWrapper'
import { ReactNode } from 'react'
import useChildrenSyncAsAttachment from '@/core/components/group/hooks/useChildrenSyncAsAttachment'
export const Container = ({ children, hasChildren }: { children: ReactNode; hasChildren: boolean }) =>
  hasChildren ? (
    <Content flex column>
      {children}
    </Content>
  ) : (
    <>{children}</>
  )
const MetaRow = ({
  rowDetails,
  rowRef,
  renderIndicator,
  isSelected,
  renderCheckbox,
  untoggledIdSet,
  showOriginalText: showOriginal,
  headerColumns: tableColumns,
  headers,
  showDeletedMeta: showDeleted,
  wrapContent: wrap,
  shiftKeyPressed
}: IGroupRow & IGroupRowStateProps) => {
  const metaId = rowDetails.id
  const toggled = !untoggledIdSet?.has(rowDetails.rowId)
  const metaObject = MetaStore.useValue(metaId)
  const hasChildren = !!rowDetails.children?.length
  // useChildrenSyncAsAttachment(metaObject, rowDetails.children)
  const instance = useGroupInstance()
  const rowId = rowDetails.tempRowId || rowDetails.rowId
  if (!metaObject) return null
  if (metaObject.deleted && showDeleted !== true) return null
  const path = instance.pathOps?.getPathById(rowId)
  return (
    <Container hasChildren={hasChildren}>
      <Content
        onContextMenu={e => {
          e.preventDefault()
          instance.selectOps?.selectItem(rowId, true)
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
              if (instance.values.selectedRowIdSet.has(rowId)) {
                instance.values.inViewRowFuncs.get(rowId)?.clearSelectState()
                instance.values.lastSelectRowId = undefined
              } else {
                let lastSelected = instance.values.lastSelectRowId
                instance.values.lastSelectRowId = rowId
                if (!lastSelected) {
                  if (instance.values.selectedRowIdSet.size === 1) {
                    lastSelected = instance.values.selectedRowIdSet.keys().next().value
                  }
                }
                if (lastSelected) {
                  const lastSelectedPath = instance.pathOps?.getPathById(lastSelected, true)
                  if (lastSelectedPath) {
                    const currentPath = instance.pathOps?.getPathById(rowId, true)
                    if (currentPath) {
                      instance.selectOps?.selectBetweenPath(currentPath, lastSelectedPath)
                      return
                    }
                  }
                }
                instance.values.inViewRowFuncs.get(rowId)?.select()
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
            gridTemplateColumns: tableColumns
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
                rowId={rowId}
                placeholder={metaObject.type.includes('Label') && !showOriginal ? metaObject.placeholderName : undefined}
                index={idx}
                field={field}
                value={fieldValue}
                metaObject={metaObject}
                key={i.name}
                indent={(path?.length ?? 1) - 1}
                metaId={metaId}
                wrap={wrap}
                hasChildren={hasChildren}
                toggled={toggled}
              />
            )
          })}
        </Content>
      </Content>
      {hasChildren &&
        !toggled &&
        rowDetails.children?.map(i => (
          <RowWrapper
            key={i.rowId}
            headerColumns={tableColumns}
            shiftKeyPressed={shiftKeyPressed}
            rowDetails={i}
            untoggledIdSet={untoggledIdSet}
            headers={headers}
            showDeletedMeta={showDeleted}
            wrapContent={wrap}
            showOriginalText={showOriginal}
          />
        ))}
    </Container>
  )
}

export default MetaRow
