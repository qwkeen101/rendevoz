import { useDebounceEffect, useMergedRef, useSelectAtomValue, useToggle } from '@/hooks'
import { PdfStateAtom } from '../../hooks/usePdfState'
import { useEffect, useMemo, useRef, useState } from 'react'
import { IPdfLabel } from '~/typings'
import { ObjectStore } from '@/stores'
import { useRenderLabel } from '@/core/object'
import { Content, Image, VirtualList } from '@/components'
import FontSize from '@/consts/font'
import ClassName from '@/styles/classNames'
import { useTranslation } from 'react-i18next'
import Colors from '@/consts/colors'
import usePdfInstance from '../../hooks/usePdfInstance'
import _ from 'lodash'
import { dividerClazz } from '../floatBar/Search'
import BorderInput from '@/components/base/BorderInput'
import { atom, useAtom } from 'jotai'
import fuzzysort from 'fuzzysort'
import usePdfBarState from '@/core/pdf/hooks/usePdfBarState'
import { Virtualizer } from '@tanstack/react-virtual'
import { css } from '@emotion/css'

const PdfLabelSearchAtom = atom<{
  searchInput?: string
  results?: IPdfLabel[]
}>({})

const addSepartor = css({
  '>': {
    ':not(:first-child)': {
      ':before': {
        height: '1px',
        position: 'absolute',
        top: 0,
        left: 6,
        width: 'calc(100% - 14px)',
        content: '""',
        background: Colors.Background.Border
      }
    }
  }
})
const PdfLabelController = ({ labelIds }: { labelIds?: number[] }) => {
  const [sortedLabel, setSortedLabel] = useState<IPdfLabel[]>()
  const [groupedLabel, setGroupedLabel] = useState<Record<number, IPdfLabel[]>>({})
  const [sortMode, setSortMode] = useState<'createTime' | 'page'>('page')
  const [labelSearch, setLabelSearch] = useAtom(PdfLabelSearchAtom)
  const [pdfBarState, setPdfBarState] = usePdfBarState()
  const [currentHighlightLabel, setCurrentHighlightLabel] = useState<number>()
  const { t } = useTranslation()
  const instance = usePdfInstance()
  const virtualizerRef = useRef<Virtualizer<HTMLDivElement, Element>>()
  instance.jumpToLabelInSidebar = id => {
    setPdfBarState(s => ({ ...s, rightBarActive: 'label', showRightBar: true }))
    const indexOfLabel = Object.values(groupEntries).findIndex(i => i[1].some(o => o.id === id))
    virtualizerRef.current?.scrollToIndex(indexOfLabel)
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
            labels.sort((b, a) => b.page - a.page)
          }
          const grouped = _.groupBy(labels, i => i.page)
          console.log(labels, grouped)
          setGroupedLabel(grouped)
        } else {
          labels.sort((b, a) => b.createdAt - a.createdAt)
        }
        if (!labelSearch.results?.length) {
          setSortedLabel(labels)
        }
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
        console.log(result)
        setLabelSearch(s => ({ ...s, results: result.map(i => i.obj) }))
      } else {
        setLabelSearch(s => ({ ...s, results: undefined }))
      }
    },
    [labelSearch.searchInput],
    { wait: 500 }
  )
  const labelSearchPageOrder = useMemo(() => {
    if (labelSearch.results) {
      return labelSearch.results.map(i => i.page)
    }
  }, [labelSearch.results])
  const groupEntries = useMemo(() => {
    const groupEntries = Object.entries(groupedLabel)
    if (labelSearchPageOrder) {
      groupEntries.sort((b, a) => {
        const bpage = Number(b[0])
        const apage = Number(a[0])
        const bpageIdx = labelSearchPageOrder.findIndex(i => i === bpage)
        const apageIdx = labelSearchPageOrder.findIndex(i => i === apage)
        return bpageIdx - apageIdx
      })
    }
    return groupEntries
  }, [labelSearchPageOrder, groupedLabel])
  return (
    <Content
      flex
      column
      style={{
        height: '100%',
        overflowY: 'auto'
      }}
    >
      <BorderInput
        style={{ padding: '6px 12px' }}
        containerStyle={{ borderRadius: 6, margin: '10px 6px 6px' }}
        textarea={false}
        value={labelSearch.searchInput}
        onChange={e => typeof e === 'string' && setLabelSearch(s => ({ ...s, searchInput: e }))}
        placeholder={t('general.search')}
      ></BorderInput>
      <VirtualList
        paddingEnd={200}
        ref={virtualizerRef}
        style={{ width: '100%', height: '100%' }}
        estimateSize={200}
        items={sortMode === 'page' ? groupEntries : []}
        renderItem={group => (
          <Content key={group[0]}>
            <div
              className={ClassName.description()}
              style={{
                width: 'calc(100% - 30px)',
                position: 'relative',
                textAlign: 'center',
                overflow: 'hidden',
                margin: '0px auto -8px auto'
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  padding: '0px 10px',
                  position: 'relative'
                }}
                className={dividerClazz}
              >
                {Number(group[0]) + 1}
              </span>
            </div>
            <Content className={addSepartor}>
              {group[1]?.map(i => <Label id={i.id} key={i.id} highlight={i.id === currentHighlightLabel} />)}
            </Content>
          </Content>
        )}
      ></VirtualList>
    </Content>
  )
}

const Label = ({ id, highlight }: { id: number; highlight: boolean }) => {
  const { label, ref, renderName, renderOriginalText, renderPopover, renderAttachment, renderDescription, setDraggingDetails } =
    useRenderLabel({
      objectId: id,
      type: 'pdfLabel',
      onNavigate: () => {
        instance.jumpToLabel?.(id)
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
      container.style.border = `1px solid ${Colors.Emphasis.Emphasis}`
      container.style.borderRadius = '6px'
      container.scrollIntoView({
        block: 'center'
      })
      return () => {
        container.style.border = 'unset'
        container.style.borderRadius = '0px'
      }
    }
  }, [highlight])

  if (!label) return null
  return (
    <Content flex column gap={6} style={{ padding: '12px 8px 12px 6px' }} ref={mergedContainerRef}>
      {pdfLabel.type === 'highlight' && pdfLabel.selectedText && renderOriginalText({ text: pdfLabel.selectedText })}
      {pdfLabel.type === 'crop' && pdfLabel.imageUrl && (
        <Image src={pdfLabel.imageUrl} width={'90%'} withoutContainer containerStyle={{ borderRadius: 8, overflow: 'hidden' }} preview />
      )}
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
      {renderDescription({ style: { width: '100%' } })}
      {renderAttachment({
        style: { marginTop: 8 },
        renderAttOnParent: false,
        renderObjectDetailsOnParent: false
      })}
    </Content>
  )
}

export default PdfLabelController
