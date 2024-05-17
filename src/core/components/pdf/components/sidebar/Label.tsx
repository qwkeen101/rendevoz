import { GlobalInstance, useMergedRef } from '@/hooks'
import { memo, useEffect, useRef } from 'react'
import { IPdfDocument, IPdfLabel } from '~/typings'
import { useRenderLabel } from '@/core/object'
import { Content, Image } from '@/components'
import { useTranslation } from 'react-i18next'
import Colors from '@/consts/colors'
import usePDFInstance from '../../hooks/usePDFInstance'
import usePDFBarState from '@/core/components/pdf/hooks/usePDFBarState'
import useRenderLabelContainer from '@/core/object/renderer/useRenderLabelContainer'

const PDFLabel = memo(
  ({
    labelIds,
    defaultSortMode = 'page',
    defaultScrollOffset,
    onOffsetChange,
    defaultPriority = 'none',
    onPriorityChange,
    onSortModeChange
  }: {
    labelIds?: number[]
    defaultSortMode?: IPdfDocument['labelSortMode']
    defaultScrollOffset?: number
    onOffsetChange?: (offset: number) => void
    defaultPriority?: IPdfDocument['labelPriority']
    onPriorityChange?: (p: IPdfDocument['labelPriority']) => void
    onSortModeChange?: (sortMode: IPdfDocument['labelSortMode']) => void
  }) => {
    const [pdfBarState, setPdfBarState] = usePDFBarState()
    const { renderContainer, renderSort, renderSearch, virtualizerRef, setCurrentHighlight, sortedLabels } =
      useRenderLabelContainer<IPdfLabel>('pdfLabel', labelIds, {
        availableSorts: ['page', 'page reverse', 'created at', 'updated at'],
        onOffsetChange,
        onPriorityChange,
        onSortModeChange,
        defaultPriority,
        defaultScrollOffset,
        defaultSortMode
      })
    const instance = usePDFInstance()
    instance.jumpToLabelInSidebar = id => {
      console.log(id)
      setPdfBarState(s => ({ ...s, sidebarActive: 'label' }))
      const idx = sortedLabels?.findIndex(i => i.id === id)
      if (idx !== undefined && idx >= 0) {
        virtualizerRef.current?.scrollToIndex(idx, { align: 'center' })
      }
      setCurrentHighlight(id)
      setTimeout(() => {
        setCurrentHighlight(undefined)
      }, 1500)
    }

    return (
      <>
        <Content
          flex
          column
          style={{
            height: '100%'
          }}
        >
          <Content
            flex
            alignItems={'center'}
            style={{
              padding: '10px',
              gap: 8
            }}
          >
            {renderSearch()}
            {renderSort()}
          </Content>
          {renderContainer((i, highlighted) => (
            <Label id={i.id} key={i.id} highlight={!!highlighted} />
          ))}
        </Content>
      </>
    )
  }
)

const Label = ({ id, highlight }: { id: number; highlight: boolean }) => {
  const { label, ref, renderName, renderOriginalText, renderPopover, renderTags, setDraggingDetails } = useRenderLabel({
    objectId: id,
    type: 'pdfLabel',
    onNavigate: () => {
      instance.navigateOps?.jumpToLabel(id, false)
    },
    onDragStart: () => {
      setDraggingDetails({
        type: 'pdfLabel',
        labelId: pdfLabel.id
      })
    }
  })
  const pdfLabel = label as IPdfLabel
  const instance = usePDFInstance()

  const containerRef = useRef<HTMLDivElement>(null)
  const mergedContainerRef = useMergedRef(ref, containerRef)

  useEffect(() => {
    const container = containerRef.current
    if (highlight && container) {
      container.style.background = Colors.Common.SelectColorTransparent
      container.scrollIntoView({
        block: 'center'
      })
      return () => {
        container.style.removeProperty('background')
      }
    }
  }, [highlight])
  const { t } = useTranslation()
  if (!label) return null
  return (
    <Content
      flex
      column
      gap={5}
      style={{ padding: 12, transition: 'background 0.25s ease' }}
      className={'border-top'}
      ref={mergedContainerRef}
    >
      {pdfLabel.imageUrl && (
        <Image
          onContextMenu={() => {
            GlobalInstance.commonOps?.previewImage?.(pdfLabel.imageUrl!)
          }}
          width={'100%'}
          src={pdfLabel.imageUrl}
          style={{
            maxWidth: '340px'
          }}
          withoutContainer
          onClick={() => {
            instance.navigateOps?.jumpToLabel(id, false)
          }}
          containerStyle={{ borderRadius: 4, overflow: 'hidden', marginBottom: 6, cursor: 'pointer', maxWidth: 300 }}
        />
      )}
      {pdfLabel.selectedText &&
        renderOriginalText({
          text: pdfLabel.selectedText,
          style: {
            marginBottom: 4,
            fontSize: 12
          }
        })}
      <Content flex>
        {renderName({})}
        {renderPopover({
          showTag: true,
          on: event => {
            switch (event.type) {
              case 'delete': {
                instance.deleteLabel?.(id)
              }
            }
          }
        })}
      </Content>
      <Content flex justifyContent={'space-between'} gap={10} alignItems={'flex-end'} style={{ flexWrap: 'wrap', marginTop: 4 }}>
        {renderTags()}
        <div style={{ lineHeight: 1 }} className={'font-size-12 super-transparent-font'}>
          {t('general.Page', { num: (pdfLabel.page ?? 0) + 1 })}
        </div>
      </Content>
    </Content>
  )
}

export default PDFLabel
