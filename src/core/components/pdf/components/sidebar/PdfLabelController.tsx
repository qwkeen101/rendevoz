import { useDebounceEffect, useMergedRef } from '@/hooks'
import { memo, useEffect, useRef, useState } from 'react'
import { IPdfLabel } from '~/typings'
import { ObjectStore } from '@/api/stores'
import { useRenderLabel } from '@/core/object'
import { Content, Image, VirtualList } from '@/components'
import ClassName from '@/styles/classNames'
import { useTranslation } from 'react-i18next'
import Colors from '@/consts/colors'
import usePdfInstance from '../../hooks/usePdfInstance'
import { atom, useAtom } from 'jotai'
import fuzzysort from 'fuzzysort'
import usePdfBarState from '@/core/components/pdf/hooks/usePdfBarState'
import { Virtualizer } from '@tanstack/react-virtual'

const PdfLabelSearchAtom = atom<{
  searchInput?: string
  results?: IPdfLabel[]
}>({})

const PdfLabelController = memo(({ labelIds }: { labelIds?: number[] }) => {
  const [sortedLabel, setSortedLabel] = useState<IPdfLabel[]>()
  const [sortMode, setSortMode] = useState<'createTime' | 'page'>('page')
  const [labelSearch, setLabelSearch] = useAtom(PdfLabelSearchAtom)
  const [pdfBarState, setPdfBarState] = usePdfBarState()
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
  console.log(sortedLabel, labelIds)
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
            labels.sort((b, a) => b.page - a.page)
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
    <Content
      flex
      column
      style={{
        height: '100%'
      }}
    >
      <input
        className={ClassName.noStyleInput}
        style={{ padding: '6px 12px', borderRadius: 4, border: Colors.Consts.Border, margin: '12px' }}
        value={labelSearch.searchInput}
        onChange={e => setLabelSearch(s => ({ ...s, searchInput: e.target.value }))}
        placeholder={t('general.search')}
      ></input>
      <VirtualList
        paddingEnd={200}
        ref={virtualizerRef}
        style={{ width: '100%', height: '100%' }}
        estimateSize={200}
        items={sortedLabel}
        renderItem={i => <Label id={i.id} key={i.id} highlight={i.id === currentHighlightLabel} />}
      ></VirtualList>
    </Content>
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
      {pdfLabel.selectedText && renderOriginalText({ text: pdfLabel.selectedText })}
      <Content flex style={{ marginTop: 4 }}>
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
      {renderDescription({ style: { width: '100%' } })}
      {renderAttachment({
        style: { marginTop: 8 },
        renderAttOnParent: false,
        renderObjectDetailsOnParent: false
      })}
      <div className={'font-size-13 transparent-font'}>{t('general.Page', { num: (pdfLabel.page ?? 0) + 1 })}</div>
    </Content>
  )
}

export default PdfLabelController
