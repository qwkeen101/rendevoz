import ClassName from '@/styles/classNames'
import fuzzysort from 'fuzzysort'
import { atom, useAtom } from 'jotai'
import { memo } from 'react'
import { Flipped } from 'react-flip-toolkit'
import { usePdfViewer } from '@/core'

const searchAtom = atom<{
  total: number
  resultList?: {
    id: number
    str: string
    page: number
    prepared: Fuzzysort.Prepared
    highlight: string | null
  }[]
}>({ total: 0 })
const searchStrAtom = atom<string>('')
const PdfSearch = ({ flipId }: { flipId: string }) => {
  const viewer = usePdfViewer()
  const [searchStr, setSearchStr] = useAtom(searchStrAtom)
  const [result, setResult] = useAtom(searchAtom)
  return (
    <Flipped inverseFlipId={flipId}>
      <div style={{ width: 400, maxHeight: 500, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <input
          placeholder="Search"
          className={ClassName.input()}
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
            const r = viewer?.search?.(e.target.value)
            if (r) {
              setResult({
                total: r.total,
                resultList: Array.from(r.values()).map(i => ({
                  ...i.obj,
                  highlight: fuzzysort.highlight(i)
                }))
              })
            }
          }}
        ></input>
        <div className={ClassName.description()} style={{ marginLeft: 8, userSelect: 'none' }}>
          Find {result.total} results
        </div>
        <div style={{ overflowY: 'scroll', overflowX: 'hidden' }}>
          {result.resultList?.map(
            i =>
              i.highlight && (
                <div
                  onClick={() => {
                    viewer?.jumpToPage?.(i.page)
                    viewer?.highlightText?.(i.str, i.page)
                  }}
                  className={ClassName.flatButton()}
                  style={{ marginRight: 10 }}
                  key={i.id}
                  dangerouslySetInnerHTML={{ __html: i.highlight }}
                ></div>
              )
          )}
        </div>
      </div>
    </Flipped>
  )
}

export default memo(PdfSearch)
