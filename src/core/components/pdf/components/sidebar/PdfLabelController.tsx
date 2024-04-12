import { useDebounceEffect, useMergedRef } from '@/hooks'
import { memo, useEffect, useRef, useState } from 'react'
import { IPdfLabel } from '~/typings'
import { ObjectStore } from '@/api/stores'
import { useRenderLabel } from '@/core/object'
import { Content, Icon, Image, Modal, VirtualList } from '@/components'
import ClassName from '@/styles/classNames'
import { useTranslation } from 'react-i18next'
import Colors from '@/consts/colors'
import usePdfInstance from '../../hooks/usePdfInstance'
import { atom, useAtom } from 'jotai'
import fuzzysort from 'fuzzysort'
import usePdfBarState from '@/core/components/pdf/hooks/usePdfBarState'
import { Virtualizer } from '@tanstack/react-virtual'
import pdfLabelToMindmap from '@/core/components/whiteboard/utils/label/pdfLabelToMindmap'
import { Whiteboard } from '@/core/components/whiteboard'
import { getBoxOfBoxes } from '@/core/components/whiteboard/utils'
import { toast } from 'react-hot-toast'

const PdfLabelSearchAtom = atom<{
  searchInput?: string
  results?: IPdfLabel[]
}>({})

const PdfLabelController = memo(({ labelIds }: { labelIds?: number[] }) => {
  const [sortedLabel, setSortedLabel] = useState<IPdfLabel[]>()
  const [sortMode, setSortMode] = useState<'createTime' | 'page'>('page')
  const [labelSearch, setLabelSearch] = useAtom(PdfLabelSearchAtom)
  const [pdfBarState, setPdfBarState] = usePdfBarState()
  const [mindmapPreviewVisible, setMindmapPreviewVisible] = useState(false)
  const [mindmapTempId, setMindmapTempId] = useState<number>()
  const [currentHighlightLabel, setCurrentHighlightLabel] = useState<number>()
  const { t } = useTranslation()
  const instance = usePdfInstance()
  const virtualizerRef = useRef<Virtualizer<HTMLDivElement, Element>>()
  instance.jumpToLabelInSidebar = id => {
    setPdfBarState(s => ({ ...s, rightBarActive: 'label', showRightBar: true }))
    const idx = sortedLabel?.findIndex(i => i.id === id)
    if (idx !== undefined && idx >= 0) {
      virtualizerRef.current?.scrollToIndex(idx)
    }
    setCurrentHighlightLabel(id)
    setTimeout(() => {
      setCurrentHighlightLabel(undefined)
    }, 3000)
  }

  useEffect(() => {
    if (labelIds?.length !== undefined) {
      const action = async () => {
        const labels = (
          labelSearch.results?.length
            ? labelSearch.results
            : (await Promise.all(labelIds?.map(i => ObjectStore('pdfLabel').getOneById(i)) || [])).filter(i => i?.page !== undefined)
        ) as (IPdfLabel & {
          page: number
        })[]
        if (sortMode === 'page') {
          if (!labelSearch.results?.length) {
            labels.sort((b, a) => {
              const bP = b.page
              const aP = a.page
              if (bP !== aP) {
                return bP - aP
              } else {
                let bT = 0,
                  aT = 0
                if ('rect' in b) {
                  bT = b.rect.top
                }
                if ('rects' in b && b.rects) {
                  bT = b.rects[0].percentageTop
                }
                if ('rect' in a) {
                  aT = a.rect.top
                }
                if ('rects' in a && a.rects) {
                  aT = a.rects[0].percentageTop
                }
                if (aT && bT) {
                  return bT - aT
                }
                return 0
              }
            })
          }
        } else {
          labels.sort((b, a) => b.createdAt - a.createdAt)
        }
        setSortedLabel(labels)
      }
      action()
    } else {
      setSortedLabel([])
    }
  }, [labelIds, sortMode, labelSearch.results])
  const triggerMindmap = () => {
    const id = instance.getPdfId?.()
    if (id) {
      pdfLabelToMindmap(id)
        .then(nodes => {
          if (nodes) {
            ObjectStore('whiteboard')
              .addOne({
                nodes: new Map(nodes.map(i => [i.id, i])),
                edges: new Map()
              })
              .then(w => {
                setMindmapPreviewVisible(true)
                setMindmapTempId(w.id)
              })
          }
        })
        .catch(e => {
          toast.error('Can not generate mindmap for PDF without outline!')
        })
    }
  }
  const [mindmapInitialized, setMindmapInitialized] = useState(false)
  useEffect(() => {
    return () => {
      if (mindmapTempId) {
        setMindmapInitialized(false)
        setTimeout(() => {
          ObjectStore('whiteboard').deleteOneById(mindmapTempId)
        }, 100)
      }
    }
  }, [mindmapTempId])
  useDebounceEffect(
    () => {
      if (labelSearch.searchInput && sortedLabel?.length) {
        const result = fuzzysort.go(labelSearch.searchInput, sortedLabel, {
          keys: ['selectedText', 'name', 'description'],
          threshold: -1000000
        })
        setLabelSearch(s => ({ ...s, results: result.map(i => i.obj) }))
      } else {
        setLabelSearch(s => ({ ...s, results: undefined }))
      }
    },
    [labelSearch.searchInput],
    { wait: 500 }
  )

  return (
    <>
      <Modal
        zIndex={1000}
        enableClickEvent={true}
        visible={mindmapPreviewVisible}
        onClose={() => {
          setMindmapTempId(undefined)
          setTimeout(() => {
            setMindmapPreviewVisible(false)
          })
        }}
        style={{
          background: 'var(--global-background)'
        }}
      >
        <div style={{ width: '95vw', height: '90vh', opacity: mindmapInitialized ? 1 : 0 }}>
          {mindmapTempId && mindmapPreviewVisible && (
            <Whiteboard
              onInstanceInitialized={i => {
                setTimeout(() => {
                  const doms = i.nodeOps?.getDOMBoxOfNodes((i.getAllNode?.() || []).map(i => i.id))
                  if (doms) {
                    const box = getBoxOfBoxes(Array.from(Object.values(doms)))
                    box && i.containerOps?.fitTo(box, { skipAnimation: true })
                  }
                  setMindmapInitialized(true)
                }, 100)
              }}
              readOnly
              whiteboardId={mindmapTempId}
            />
          )}
        </div>
      </Modal>
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
            padding: '12px',
            gap: 12
          }}
        >
          <input
            className={'focus-input border-box-shadow'}
            style={{ padding: '3px 8px', borderRadius: 4, flex: 1 }}
            value={labelSearch.searchInput}
            onChange={e => setLabelSearch(s => ({ ...s, searchInput: e.target.value }))}
            placeholder={t('general.search')}
          ></input>
          <Icon
            size={18}
            tooltip={'View mindmap'}
            name={'park-mindmap-map'}
            onClick={() => triggerMindmap()}
            className={ClassName.flatButton(4, '4px')}
          />
        </Content>
        <VirtualList
          paddingEnd={200}
          ref={virtualizerRef}
          style={{ width: '100%', height: '100%' }}
          estimateSize={200}
          items={sortedLabel}
          renderItem={i => <Label id={i.id} key={i.id} highlight={i.id === currentHighlightLabel} />}
        ></VirtualList>
      </Content>
    </>
  )
})

