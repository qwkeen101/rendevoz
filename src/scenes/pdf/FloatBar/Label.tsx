import { Content, Icon, TabPane, Tabs, Tooltip } from '@/components'
import { ObjectStore, globalStore } from '@/stores'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { useAtomValue } from 'jotai/react'
import { atom } from 'jotai/vanilla'
import { memo, useMemo } from 'react'
import { IHighlightLabel, ILabel, IObjectLabel, IPdfDocument } from '~/typings/data'
import { usePdfViewer, useRenderObject } from '@/core'
import { selectAtom } from 'jotai/utils'
import FontSize from '@/consts/font'
import Colors from '@/consts/colors'
import { objectStore } from '@/stores/object.store'

const PdfLabels = ({ document }: { document?: IPdfDocument }) => {
  const store = ObjectStore('pdfLabel')
  const innerLabelsAtom = useMemo(() => {
    if (document?.id) {
      return selectAtom(store.objectMapAtom, m => Array.from(m.values()).filter(i => i.documentId === document.id))
    } else {
      return atom(null)
    }
  }, [document?.id])
  const labels = useAtomValue(innerLabelsAtom, { store: globalStore })
  const { highlight, meta } = useMemo(() => {
    const highlight = labels?.filter(i => i.type === 'highlight') as (IHighlightLabel & ILabel)[]
    const meta = labels?.filter(i => i.type === 'object') as (IObjectLabel & ILabel)[]
    return {
      highlight,
      meta
    }
  }, [labels])

  return (
    <div>
      {labels?.length === 0 ? (
        <div style={{ margin: '0px 8px' }} className={ClassName.title()}>
          No label in this document.
        </div>
      ) : (
        <div style={{ width: 400 }}>
          <Tabs defaultActiveKey="1">
            <TabPane key="1" tab="Highlights">
              <Content
                fullHeight
                fullWidth
                style={{
                  overflowY: 'auto',
                  maxHeight: 600
                }}
              >
                {highlight.map(i => (
                  <HighlightLabel label={i} key={i.id} />
                ))}
              </Content>
            </TabPane>
            <TabPane key="2" tab="Objects">
              <Content
                fullHeight
                fullWidth
                style={{
                  overflowY: 'auto',
                  maxHeight: 600
                }}
              >
                {meta.map(i => (
                  <MetaLabel label={i} key={i.id} />
                ))}
              </Content>
            </TabPane>
          </Tabs>
        </div>
      )}
    </div>
  )
}

const HighlightLabel = ({ label }: { label: IHighlightLabel & ILabel }) => {
  const viewer = usePdfViewer()
  const store = ObjectStore('pdfLabel')

  return (
    <div style={{ padding: 4, borderBottom: `1px solid ${Colors.Background.Border}` }}>
      <Content flex justifyContent="space-between" className={ClassName.description()}>
        <Content flex alignItems="center">
          <span style={{ marginRight: 20 }}>Page: {label.page !== undefined ? label.page + 1 : 'Unknown'}</span>
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
                  viewer?.jumpToLabel?.(label.id)
                }
              }}
            />
          </Tooltip>
          <Tooltip position="top" content="Copy content">
            <Icon
              name="park-copy"
              onClick={() => {
                navigator.clipboard.writeText(label.selectedText || '')
              }}
            />
          </Tooltip>
          <Tooltip position="top" content="Delete item">
            <Icon
              name="park-delete"
              onClick={() => {
                store.deleteOneById(label.id, { force: true })
              }}
            />
          </Tooltip>
        </div>
      </Content>
      <div className={ClassName.ellipsisFont(3)} style={{ fontSize: FontSize['14px'], textTransform: 'none' }}>
        {label.selectedText}
      </div>
    </div>
  )
}
const MetaLabel = ({ label }: { label: IObjectLabel & ILabel }) => {
  const metaId = label.metaObjectId
  const { renderWhole } = useRenderObject({ metaObjectId: metaId })
  const viewer = usePdfViewer()
  const store = objectStore('pdfLabel')
  return (
    <div style={{ padding: 8, borderBottom: `1px solid ${Colors.Background.Border}`, position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          top: 4,
          right: 0,
          zIndex: 1
        }}
      >
        <Content flex className={ClassName.description()}>
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
                    viewer?.jumpToLabel?.(label.id)
                  }
                }}
              />
            </Tooltip>

            <Tooltip position="top" content="Delete item">
              <Icon
                name="park-delete"
                onClick={() => {
                  store.deleteOneById(label.id, { force: true })
                }}
              />
            </Tooltip>
          </div>
        </Content>
      </div>
      {renderWhole({
        renderOptions: {
          renderDescription: false,
          renderFrom: false,
          renderImage: true
        },
        titleOptions: {
          style: {
            fontSize: FontSize['14px']
          }
        }
      })}
    </div>
  )
}
export default memo(PdfLabels)
