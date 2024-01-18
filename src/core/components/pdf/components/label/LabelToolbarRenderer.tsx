import usePdfState from '@/core/components/pdf/hooks/usePdfState'
import { globalStore, ObjectStore } from '@/api/stores'
import { AnimatePopover, WithBorder } from '@/components'
import LabelToolbar from '@/core/components/pdf/components/toolbar/LabelToolbar'
import { defaultBgColor } from '@/components/picker/colorPicker'
import { Rendevoz } from '@/core/rendevoz'
import { objectIdToMetaObjectIdMapAtom } from '@/api/stores/meta/meta.store'
import { GlobalSearchInstance } from '@/core/global/GlobalSearchPanel'
import usePdfInstance from '@/core/components/pdf/hooks/usePdfInstance'
import { useEffect, useState } from 'react'
import { XYPosition } from '~/typings'

const LabelToolbarRenderer = () => {
  const [pdfState, setPdfState] = usePdfState()
  const [v, setV] = useState(false)
  const [pos, setPos] = useState()
  useEffect(() => {
    if (pdfState.currentFocusedLabel) {
      setV(true)
      setPos(pdfState.currentFocusedLabel.position)
    }
  }, [pdfState.currentFocusedLabel])

  const currentLabel = ObjectStore('pdfLabel').useValue(pdfState.currentFocusedLabel?.labelId)
  const instance = usePdfInstance()
  let layout: string[] = []

  if (currentLabel && pdfState.currentFocusedLabel?.position) {
    layout = layout.concat('delete', 'colorPicker', 'rightBar')
    if (currentLabel.type === 'highlight') {
      layout.push('copy')
      layout = layout.concat('separator', 'searcher', 'translator')
    }
  }
  const close = () => {
    setV(false)
    setTimeout(() => {
      setPdfState(s => ({ ...s, currentFocusedLabel: undefined }))
    }, 160)
  }
  return (
    <AnimatePopover
      padding={10}
      positions={['top']}
      visible={v}
      onClickOutside={() => close()}
      position={{
        left: pos?.x,
        top: pos?.y
      }}
      borderRadius={5}
      withClickCover={true}
      content={
        <WithBorder padding={0} borderRadius={5}>
          <LabelToolbar
            onColorChange={c => {
              if (!currentLabel) return
              close()
              if (c === defaultBgColor) {
                ObjectStore('pdfLabel').updateOne({ id: currentLabel?.id, color: undefined })
              } else {
                ObjectStore('pdfLabel').updateOne({ id: currentLabel?.id, color: c })
              }
            }}
            onTranslate={e => {
              if (!currentLabel) return
              close()
              currentLabel.type === 'highlight' &&
                currentLabel.selectedText &&
                Rendevoz.Actions.Open.Translate.openTranslate({
                  to: 'zh',
                  query: currentLabel.selectedText,
                  e,
                  source: {
                    type: 'pdf',
                    objectId: currentLabel.documentId,
                    page: currentLabel.page,
                    selectedText: currentLabel.selectedText
                  }
                })
            }}
            onSearch={e => {
              if (!currentLabel) return
              close()
              if (currentLabel.type !== 'highlight' || !currentLabel.selectedText) return
              const pdfMetaId = globalStore.get(objectIdToMetaObjectIdMapAtom)?.get(pdfState.pdfId)
              if (pdfMetaId) {
                GlobalSearchInstance.open?.({
                  e,
                  query: currentLabel?.selectedText,
                  from: {
                    pages: [currentLabel.page],
                    type: 'pdf',
                    metaId: pdfMetaId,
                    selectedText: currentLabel?.selectedText
                  }
                })
              }
            }}
            onOpenInSidebar={() => {
              if (!currentLabel) return
              close()
              instance.jumpToLabelInSidebar?.(currentLabel?.id)
            }}
            onDelete={() => {
              if (!currentLabel) return
              ObjectStore('pdfLabel').deleteOneById(currentLabel?.id, { force: true })
              setPdfState(s => ({ ...s, currentFocusedLabel: undefined }))
              setV(false)
            }}
            selectedText={currentLabel?.selectedText}
            layout={layout}
          />
        </WithBorder>
      }
    ></AnimatePopover>
  )
}

export default LabelToolbarRenderer
