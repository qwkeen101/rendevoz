import { Content, Icon } from '@/components'
import { useToggle } from '@/hooks'
import { LayoutFunctions } from '~/typings'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { atom, useAtom } from 'jotai'
import { memo, useEffect } from 'react'
import { usePdfViewer } from '@/core'
import usePdfInstance from '@/core/components/pdf/hooks/usePdfInstance'
import { waitFor } from '@/utils'

type Outline = Awaited<ReturnType<LayoutFunctions['getOutline']>>
const outlineAtom = atom<Outline | null>(null)
const PdfOutline = () => {
  const [outline, setOutline] = useAtom(outlineAtom)
  const viewer = usePdfInstance()
  console.log('out line rendererd')
  useEffect(() => {
    console.log('getting ooo')
    waitFor(
      () => !!viewer.getOutline,
      () => {
        console.log('getting outline')
        viewer?.getOutline?.().then(o => {
          console.log(o)
          setOutline(o)
        })
      }
    )
  }, [])
  return (
    <Content
      flex
      column
      style={{
        width: '100%',
        height: '100%',
        overflowX: 'hidden',
        overflowY: 'auto'
      }}
    >
      {outline?.map((i, idx) => (
        <OutlineItem item={i} key={idx} />
      ))}
      {(!outline || outline.length === 0) && (
        <div style={{ margin: 'auto' }} className={ClassName.title()}>
          This document has no outline.
        </div>
      )}
    </Content>
  )
}

const OutlineItem = ({ item }: { item: Outline[number] }) => {
  const [hide, toggleHide] = useToggle(true)
  const hasChildren = item.items.length > 0
  const viewer = usePdfViewer()
  return (
    <div>
      <div
        onClick={() => {
          item.dest && viewer?.jumpToDest?.(item.dest)
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
            style={{
              transform: hide ? undefined : 'rotate(90deg)',
              transition: 'transform 0.3s ease',
              marginRight: 6
            }}
          />
        )}
        <div style={{ paddingLeft: hasChildren ? 0 : 20, textTransform: 'none' }} className={ClassName.ellipsisFont(1)}>
          {item.title}
        </div>
      </div>
      {!hide && (
        <div style={{ paddingLeft: 10 }}>
          {item.items.map((i, idx) => (
            <OutlineItem item={i} key={idx} />
          ))}
        </div>
      )}
    </div>
  )
}
export default memo(PdfOutline)
