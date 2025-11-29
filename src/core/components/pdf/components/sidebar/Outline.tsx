import { Content, Icon } from '@/components'
import { useSelectAtomValue, useToggle } from '@/hooks'
import { LayoutFunctions } from '~/typings'
import { atom, useAtom } from 'jotai'
import { memo, useEffect, useState } from 'react'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import { waitFor } from '@/utils'
import { PDFStateAtom } from '@/core/components/pdf/hooks/usePDFState'
import classnames from 'classnames'
import EmptyList from '@/core/components/common/EmptyList'

type Outline = Awaited<ReturnType<LayoutFunctions['getOutline']>>
const outlineAtom = atom<Outline | null>(null)
const PdfOutline = () => {
  const [outline, setOutline] = useAtom(outlineAtom)
  const viewer = usePDFInstance()
  const lastReadPage = useSelectAtomValue(PDFStateAtom, s => s.document?.lastReadPage)
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
  useEffect(() => {
    waitFor(
      () => !!viewer.getOutline,
      () => {
        if (!outline) {
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
  }, [])
  if (!outline || outline.length === 0) {
    return <EmptyList className={'h-full'} />
  }
  return (
    <div className={'h-full w-full overflow-y-auto px-3'}>
      <div className={'pb-20 w-full'}>{outline?.map((i, idx) => <OutlineItem activeItem={activeOutline} item={i} key={idx} />)}</div>
    </div>
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
      <div
        onClick={() => {
          item.dest && instance.navigateOps?.jumpToDest(item.dest)
        }}
        className={classnames('button items-start flex gap-2', contains && 'active-button')}
      >
        {hasChildren && (
          <Icon
            onClick={e => {
              toggleHide()
              e.stopPropagation()
            }}
            name="park-right"
            strokeWidth={4}
            className={classnames(!hide && 'rotate-90', 'transition-transform mt-1')}
          />
        )}
        <div>{item.title}</div>
      </div>
      {!hide && (
        <div className={'pl-5'}>
          {item.items.map((i, idx) => (
            <OutlineItem item={i} key={idx} activeItem={activeItem} />
          ))}
        </div>
      )}
    </div>
  )
})
export default memo(PdfOutline)
