import usePdfState from '@/core/pdf/hooks/usePdfState'
import { globalStore, ObjectStore } from '@/stores'
import { AnimatePopover, WithBorder } from '@/components'
import LabelToolbar from '@/core/pdf/components/toolbar/LabelToolbar'
import { defaultBgColor } from '@/components/picker/colorPicker'
import { Rendevoz } from '@/core/rendevoz'
import { objectIdToMetaObjectIdMapAtom } from '@/stores/meta.store'
import { GlobalSearchInstance } from '@/core/global/GlobalSearchPanel'
import usePdfInstance from '@/core/pdf/hooks/usePdfInstance'

const LabelToolbarRenderer = () => {
  const [pdfState, setPdfState] = usePdfState()
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
  return (
    <AnimatePopover
      padding={10}
      positions={['top']}
      visible={!!pdfState.currentFocusedLabel}
      onClickOutside={() => setPdfState(s => ({ ...s, currentFocusedLabel: undefined }))}
      position={{
        left: pdfState.currentFocusedLabel?.position.x,
        top: pdfState.currentFocusedLabel?.position.y
      }}
      borderRadius={999}
      content={
        currentLabel && (
          <WithBorder padding={'0px 12px'} borderRadius={999}>
            <LabelToolbar
              onColorChange={c => {
                if (c === defaultBgColor) {
                  ObjectStore('pdfLabel').updateOne({ id: currentLabel?.id, color: undefined })
                } else {
                  ObjectStore('pdfLabel').updateOne({ id: currentLabel?.id, color: c })
                }
              }}
              onTranslate={e => {
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
                instance.jumpToLabelInSidebar?.(currentLabel?.id)
              }}
              onDelete={() => {
                ObjectStore('pdfLabel').deleteOneById(currentLabel?.id, { force: true })
                setPdfState(s => ({ ...s, currentFocusedLabel: undefined }))
              }}
              selectedText={currentLabel.selectedText}
              layout={layout}
            />
          </WithBorder>
        )
      }
    ></AnimatePopover>
  )
}

export default LabelToolbarRenderer
