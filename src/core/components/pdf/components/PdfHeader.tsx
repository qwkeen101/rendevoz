import { MetaStore, ObjectStore } from '@/api/stores'
import { Content, Icon, Tooltip } from '@/components'
import { ClassName } from 'rendevoz'
import usePdfBarState from '@/core/components/pdf/hooks/usePdfBarState'
import usePdfInstance from '@/core/components/pdf/hooks/usePdfInstance'
import { Colors, KEY } from '@/consts'
import { useIsIn } from '@/hooks'
import { useEffect, useState } from 'react'
import isHotkey from 'is-hotkey'
import { useMeasure } from 'react-use'
import usePdfState from '@/core/components/pdf/hooks/usePdfState'
import TooltipWithCmd from '@/components/TooltipWithCmd'

const PdfHeader = ({ documentId }: { documentId: number }) => {
  const pdf = ObjectStore('pdf').useValue(documentId)
  const pdfMeta = MetaStore.useObjectToMetaValue(documentId)
  const [barState, setBarState] = usePdfBarState()
  const [pdfState, setPdfState] = usePdfState()
  const instance = usePdfInstance()
  const [focused, setFocused] = useState(false)
  const [pageValue, setPageValue] = useState((pdf?.lastReadPage || 0) + 1)
  const { ref: pagesRef, isIn: isInPages } = useIsIn()
  const handleJump = () => {
    if (pageValue >= 0) {
      instance.navigateOps?.jumpToPage?.(pageValue - 1)
    } else {
      setPageValue(1)
      instance.navigateOps?.jumpToPage?.(0)
    }
  }
  const [ref, { width }] = useMeasure()
  useEffect(() => {
    setPageValue((pdf?.lastReadPage || 0) + 1)
  }, [pdf?.lastReadPage])
  const history = instance.navigateOps?.useHistory()
  if (pdfMeta) {
    return (
      <Content
        flex
        justifyContent={'space-between'}
        alignItems={'center'}
        ref={ref}
        gap={5}
        style={{
          padding: '10px 16px',
          position: 'absolute',
          top: 0,
          fontSize: '14px',
          width: '100%',
          zIndex: 30,
          background: Colors.Background.Global,
          borderBottom: `1px solid ${Colors.Background.Border}`
        }}
      >
        <Content flex gap={6} alignItems={'center'} style={{ maxWidth: '40%' }}>
          <Icon
            onClick={() => {
              setBarState(s => ({ ...s, showLeftBar: !s.showLeftBar }))
            }}
            size={16}
            className={ClassName.flatButton(4, '5px')}
            name={'custom-left-bar'}
          />

          {width > 600 && (
            <div className={ClassName.ellipsisFont(1)}>
              {pdfMeta.name}
            </div>
          )}
        </Content>

        <div
          ref={pagesRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            boxShadow: focused ? `0 0 0 2px ${Colors.Common.SelectColor}` : isInPages ? `0 0 0 1px ${Colors.Background.Border}` : undefined,
            padding: '2px 6px',
            borderRadius: 6,
            transition: 'all 0.2s ease',
            fontSize: 13,
            margin: '0px auto'
          }}
        >
          <input
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false)
              handleJump()
            }}
            onChange={e => {
              const num = parseInt(e.target.value)
              if (num < 1) {
                setPageValue(1)
                return
              }
              if (pdf?.totalPageNum && num > pdf?.totalPageNum) {
                setPageValue(pdf?.totalPageNum)
                return
              }
              setPageValue(num)
            }}
            onKeyDown={e => {
              if (isHotkey(KEY.Enter, e)) {
                handleJump()
                e.currentTarget.blur()
              }
            }}
            type={'number'}
            style={{ width: `calc(${(pageValue || 0).toString().length}ch + 6px)`, appearance: 'textfield' }}
            className={ClassName.noStyleInput}
            value={pageValue}
            min={1}
            max={20}
          />
          / {pdf?.totalPageNum || 0}
          <Content flex gap={4} style={{ opacity: isInPages || focused ? 1 : 0, transition: 'opacity 0.2s ease', marginLeft: 8 }}>
            <Icon
              name={'park-plus'}
              className={ClassName.flatButton(4, '4px')}
              onClick={() => {
                const next = Math.min(pageValue + 1, pdf?.totalPageNum || 1)
                instance.navigateOps?.jumpToPage?.(next - 1)
                setPageValue(next)
              }}
            />
            <Icon
              name={'park-minus'}
              className={ClassName.flatButton(4, '4px')}
              onClick={() => {
                const next = Math.max(pageValue - 1, 1)
                instance.navigateOps?.jumpToPage?.(next - 1)
                setPageValue(next)
              }}
            />
          </Content>
        </div>
        <Content flex gap={8} style={{ flexShrink: 0 }}>
          {(history?.canBack || history?.canForward) && (
            <>
              {history.canBack && (
                <Tooltip content={<TooltipWithCmd name={'Navigate back'} cmd={'Alt+←'} />}>
                  <Icon
                    size={16}
                    className={ClassName.flatButton(4, '5px')}
                    name={'park-arrow-left'}
                    onClick={() => {
                      instance.navigateOps?.back()
                    }}
                  />
                </Tooltip>
              )}
              {history.canForward && (
                <Tooltip content={<TooltipWithCmd name={'Navigate forward'} cmd={'Alt+→'} />}>
                  <Icon
                    size={16}
                    className={ClassName.flatButton(4, '5px')}
                    name={'park-arrow-right'}
                    onClick={() => {
                      instance.navigateOps?.forward()
                    }}
                  />
                </Tooltip>
              )}
              <div style={{ height: '20px', margin: 'auto 0', background: Colors.Background.Border, width: 1 }}></div>
            </>
          )}
          <Tooltip content={<TooltipWithCmd name={'Drag mode'} cmd={'Cmd+D'} />}>
            <Icon
              onClick={() => {
                setPdfState(s => ({ ...s, handDrag: !s.handDrag }))
              }}
              size={16}
              containerStyle={{
                background: pdfState.handDrag ? Colors.Common.SelectColorTransparent : undefined
              }}
              className={ClassName.flatButton(6, '5px')}
              name={'park-hand-drag'}
            />
          </Tooltip>
          <Icon
            onClick={() => {
              if (pdf) {
                ObjectStore('pdf').updateOne({ id: pdf.id, doublePage: !pdf?.doublePage })
              }
            }}
            size={16}
            containerStyle={{
              background: pdf?.doublePage ? Colors.Common.SelectColorTransparent : undefined
            }}
            className={ClassName.flatButton(4, '5px')}
            name={'custom-double-column'}
          />
          <Tooltip content={<TooltipWithCmd name={'Fit width'} cmd={'Shift+F'} />}>
            <Icon
              size={16}
              className={ClassName.flatButton(4, '5px')}
              name={'park-auto-width'}
              onClick={() => {
                instance.actionOps?.fitWidth()
              }}
            />
          </Tooltip>
          <Tooltip content={<TooltipWithCmd name={'Zoom in'} cmd={'Cmd+='} />}>
            <Icon
              size={16}
              className={ClassName.flatButton(4, '5px')}
              name={'park-zoom-in'}
              onClick={() => {
                instance.actionOps?.zoomIn()
              }}
            />
          </Tooltip>
          <Tooltip content={<TooltipWithCmd name={'Zoom out'} cmd={'Cmd+-'} />}>
            <Icon
              size={16}
              className={ClassName.flatButton(4, '5px')}
              name={'park-zoom-out'}
              onClick={() => {
                instance.actionOps?.zoomOut()
              }}
            />
          </Tooltip>
          <Icon
            size={16}
            tooltip={<TooltipWithCmd name={'Clip'} cmd={'Cmd+Alt+A'}></TooltipWithCmd>}
            className={ClassName.flatButton(4, '5px')}
            name={'park-screenshot'}
            containerStyle={{
              background: pdfState.croppingImage ? Colors.Common.SelectColorTransparent : undefined
            }}
            onClick={() => {
              setPdfState(s => ({ ...s, croppingImage: !s.croppingImage }))
            }}
          />
          <div style={{ height: '20px', margin: 'auto 0', background: Colors.Background.Border, width: 1 }}></div>
          <Icon
            name={'custom-right-bar'}
            size={16}
            className={ClassName.flatButton(4, '5px')}
            onClick={() => {
              setBarState(s => ({ ...s, showRightBar: !s.showRightBar }))
            }}
          />
          {/*<Tooltip content={<TooltipWithCmd name={'Search'} cmd={'Cmd+F'} />}>*/}
          {/*  <Icon*/}
          {/*    size={16}*/}
          {/*    className={ClassName.flatButton(6, '5px')}*/}
          {/*    name={'park-search'}*/}
          {/*    onClick={() => {*/}
          {/*      setBarState(s => ({ ...s, rightBarActive: 'search', showRightBar: true }))*/}
          {/*    }}*/}
          {/*  />*/}
          {/*</Tooltip>*/}
          {/*<Tooltip content={<TooltipWithCmd name={'Labels'} cmd={'Cmd+L'} />}>*/}
          {/*  <Icon*/}
          {/*    size={16}*/}
          {/*    className={ClassName.flatButton(6, '5px')}*/}
          {/*    name={'park-label'}*/}
          {/*    onClick={() => {*/}
          {/*      setBarState(s => ({ ...s, rightBarActive: 'label', showRightBar: true }))*/}
          {/*    }}*/}
          {/*  />*/}
          {/*</Tooltip>*/}
          {/*<Icon*/}
          {/*  name={'custom-magic'}*/}
          {/*  onClick={() => {*/}
          {/*    setBarState(s => ({ ...s, rightBarActive: 'ai', showRightBar: true }))*/}
          {/*  }}*/}
          {/*  size={16}*/}
          {/*  className={ClassName.flatButton(6, '5px')}*/}
          {/*/>*/}
        </Content>
      </Content>
    )
  }
}

export default PdfHeader
