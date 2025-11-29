import { useMergedRef } from '@/hooks'
import { memo, useEffect, useRef } from 'react'
import { ILabelContainerProps, IPdfDocument, IPDFLabel } from '~/typings'
import { useRenderLabel } from '@/core/object'
import { Icon } from '@/components'
import { t } from 'i18next'
import Colors from '@/consts/colors'
import usePDFInstance from '../../hooks/usePDFInstance'
import useRenderLabelContainer from '@/core/object/renderer/useRenderLabelContainer'
import ToolTip from '@/components/base/Tooltip'
import toast from 'react-hot-toast'
import trans from '@/consts/trans'
import ContextMenu from '@/components/contextMenu'
import { useSetPDFState } from '@/core/components/pdf/hooks/usePDFState'

const PDFLabel = memo(
  ({
    labelIds,
    labelState,
    onLabelStateChange
  }: {
    labelIds?: number[]
    labelState: ILabelContainerProps
    onLabelStateChange: (state: Partial<ILabelContainerProps>) => void
  }) => {
    const setState = useSetPDFState()
    const instance = usePDFInstance()
    const { renderContainer, renderHeader, setCurrentHighlight } = useRenderLabelContainer<IPDFLabel>('pdfLabel', {
      labelIds,
      onLabelStateChange,
      onDelete: id => {
        instance.deleteLabel?.(id)
      },
      labelState,
      availableSorts: ['page', 'page reverse', 'created at', 'updated at']
    })
    instance.jumpToLabelInSidebar = id => {
      setState(s => ({ ...s, sidebarActive: 'label', sidebarVisible: true }))
      setCurrentHighlight(id)
      setTimeout(() => {
        setCurrentHighlight(undefined)
      }, 1500)
    }

    return (
      <>
        <div className={'flex flex-col h-full'}>
          {renderHeader()}
          {renderContainer((i, highlighted, onMove) => (
            <Label
              pageSortMode={labelState.labelSortMode === 'page' || labelState.labelSortMode === 'page reverse'}
              id={i.id}
              key={i.id}
              highlight={!!highlighted}
              onMove={onMove}
            />
          ))}
        </div>
      </>
    )
  }
)

const Label = memo(
  ({ id, highlight, onMove, pageSortMode }: { id: number; highlight: boolean; onMove: VoidFunction; pageSortMode: boolean }) => {
    const { label, labelMeta, ref, renderHeader, renderName, renderContextMenu, renderQuestions, renderOriginalText, renderTags } =
      useRenderLabel({
        objectId: id,
        type: 'pdfLabel',
        onDelete: () => {
          instance.deleteLabel?.(id)
        },
        onMove
      })
    const pdfLabel = label as IPDFLabel
    const instance = usePDFInstance()

    const containerRef = useRef<HTMLDivElement>(null)
    const mergedContainerRef = useMergedRef(ref, containerRef)

    useEffect(() => {
      const container = containerRef.current
      if (highlight && container) {
        container.style.background = Colors.Common.SelectColorTransparent
        return () => {
          container.style.removeProperty('background')
        }
      }
    }, [highlight])
    if (!label || labelMeta?.deleted) return null
    return (
      <ContextMenu ref={mergedContainerRef} content={setV => renderContextMenu(undefined, () => setV(false))}>
        <div
          onClick={e => {
            if (!e.defaultPrevented) {
              if (!window.getSelection()?.toString()) {
                instance.navigateOps?.jumpToLabel(id, false)
              }
            }
          }}
          className={'flex flex-col light-hover gap-3 p-3.5 transition-colors'}
        >
          {renderHeader({
            showPage: pageSortMode
          })}
          {pdfLabel.imageUrl && (
            <div
              style={{
                maxWidth: 320
              }}
              className={'relative w-full mt-0.5'}
            >
              {pdfLabel.selectedText && (
                <ToolTip
                  content={pdfLabel.selectedText ? <div className={'whitespace-pre-wrap max-w-96'}>{pdfLabel.selectedText}</div> : null}
                >
                  <Icon
                    onClick={e => {
                      e.preventDefault()
                      navigator.clipboard.writeText(pdfLabel.selectedText!)
                      toast.success(t(trans.Copied))
                    }}
                    size={14}
                    className={'!absolute cursor-pointer top-1.5 right-1.5 z-10 active-button p-1.5 rounded-md'}
                    name={'park-font-size'}
                  />
                </ToolTip>
              )}
              <img src={pdfLabel.imageUrl} className={'overflow-hidden rounded-md max-w-full'} />
            </div>
          )}
          {renderOriginalText({
            text: pdfLabel.selectedText || ''
          })}
          {renderName({})}
          {renderQuestions()}
          {renderTags()}
        </div>
      </ContextMenu>
    )
  }
)

export default PDFLabel
