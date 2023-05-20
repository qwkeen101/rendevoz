import { AnimatePopover, Content, Icon, Tooltip, WithBorder } from '@/components'
import { useToggle } from '@/hooks'
import ClassName from '@/styles/classNames'
import Id from '@/utils/id'
import { css } from '@emotion/css'
import { useMemo, useRef, useState } from 'react'
import PdfInfo from './Info'
import PdfOutline from './Outline'
import PdfSearch from './Search'
import PdfLabels from './Label'
import { IPdfDocument } from '~/typings/data'
import { usePdfViewer } from '@/core'
import Colors from '@/consts/colors'
import FontSize from '@/consts/font'
import { useSetAtom } from 'jotai'
import { PdfPageStateAtom } from '..'
const PdfFloatBar = ({ document }: { document?: IPdfDocument }) => {
  const viewer = usePdfViewer()
  const id = useMemo(() => Id.getStrId(), [])
  const container = useRef(null)
  const [popState, setPopState] = useState<
    Partial<{
      visible: boolean
      content: 'action' | 'outline' | 'search' | 'info' | 'label' | 'shape'
    }>
  >({ visible: false, content: 'action' })
  const [isPan, togglePan] = useToggle(false)
  const setPageState = useSetAtom(PdfPageStateAtom)
  const { content } = popState
  const renderContent = () => {
    switch (content) {
      case 'action':
        return (
          <div style={{ width: 180, fontFamily: 'Muli' }}>
            <Content flex gap={10} className={ClassName.flatButton()} onClick={() => viewer?.zoomOut?.()}>
              <Icon name="park-zoom-out" />
              Zoom out
            </Content>
            <Content flex gap={10} className={ClassName.flatButton()} onClick={() => viewer?.zoomIn?.()}>
              <Icon name="park-zoom-in" />
              Zoom in
            </Content>
            <Content flex gap={10} className={ClassName.flatButton()} onClick={() => viewer?.autoFit?.()}>
              <Icon name="park-fullwidth" />
              Full width
            </Content>
            <Content
              flex
              gap={10}
              className={ClassName.flatButton()}
              onClick={() => {
                viewer?.togglePan?.()
                togglePan()
              }}
            >
              <Icon name="park-hand-drag" />
              {isPan ? 'Disable hand drag' : 'Hand drag'}
            </Content>
            {/* <Content
                flex
                gap={10}
                className={ClassName.flatButton()}
                onClick={() => {
                  setCleanMode(!cleanMode)
                }}
              >
                <Icon name="park-book-open" />
                {cleanMode ? 'Close clean mode' : 'Clean mode'}
              </Content> */}
          </div>
        )
      case 'outline':
        return <PdfOutline />
      case 'search':
        return <PdfSearch />
      case 'info':
        return <PdfInfo document={document} />
      case 'label':
        return <PdfLabels document={document} />
    }
  }

  const togglePop = (content: typeof popState.content) => {
    const shouldToggle = content === popState.content
    setPopState({
      visible: shouldToggle ? !popState.visible : true,
      content
    })
  }
  return (
    <div style={{ position: 'absolute', top: 20, right: 30, zIndex: 10 }}>
      <div ref={container}>
        <AnimatePopover
          parentElement={container.current || window.document.body}
          boundaryElement={window.document.body}
          disableIntersection
          disableNudge
          padding={10}
          align="start"
          positions={['left', 'right']}
          visible={!!popState.visible}
          content={
            <div
              className={css([
                ClassName.Background.pseudoBlubBackground,
                {
                  borderRadius: 6,
                  padding: 6,
                  border: '1px solid rgba(222,222,222,0.6)',
                  overflow: 'hidden'
                }
              ])}
            >
              {renderContent()}
            </div>
          }
        >
          <Content
            flex
            column
            style={{
              opacity: popState.visible ? 1 : undefined
            }}
            className={css({
              borderRadius: 6,
              border: '1px solid rgba(222,222,222)',
              background: Colors.Background.Linear,
              padding: 4,
              opacity: 0.4,
              fontSize: FontSize['20px'],
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              transition: 'all 0.3s ease-out',
              '> div': ClassName.circleButton(undefined, 4),
              ':hover': {
                opacity: 1
              }
            })}
          >
            <Tooltip content="Actions" position="top">
              <Icon
                fill={popState.visible ? (content === 'action' ? undefined : '#DDDDDD') : undefined}
                onClick={() => togglePop('action')}
                name="park-more-four"
              />
            </Tooltip>
            <Tooltip content="Outline" position="top">
              <Icon
                fill={popState.visible ? (content === 'outline' ? undefined : '#DDDDDD') : undefined}
                onClick={() => togglePop('outline')}
                name="park-view-list"
              />
            </Tooltip>
            <Tooltip content="Search" position="top">
              <Icon
                fill={popState.visible ? (content === 'search' ? undefined : '#DDDDDD') : undefined}
                onClick={() => togglePop('search')}
                name="park-search"
              />
            </Tooltip>
            <Tooltip content="Info" position="top">
              <Icon
                fill={popState.visible ? (content === 'info' ? undefined : '#DDDDDD') : undefined}
                onClick={() => togglePop('info')}
                name="park-info"
              />
            </Tooltip>
            <Tooltip content="Labels" position="top">
              <Icon
                fill={popState.visible ? (content === 'label' ? undefined : '#DDDDDD') : undefined}
                onClick={() => togglePop('label')}
                name="park-label"
              />
            </Tooltip>
            <Tooltip content="Thumbnail" position="top">
              <Icon onClick={() => setPageState(s => ({ ...s, thumbnailVisible: !s.thumbnailVisible }))} name="park-pic" />
            </Tooltip>
          </Content>
        </AnimatePopover>
      </div>
    </div>
  )
}

export default PdfFloatBar
