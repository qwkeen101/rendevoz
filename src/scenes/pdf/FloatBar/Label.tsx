import { Content, Icon, Tooltip } from '@/components'
import { ObjectStore, globalStore } from '@/stores'
import ClassName from '@/styles/classNames'
import DateFormat from '@/utils/dateFormat'
import { css } from '@emotion/css'
import { useAtomValue } from 'jotai/react'
import { atom } from 'jotai/vanilla'
import { memo, useMemo } from 'react'
import { Flipped } from 'react-flip-toolkit'
import { toast } from 'react-hot-toast'
import { IHighlightLabel, IPdfDocument } from '~/typings/data'
import { usePdfViewer, ID_TO_LABEL_MAP } from '@/core'
import { selectAtom } from 'jotai/utils'
import FontSize from '@/consts/font'

const PdfLabels = ({ flipId, document }: { flipId: string; document?: IPdfDocument }) => {
  const store = ObjectStore('pdfLabel')
  const innerLabelsAtom = useMemo(() => {
    if (document?.id) {
      return selectAtom(store.objectMapAtom, m => Array.from(m.values()).filter(i => i.documentId === document.id))
    } else {
      return atom(null)
    }
  }, [document?.id])
  const labels = useAtomValue(innerLabelsAtom, { store: globalStore })
  const highlight = labels?.filter(i => i.type === 'highlight') as IHighlightLabel[]
  const viewer = usePdfViewer()
  return (
    <Flipped inverseFlipId={flipId}>
      <div
        style={{
          maxHeight: 600,
          overflowX: 'hidden',
          overflowY: 'auto'
        }}
      >
        {labels?.length === 0 ? (
          <div style={{ margin: '0px 8px' }} className={ClassName.title()}>
            No label in this document.
          </div>
        ) : (
          <div style={{ width: 400 }}>
            {highlight.map(i => (
              <div className={ClassName.description()} style={{ padding: 4 }}>
                <Content flex justifyContent="space-between">
                  <Content flex alignItems="center">
                    <span style={{ marginRight: 20 }}>Page: {i.page !== undefined ? i.page + 1 : 'Unknown'}</span>
                    {i.createdAt && (
                      <>
                        <Icon name="park-time" style={{ marginRight: 6 }} />
                        <span>{DateFormat.format(i.createdAt, DateFormat.Formats.withMinute)}</span>
                      </>
                    )}
                  </Content>
                  <div
                    className={css({
                      display: 'flex',
                      '> div': ClassName.circleButton(),
                      gap: 6
                    })}
                  >
                    <Tooltip position="top" content="Jump to">
                      <Icon
                        name="park-right"
                        onClick={() => {
                          if (viewer) {
                            viewer?.jumpToLabel?.(i.id)
                            if (ID_TO_LABEL_MAP.get(viewer)?.has(i.id)) {
                              ID_TO_LABEL_MAP.get(viewer)?.get(i.id)?.focus()
                            } else {
                              viewer.onLabelRendered = l => {
                                if (l === i.id) {
                                  ID_TO_LABEL_MAP.get(viewer)?.get(i.id)?.focus()
                                }
                              }
                            }
                          }
                        }}
                      />
                    </Tooltip>
                    <Tooltip position="top" content="Copy content">
                      <Icon
                        name="park-copy"
                        onClick={() => {
                          navigator.clipboard.writeText(i.selectedText || '')
                          toast.success('Text copied!')
                        }}
                      />
                    </Tooltip>
                    <Tooltip position="top" content="Delete item">
                      <Icon
                        name="park-delete"
                        onClick={() => {
                          store.deleteOneById(i.id, { force: true })
                        }}
                      />
                    </Tooltip>
                  </div>
                </Content>
                <div className={ClassName.ellipsisFont(3)} style={{ fontSize: FontSize['14px'] }}>
                  {i.selectedText}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Flipped>
  )
}

export default memo(PdfLabels)