const Label = ({ id, highlight }: { id: number; highlight: boolean }) => {
  const { label, ref, renderName, renderOriginalText, renderPopover, renderAttachment, renderDescription, setDraggingDetails } =
    useRenderLabel({
      objectId: id,
      type: 'pdfLabel',
      onNavigate: () => {
        instance.navigateOps?.jumpToLabel(id)
      },
      onDragStart: () => {
        setDraggingDetails({
          type: 'pdfLabel',
          labelId: pdfLabel.id
        })
      }
    })
  const pdfLabel = label as IPdfLabel
  const instance = usePdfInstance()

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
      gap={4}
      style={{ padding: 12, transition: 'background 0.25s ease' }}
      className={'border-top'}
      ref={mergedContainerRef}
    >
      {pdfLabel.imageUrl && (
        <Image
          src={pdfLabel.imageUrl}
          width={'90%'}
          withoutContainer
          containerStyle={{ borderRadius: 8, overflow: 'hidden', marginBottom: 6 }}
          preview
        />
      )}
      {pdfLabel.selectedText &&
        renderOriginalText({
          text: pdfLabel.selectedText,
          style: {
            marginBottom: 8
          }
        })}
      <Content flex>
        {renderName({})}
        {renderPopover({
          on: event => {
            switch (event.type) {
              case 'delete': {
                instance.deleteLabel?.(id)
              }
            }
          }
        })}
      </Content>
      <div style={{ marginTop: 6, lineHeight: 1 }} className={'font-size-12 super-transparent-font'}>
        {t('general.Page', { num: (pdfLabel.page ?? 0) + 1 })}
      </div>
    </Content>
  )
}

export default PdfLabelController
