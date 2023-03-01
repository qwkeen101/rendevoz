import { Content, Icon, Tooltip } from '@/components'
import usePdfInfo from '@/components/pdf/hooks/usePdfInfo'
import useLabelStore, { documentIdToLabelsMapAtom, labelsAtom } from '@/stores/label.store'
import { globalStore } from '@/stores'
import ClassName from '@/styles/classNames'
import DateFormat from '@/utils/dateFormat'
import { css } from '@emotion/css'
import { useAtomValue } from 'jotai/react'
import { atom } from 'jotai/vanilla'
import { memo, useMemo } from 'react'
import { Flipped } from 'react-flip-toolkit'
import { toast } from 'react-hot-toast'
import { IHighlightLabel, ILabel, IPdfDocument } from '~/typings/data'
import useViewer from '../useViewer'

const PdfLabels = ({ flipId, document }: { flipId: string; document?: IPdfDocument }) => {
  const innerLabelsAtom = useMemo(
    () =>
      document?.id
        ? atom(get => {
            const labelIds = get(documentIdToLabelsMapAtom).get(document?.id)
            const labels: ILabel[] = []
            labelIds?.forEach(i => {
              const l = get(labelsAtom).get(i)
              l && labels.push(l)
            })
            return labels
          })
        : atom(null),
    [document?.id]
  )
  const labels = useAtomValue(innerLabelsAtom, { store: globalStore })
  const highlight = labels?.filter(i => i.type === 'highlight') as IHighlightLabel[]
  const viewer = useViewer()
  const { deleteLabel } = useLabelStore()
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
                          i.page !== undefined && viewer.current?.jumpToPage(i.page)
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
                          deleteLabel(i.id)
                        }}
                      />
                    </Tooltip>
                  </div>
                </Content>
                <div className={ClassName.ellipsisFont(3)} style={{ color: 'black', fontSize: 14 }}>
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
