import { Content, Icon, VirtualList, Virtualizer } from '@/components'
import Colors from '@/consts/colors'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useMeasure, useMemoizedFn, useSelectAtomValue } from '@/hooks'
import { ObjectStore } from '@/api/stores'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import { PDFStateAtom } from '@/core/components/pdf/hooks/usePDFState'
import { useAtomValue } from 'jotai'
import { range } from 'lodash'

export default () => {
  const instance = usePDFInstance()
  const pages = useSelectAtomValue(PDFStateAtom, s => s.numPages) ?? 1
  const documentId = instance.getId()
  const pdf = ObjectStore('pdf').useValue(documentId)
  const [ratio, setRatio] = useState<number>()
  const virtualizerRef = useRef<Virtualizer<any, any>>()
  const thumbnailURLMap = useAtomValue(instance.values.thumbnailAtom)
  const ref = useRef<HTMLDivElement>(null)
  const { width } = useMeasure(ref)
  const cols = Math.min(4, Math.floor(width / 340) + 1)
  const rows = pages % cols === 0 ? pages / cols : Math.floor(pages / cols) + 1
  const initialize = useMemoizedFn(() => {
    if (!ratio) {
      instance.values.document?.getPage(2).then(p => {
        const v = p.getViewport({ scale: 1 })
        setRatio(v.height / v.width)
      })
    }
    const page = pdf?.lastReadPage
    if (page !== undefined) {
      try {
        setTimeout(() => {
          console.log(page, cols)
          virtualizerRef.current?.scrollToIndex(Math.floor(page / cols) + 1)
        })
      } catch (e) {
        console.log(e)
      }
    }
  })
  useEffect(() => {
    setTimeout(() => initialize())
  }, [])
  return (
    <div className={'w-full h-full relative'} ref={ref}>
      <VirtualList
        ref={virtualizerRef}
        items={range(0, rows)}
        estimateSize={150}
        overscan={1}
        renderItem={(item, idx) => {
          const sliced = range(idx * cols, Math.min(pages, (idx + 1) * cols))
          return (
            <div
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
              }}
              className={'grid gap-3'}
            >
              {sliced.map(i => (
                <div
                  className={'flex flex-col relative items-center flex-1'}
                  key={idx}
                  onClick={() => {
                    instance?.navigateOps?.jumpToPage?.(i)
                  }}
                  style={{
                    width: '100%'
                  }}
                >
                  <ThumbnailItem imgURL={thumbnailURLMap.get(i)} ratio={ratio} lastReadPage={pdf?.lastReadPage} pageIndex={i} />
                  <div className={'transparent-font font-size-12 my-2'}>{i + 1}</div>
                </div>
              ))}
            </div>
          )
        }}
        className={'w-full h-full p-3.5 pt-0'}
        style={{
          overflowAnchor: 'none'
        }}
      />
    </div>
  )
}

const ThumbnailItem = ({
  pageIndex,
  lastReadPage,
  ratio = 1,
  imgURL
}: {
  pageIndex: number
  lastReadPage?: number
  ratio?: number
  imgURL?: string
}) => {
  const instance = usePDFInstance()
  useLayoutEffect(() => {
    instance.getThumbnail?.(pageIndex)
  }, [])
  if (imgURL) {
    return (
      <img
        src={imgURL}
        style={{
          cursor: 'pointer',
          boxShadow: pageIndex === lastReadPage ? `0 0 0 2px ${Colors.Common.SelectColor}` : '0 0 0 1px var(--border-background)',
          width: '100%',
          borderRadius: 6,
          marginTop: 2
        }}
      />
    )
  }
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 0 1px var(--border-background)',
        borderRadius: 6,
        marginTop: 2,
        paddingBottom: ratio ? `${ratio * 100}%` : '160%'
      }}
    >
      <Icon
        size={30}
        name={'park-loading-four'}
        style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}
        spin
      />
    </div>
  )
}
