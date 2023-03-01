import { Content, Icon } from '@/components'
import { useToggle } from '@/hooks'
import { LayoutFunctions } from '@/pdfViewer/core/layouts/Layout'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { atom, useAtom } from 'jotai'
import { memo, useEffect } from 'react'
import { Flipped } from 'react-flip-toolkit'
import useViewer from '../useViewer'
type Outline = Awaited<ReturnType<LayoutFunctions['getOutline']>>
const outlineAtom = atom<Outline | null>(null)
const PdfOutline = ({ flipId }: { flipId: string }) => {
  const [outline, setOutline] = useAtom(outlineAtom)
  const viewer = useViewer()

  useEffect(() => {
    if (outline === null) {
      viewer.current?.getOutline().then(o => {
        setOutline(o)
      })
    }
  }, [])
  return (
    <Flipped inverseFlipId={flipId}>
      <Content flex column style={{ width: 300, maxHeight: 600, overflowX: 'hidden', overflowY: 'auto' }}>
        {outline?.map(i => (
          <OutlineItem item={i} />
        ))}
        {(!outline || outline.length === 0) && (
          <div style={{ margin: 'auto' }} className={ClassName.title()}>
            This document has no outline.
          </div>
        )}
      </Content>
    </Flipped>
  )
}

const OutlineItem = ({ item }: { item: Outline[number] }) => {
  const [hide, toggleHide] = useToggle(true)
  const hasChildren = item.items.length > 0
  const viewer = useViewer()
  return (
    <div>
      <div
        onClick={() => {
          item.dest && viewer.current?.jumpToDest(item.dest)
        }}
        style={{ marginRight: 6 }}
        className={css([ClassName.flatButton(), ClassName.flexLayout('center', 'flex-start')])}
      >
        {hasChildren && (
          <Icon
            onClick={e => {
              toggleHide()
              e.stopPropagation()
            }}
            name="park-right"
            style={{ transform: hide ? undefined : 'rotate(90deg)', transition: 'transform 0.3s ease', marginRight: 6 }}
          />
        )}
        <div style={{ paddingLeft: hasChildren ? 0 : 20 }}>{item.title}</div>
      </div>
      {!hide && (
        <div style={{ paddingLeft: 10 }}>
          {item.items.map(i => (
            <OutlineItem item={i} />
          ))}
        </div>
      )}
    </div>
  )
}
export default memo(PdfOutline)
