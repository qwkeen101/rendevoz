import { Content, Icon } from '@/components'
import { useSelectAtomValue, useToggle } from '@/hooks'
import { LayoutFunctions } from '~/typings'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { atom, useAtom } from 'jotai'
import { memo, useEffect, useMemo, useState } from 'react'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import { waitFor } from '@/utils'
import usePDFBarState from '@/core/components/pdf/hooks/usePDFBarState'
import { PdfStateAtom } from '@/core/components/pdf/hooks/usePdfState'
import classnames from 'classnames'

type Outline = Awaited<ReturnType<LayoutFunctions['getOutline']>>
const outlineAtom = atom<Outline | null>(null)
const PdfOutline = () => {
  const [outline, setOutline] = useAtom(outlineAtom)
  const [barStste] = usePDFBarState()
  const viewer = usePDFInstance()
  const showOutline = barStste.sidebarActive === 'outline'
  const lastReadPage = useSelectAtomValue(PdfStateAtom, s => s.document?.lastReadPage)
  const [pageIndexToOutline, setPageIndexToOutline] = useState<Record<number, Outline[0]>>()
  const [activeOutline, setActiveOutline] = useState<Outline[number]>()
  useEffect(() => {
    if (lastReadPage !== undefined && pageIndexToOutline !== undefined) {
      const target = Object.keys(pageIndexToOutline).findLast(i => lastReadPage >= Number(i))
      if (Number(target) >= 0) {
        setActiveOutline(pageIndexToOutline[Number(target)])
      }
    }
  }, [lastReadPage])
  console.log(lastReadPage, pageIndexToOutline, activeOutline)
  useEffect(() => {
    waitFor(
      () => !!viewer.getOutline,
      () => {
        if (!outline && showOutline) {
          viewer?.getOutline?.().then(o => {
            setOutline(o)
            const doc = viewer.values.document
            if (!doc || !o) return
            const record: Record<number, (typeof o)[0]> = {}
            const parseOutline = async (root: typeof o) => {
              return await Promise.all(
                root.map(async o => {
                  const dest = o.dest
                  const pageIdx =
                    typeof dest === 'string'
                      ? await doc.getDestination(dest).then(o => doc.getPageIndex(o[0]))
                      : await doc.getPageIndex(dest[0])
                  if (record[pageIdx]) {
                    if (!root.some(i => i === record[pageIdx])) {
                      record[pageIdx] = o
                    }
                  } else {
                    record[pageIdx] = o
                  }
                  await parseOutline(o.items)
                })
              )
            }
            parseOutline(o).then(() => {
              setPageIndexToOutline(record)
            })
          })
        }
      }
    )
  }, [showOutline])
  return (
    <Content
      flex
      className={'font-size-14'}
      column
      style={{
        width: '100%',
        height: '100%',
        overflowX: 'hidden',
        overflowY: 'auto',
        padding: '10px 10px 100px'
      }}
    >
      {outline?.map((i, idx) => <OutlineItem activeItem={activeOutline} item={i} key={idx} />)}
      {(!outline || outline.length === 0) && (
        <div style={{ margin: 'auto' }} className={'transparent-font bold-font'}>
          No content
        </div>
      )}
    </Content>
  )
}

const OutlineItem = memo(({ item, activeItem }: { item: Outline[number]; activeItem?: Outline[number] }) => {
  const [hide, toggleHide] = useToggle(true)
  const hasChildren = item.items.length > 0
  const instance = usePDFInstance()
  let contains = item === activeItem
  if (hide && activeItem && contains === false) {
    const loop = (items: any[]) => {
      if (items.some(o => o === activeItem)) {
        contains = true
        return
      } else {
        items.forEach(o => loop(o.items))
      }
    }
    loop(item.items)
  }
  return (
    <div>
      <Content
        flex
        alignItems={'center'}
        onClick={() => {
          item.dest && instance.navigateOps?.jumpToDest(item.dest)
        }}
        className={classnames(ClassName.flatButton(4, '4px 8px'), contains && 'active-button')}
      >
        {hasChildren && (
          <Icon
            onClick={e => {
              toggleHide()
              e.stopPropagation()
            }}
            name="park-right"
            style={{
              transform: hide ? undefined : 'rotate(90deg)',
              transition: 'transform 0.3s ease',
              marginRight: 6
            }}
          />
        )}
        <div className={ClassName.ellipsisFont(1)}>{item.title}</div>
      </Content>
      {!hide && (
        <div style={{ paddingLeft: 20 }}>
          {item.items.map((i, idx) => (
            <OutlineItem item={i} key={idx} activeItem={activeItem} />
          ))}
        </div>
      )}
    </div>
  )
})
export default memo(PdfOutline)
