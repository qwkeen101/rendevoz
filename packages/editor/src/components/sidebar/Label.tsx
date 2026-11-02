import useEditorInstance from '../../hooks/useEditorInstance'
import { memo, useLayoutEffect, useRef } from 'react'
import { useSelectAtomValue } from '@/hooks'
import Colors from '../consts/colors'
import { Node, Path } from 'slate'
import { INoteLabel } from '~/typings'
import { EditorStateAtom } from '../hooks/useEditorState'
import ContextMenu from '@/components/contextMenu'
import { assignProperties } from '../utils'
import { useSetAtom } from 'jotai'

const EditorLabelContainer = memo(({ labelIds, labelType }: { labelIds?: number[]; labelType: string }) => {
  const instance = useEditorInstance()
  const state = useSelectAtomValue(EditorStateAtom, s => s.state)
  const setState = useSetAtom(EditorStateAtom)
  const highlightToPathRef = useRef<Record<number, Path>>()
  const getPath = () => {
    if (!labelIds?.length) return
    const record: Record<number, Path> = {}
    const editor = instance.editor
    const iter = Node.texts(editor)
    for (const value of iter) {
      if (value && 'highlight' in value[0] && value[0].highlight) {
        const [v, path] = value
        record[v.highlight!] = path
      }
    }
    let trigger = true
    if (!highlightToPathRef.current) {
      trigger = false
    }
    highlightToPathRef.current = record
    if (trigger) {
      triggerSort()
    }
  }
  useLayoutEffect(() => {
    getPath()
  }, [labelIds, state?.loaded])
  const renderContainer = (renderer: any) => <div>{labelIds?.map(id => renderer({ id } as any, false, () => {}))}</div>
  const renderHeader = () => null
  const triggerSort = () => {}
  const setCurrentHighlight = (_?: number) => {}
  assignProperties(instance, {
    labelOps: {
      ...instance.labelOps,
      openLabelInSidebar: id => {
        setState(s => ({ ...s, sidebarVisible: true, sidebarActive: 'label' }))
        setCurrentHighlight(id)
        setTimeout(() => setCurrentHighlight(undefined), 1500)
      }
    }
  })
  const showPage = state?.labelSortMode === 'article order' || state?.labelSortMode === 'article order in reverse'
  return (
    <div className={'h-full w-full flex flex-col'}>
      {renderHeader()}
      {renderContainer((i, highlighted, onMove) => (
        <Label
          path={showPage ? highlightToPathRef.current?.[i.id] : undefined}
          highlighted={highlighted}
          id={i.id}
          type={labelType}
          onMove={onMove}
        />
      ))}
    </div>
  )
})

const Label = memo(
  ({ id, type, highlighted, onMove, path }: { id: number; type: string; highlighted: boolean; onMove: VoidFunction; path?: number[] }) => {
    const highlightId = id
    const instance = useEditorInstance()
    const { renderName, renderHeader, renderOriginalText, renderContextMenu, renderTags, ref, labelMeta, renderQuestions } = useRenderLabel(
      {
        objectId: id,
        type,
        onDelete: () => {
          instance.labelOps?.deleteLabel(id)
        },
        onMove
      }
    )
    if (!label) return null
    if (labelMeta?.deleted) return null
    return (
      <ContextMenu ref={ref} content={setV => renderContextMenu(undefined, () => setV(false))}>
        <div
          onClick={e => {
            if (!e.defaultPrevented) {
              if (!window.getSelection()?.toString()) {
                instance.scrollToHighlight?.({
                  highlightId
                })
              }
            }
          }}
          className={'gap-3 light-hover flex flex-col p-3.5 transition-colors'}
          style={{
            background: highlighted ? Colors.Common.SelectColorTransparent : undefined
          }}
        >
          {renderHeader({
            showPath: path
          })}
          {renderOriginalText({
            text: label?.selectedText || ''
          })}
          {renderName({})}
          {renderQuestions()}
          {renderTags()}
        </div>
      </ContextMenu>
    )
  }
)
export default EditorLabelContainer
