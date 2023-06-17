import { AnimatePopover, Content, Icon, Switch, Tooltip } from '@/components'
import { useToggle } from '@/hooks'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { useMemo, useRef, useState } from 'react'
import PdfInfo from './Info'
import { IPdfDocument } from '~/typings/data'
import { usePdfViewer } from '@/core'
import Colors from '@/consts/colors'
import FontSize from '@/consts/font'
import usePdfBarState from '@/core/pdf/hooks/usePdfBarState'
import { useAtom } from 'jotai'
import { PdfStateAtom } from '../../hooks/usePdfState'
import { useTranslation } from 'react-i18next'
const PdfFloatBar = ({ document }: { document?: IPdfDocument }) => {
  const viewer = usePdfViewer()
  const container = useRef(null)
  const [pdfBarState, setPdfBarState] = usePdfBarState()
  const [pdfState, setPdfState] = useAtom(PdfStateAtom)
  const { t } = useTranslation()
  const [popState, setPopState] = useState<
    Partial<{
      visible: boolean
      content: 'action' | 'outline' | 'search' | 'info' | 'label' | 'shape'
    }>
  >({ visible: false, content: 'action' })
  const [isPan, togglePan] = useToggle(false)

  const { content } = popState
  const renderContent = () => {
    switch (content) {
      case 'action':
        return (
          <div style={{ width: 180, fontFamily: 'Muli' }} className={ClassName.description(FontSize['14px'])}>
            <Content flex gap={10} className={ClassName.flatButton()} onClick={() => viewer?.zoomOut?.()}>
              <Icon name="park-zoom-out" />
              {t('general.zoom out')}
            </Content>
            <Content flex gap={10} className={ClassName.flatButton()} onClick={() => viewer?.zoomIn?.()}>
              <Icon name="park-zoom-in" />
              {t('general.zoom in')}
            </Content>
            <Content flex gap={10} className={ClassName.flatButton()} onClick={() => viewer?.autoFit?.()}>
              <Icon name="park-fullwidth" />
              {t('general.full width')}
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
              {isPan ? t('general.disable hand drag') : t('general.hand drag')}
            </Content>
            <Content alignItems="center" flex gap={10} justifyContent="space-between" className={ClassName.flatButton()}>
              <Content flex gap={10}>
                <Icon name="park-auto-width" />
                {t('general.auto fit')}
              </Content>
              <Switch
                height={16}
                defaultValue={pdfState.autoFitWhenResize}
                onChange={v => setPdfState(s => ({ ...s, autoFitWhenResize: v }))}
              ></Switch>
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
      case 'info':
        return <PdfInfo document={document} />
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
            <Tooltip content={t('general.action')} position="top">
              <Icon
                fill={popState.visible ? (content === 'action' ? undefined : '#DDDDDD') : undefined}
                onClick={() => togglePop('action')}
                name="park-more-four"
              />
            </Tooltip>
            <Tooltip content={t('general.thumbnail')} position="top">
              <Icon onClick={() => setPdfBarState(s => ({ ...s, showLeftBar: true, leftBarActive: 'thumbnail' }))} name="park-pic" />
            </Tooltip>
            <Tooltip content={t('general.outline')} position="top">
              <Icon
                fill={popState.visible ? (content === 'outline' ? undefined : '#DDDDDD') : undefined}
                onClick={() => setPdfBarState(s => ({ ...s, showLeftBar: true, leftBarActive: 'outline' }))}
                name="park-view-list"
              />
            </Tooltip>
            <Tooltip content={t('general.search')} position="top">
              <Icon
                fill={popState.visible ? (content === 'search' ? undefined : '#DDDDDD') : undefined}
                onClick={() => {
                  console.log('sarac')
                  setPdfBarState(s => ({ ...s, showRightBar: true, rightBarActive: 'search' }))
                }}
                name="park-search"
              />
            </Tooltip>
            <Tooltip content={t('general.label')} position="top">
              <Icon
                fill={popState.visible ? (content === 'label' ? undefined : '#DDDDDD') : undefined}
                onClick={() => setPdfBarState(s => ({ ...s, showRightBar: true, rightBarActive: 'label' }))}
                name="park-label"
              />
            </Tooltip>
            <Tooltip content="Info" position="top">
              <Icon
                fill={popState.visible ? (content === 'info' ? undefined : '#DDDDDD') : undefined}
                onClick={() => togglePop('info')}
                name="park-info"
              />
            </Tooltip>
          </Content>
        </AnimatePopover>
      </div>
    </div>
  )
}

export default PdfFloatBar
