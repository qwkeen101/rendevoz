import ClassName from '@/styles/classNames'
import { atom, useAtom } from 'jotai'
import { memo } from 'react'
import { usePdfViewer } from '@/core'
import { css } from '@emotion/css'
import _ from 'lodash'
import { Content, VirtualList } from '@/components'
import Colors from '@/consts/colors'
import { useTranslation } from 'react-i18next'
import BorderInput from '@/components/base/BorderInput'

const searchAtom = atom<{
  total: number
  resultList?: {
    pageIndex: number
    results: string[]
  }[]
}>({ total: 0 })

export const dividerClazz = css({
  '::before, ::after': {
    content: '""',
    position: 'absolute',
    top: '50%',
    width: 9999,
    height: 1,
    background: Colors.Background.Border
  },
  '::before': {
    right: '100%',
    marginRight: 10
  },
  '::after': {
    left: '100%',
    marginLeft: 10
  }
})
const searchStrAtom = atom<string>('')
const PdfSearch = () => {
  const viewer = usePdfViewer()
  const [searchStr, setSearchStr] = useAtom(searchStrAtom)
  const [result, setResult] = useAtom(searchAtom)
  const { t } = useTranslation()

  return (
    <div
      style={{
        width: '100%',
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        height: '100%',
        padding: 12
      }}
    >
      <input
        className={ClassName.noStyleInput}
        onChange={e => {
          const value = e.target.value
          if (typeof value !== 'string') return
          setSearchStr(value)
          if (value.length) {
            const r = viewer?.search?.(value)
            if (r) {
              r.sort((b, a) => b.pageIndex - a.pageIndex)
              const result = Object.entries(_.groupBy(r, a => a.pageIndex))
              setResult({
                total: r.length,
                resultList: result.map(i => ({
                  pageIndex: Number(i[0]),
                  results: i[1].map(i => i.searchText)
                }))
              })
            }
          } else {
            setResult({
              total: 0,
              resultList: []
            })
          }
        }}
        value={searchStr}
        placeholder={t('general.search')}
        style={{ padding: '6px 12px', border: Colors.Consts.Border, borderRadius: 4 }}
      ></input>
      {searchStr && (
        <div className={ClassName.description()} style={{ userSelect: 'none' }}>
          {t('general.find results', { num: result.total })}
        </div>
      )}
      <div
        style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          height: '100%',
          width: '100%'
        }}
        className={css({
          em: {
            color: Colors.Common.SelectColor,
            fontStyle: 'normal'
          }
        })}
      >
        <VirtualList
          style={{ width: '100%', height: '100%' }}
          estimateSize={100}
          childrenContainerClassname={'font-size-14'}
          items={result.resultList || []}
          paddingEnd={200}
          renderItem={i => (
            <ResultPanel
              pageIndex={i.pageIndex}
              results={i.results}
              key={i.pageIndex}
              onClick={() => {
                console.log(i.pageIndex)
                viewer?.navigateOps?.jumpToPage?.(i.pageIndex)
                viewer?.highlightText?.(searchStr, i.pageIndex)
              }}
            />
          )}
        ></VirtualList>
      </div>
    </div>
  )
}

const ResultPanel = memo(({ pageIndex, results, onClick }: { pageIndex: number; results: string[]; onClick: VoidFunction }) => {
  return (
    <Content flex column>
      <div
        className={ClassName.description()}
        style={{
          width: 'calc(100% - 30px)',
          position: 'relative',
          textAlign: 'center',
          overflow: 'hidden',
          margin: '6px auto'
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
          {pageIndex + 1}
        </span>
      </div>
      {results.map(i => (
        <div
          onClick={onClick}
          className={ClassName.flatButton()}
          style={{ marginRight: 10, color: Colors.Font.Primary }}
          key={i}
          dangerouslySetInnerHTML={{ __html: i }}
        ></div>
      ))}
    </Content>
  )
})
export default memo(PdfSearch)
