import ClassName from '@/styles/classNames'
import { atom, useAtom } from 'jotai'
import { memo } from 'react'
import { Flipped } from 'react-flip-toolkit'
import { usePdfViewer } from '@/core'
import { css } from '@emotion/css'
import _ from 'lodash'
import { Content } from '@/components'
import { useMemoizedFn, useToggle } from '@/hooks'
import Colors from '@/consts/colors'

const searchAtom = atom<{
  total: number
  resultList?: {
    pageIndex: number
    results: string[]
  }[]
}>({ total: 0 })
const searchStrAtom = atom<string>('')
const PdfSearch = () => {
  const viewer = usePdfViewer()
  const [searchStr, setSearchStr] = useAtom(searchStrAtom)
  const [result, setResult] = useAtom(searchAtom)

  return (
    <div style={{ width: 400, maxHeight: 500, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <input
        placeholder="Search"
        className={ClassName.input()}
        autoFocus={true}
        style={{
          height: 40,
          margin: 'auto',
          width: 'calc(100% - 16px)',
          background: 'transparent',
          border: '1px solid rgba(222,222,222)'
        }}
        value={searchStr}
        onChange={e => {
          setSearchStr(e.target.value)
          if (e.target.value.length) {
            const r = viewer?.search?.(e.target.value)
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
      ></input>
      <div className={ClassName.description()} style={{ marginLeft: 8, userSelect: 'none' }}>
        Find {result.total} results
      </div>
      <div
        style={{ overflowY: 'scroll', overflowX: 'hidden' }}
        //@ts-expect-error
        className={css({
          '*': {
            textTransform: 'none !important'
          },
          em: {
            color: 'yellow',
            fontStyle: 'normal'
          }
        })}
      >
        {result.resultList?.map(i => (
          <ResultPanel
            pageIndex={i.pageIndex}
            results={i.results}
            key={i.pageIndex}
            onClick={() => {
              viewer?.jumpToPage?.(i.pageIndex)
              viewer?.highlightText?.(searchStr, i.pageIndex)
            }}
          />
        ))}
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
          paddingLeft: '8px'
        }}
      >
        Page: {pageIndex + 1}
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
