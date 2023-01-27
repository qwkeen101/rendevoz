import { AnimatePopover, Content, Icon, Tooltip, WithBorder } from '@/components'
import useCleanMode from '@/components/pdf/hooks/useCleanMode'
import { useToggle } from '@/hooks'
import ClassName from '@/styles/classNames'
import Id from '@/utils/id'
import { css } from '@emotion/css'
import { useMemo, useRef, useState } from 'react'
import { Flipped, Flipper } from 'react-flip-toolkit'
import useViewer from '../useViewer'
import PdfInfo from './Info'
import PdfOutline from './Outline'
import PdfSearch from './Search'
import PdfLabels from './Label'

const PdfFloatBar = () => {
  const viewer = useViewer()
  const id = useMemo(() => Id.getStrId(), [])
  const container = useRef(null)
  const [cleanMode, setCleanMode] = useCleanMode()
  const [popState, setPopState] = useState<
    Partial<{
      visible: boolean
      content: 'action' | 'outline' | 'search' | 'info' | 'label'
    }>
  >({ visible: false, content: 'action' })
  const [isPan, togglePan] = useToggle(false)
  const { content } = popState
  const renderContent = () => {
    switch (content) {
      case 'action':
        return (
          <Flipped inverseFlipId={id}>
            <div style={{ width: 180, fontFamily: 'Muli' }}>
              <Content flex gap={10} className={ClassName.flatButton()} onClick={() => viewer.current?.zoomOut()}>
                <Icon name="park-zoom-out" />
                Zoom out
              </Content>
              <Content flex gap={10} className={ClassName.flatButton()} onClick={() => viewer.current?.zoomIn()}>
                <Icon name="park-zoom-in" />
                Zoom in
              </Content>
              <Content flex gap={10} className={ClassName.flatButton()} onClick={() => viewer.current?.autoFit()}>
                <Icon name="park-fullwidth" />
                Full width
              </Content>
              <Content
                flex
                gap={10}
                className={ClassName.flatButton()}
                onClick={() => {
                  viewer.current?.togglePan()
                  togglePan()
                }}
              >
                <Icon name="park-hand-drag" />
                {isPan ? 'Disable hand drag' : 'Hand drag'}
              </Content>
              <Content
                flex
                gap={10}
                className={ClassName.flatButton()}
                onClick={() => {
                  setCleanMode(!cleanMode)
                }}
              >
                <Icon name="park-book-open" />
                {cleanMode ? 'Close clean mode' : 'Clean mode'}
              </Content>
            </div>
          </Flipped>
        )
      case 'outline':
        return <PdfOutline flipId={id} />
      case 'search':
        return <PdfSearch flipId={id} />
      case 'info':
        return <PdfInfo flipId={id} />
      case 'label':
        return <PdfLabels flipId={id} />
    }
  }

  const togglePop = (content: 'action' | 'outline' | 'search' | 'info' | 'label') => {
    const shouldToggle = content === popState.content
    setPopState({
      visible: shouldToggle ? !popState.visible : true,
      content
    })
  }
  return (
    <div style={{ position: 'absolute', top: 20, right: 30, zIndex: 10 }}>
      <Flipper spring="noWobble" flipKey={`${popState.content}_${popState.visible}`}>
        <div ref={container}>
          <AnimatePopover
            parentElement={container.current}
            boundaryElement={document.body}
            disableIntersection
            padding={10}
            align="start"
            positions={['left', 'right']}
            visible={!!popState.visible}
            content={
              <Flipped scale flipId={id} transformOrigin="top right">
                <div
                  className={css([
                    ClassName.Background.blurBackground,
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
              </Flipped>
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
                padding: 4,
                opacity: 0.4,
                fontSize: 20,
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
            </Content>
          </AnimatePopover>
        </div>
      </Flipper>
    </div>
  )
}

export default PdfFloatBar
