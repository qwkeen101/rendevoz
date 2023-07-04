import { useDebounceEffect, useSelectAtomValue, useToggle } from '@/hooks'
import { PdfStateAtom } from '../../hooks/usePdfState'
import { useEffect, useMemo, useRef, useState } from 'react'
import { IPdfLabel } from '~/typings'
import { ObjectStore } from '@/stores'
import { useRenderLabel } from '@/core/database'
import { Content, VirtualList } from '@/components'
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

const PdfLabelSearchAtom = atom<{
  searchInput?: string
  results?: IPdfLabel[]
}>({})

const PdfLabelController = () => {
  const labelIds = useSelectAtomValue(PdfStateAtom, s => s.document?.labels)
  const [sortedLabel, setSortedLabel] = useState<IPdfLabel[]>()
  const [groupedLabel, setGroupedLabel] = useState<Record<number, IPdfLabel[]>>({})
  const [sortMode, setSortMode] = useState<'createTime' | 'page'>('page')
  const [labelSearch, setLabelSearch] = useAtom(PdfLabelSearchAtom)
  const { t } = useTranslation()
  useEffect(() => {
    console.log(labelIds)
    if (labelIds?.length) {
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
        paddingRight: 10,
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
                margin: '6px auto 0px'
              }}
            >
              <span style={{ display: 'inline-block', padding: '0px 10px', position: 'relative' }} className={dividerClazz}>
                {group[0]}
              </span>
            </div>
            {group[1]?.map(i => (
              <Label id={i.id} key={i.id} />
            ))}
          </Content>
        )}
      ></VirtualList>
    </Content>
  )
}

const Label = ({ id }: { id: number }) => {
  const { label, labelMeta, renderName, renderPopover, renderAttachment, renderDescription, setDraggingDetails } = useRenderLabel({
    objectId: id,
    type: 'pdfLabel'
  })
  const pdfLabel = label as IPdfLabel
  const instance = usePdfInstance()
  const [showMore, toggleShowMore] = useToggle(false)
  const { t } = useTranslation()
  useEffect(() => {
    if (pdfLabel && pdfLabel.documentId) {
      setDraggingDetails({
        pdfId: pdfLabel.documentId,
        content: pdfLabel.name,
        page: pdfLabel.page,
        labelId: pdfLabel.id,
        type: 'pdfLabel'
      })
    }
  }, [pdfLabel])
  if (!label) return null
  return (
    <Content flex column style={{ padding: 8 }}>
      <Content flex style={{ marginBottom: 4 }}>
        {renderName({
          onNameClick: () => instance.jumpToLabel?.(id)
        })}
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

      {pdfLabel.type === 'highlight' && pdfLabel.selectedText && (
        <div
          style={{
            fontSize: FontSize['12px'],
            padding: '4px 12px 4px',
            textTransform: 'none',
            borderLeft: `3px solid ${Colors.Font.Secondary}`,
            background: Colors.Background.ButtonHover
          }}
        >
          <div style={{ textTransform: 'none' }} className={showMore ? undefined : ClassName.ellipsisFont(3)}>
            {pdfLabel.selectedText}
          </div>
          {pdfLabel.selectedText.length > 120 && (
            <div
              style={{ marginLeft: 'auto', textAlign: 'end', fontSize: FontSize['12px'], cursor: 'pointer', width: 'fit-content' }}
              onClick={toggleShowMore}
            >
              {showMore ? t('editor.show less') : t('editor.show more')}
            </div>
          )}
        </div>
      )}
      {renderDescription({ style: { marginTop: 10, width: '100%' } })}
      {renderAttachment({ style: { marginTop: 16 }, renderAttOnParent: false, renderObjectDetailsOnParent: false })}
    </Content>
  )
}

export default PdfLabelController
