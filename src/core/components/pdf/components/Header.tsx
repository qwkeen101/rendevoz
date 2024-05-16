import { MetaStore, ObjectStore } from '@/api/stores'
import { AnimatePopover, Content, Icon, Menu, Tooltip, WithBorder } from '@/components'
import { ClassName } from 'rendevoz'
import usePDFBarState from '@/core/components/pdf/hooks/usePDFBarState'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import { Colors, KEY } from '@/consts'
import { useIsIn } from '@/hooks'
import { useEffect, useState } from 'react'
import isHotkey from 'is-hotkey'
import { useMeasure } from 'react-use'
import usePdfState from '@/core/components/pdf/hooks/usePdfState'
import TooltipWithCmd from '@/components/TooltipWithCmd'
import { useTranslation } from 'react-i18next'

const Header = ({ id }: { id: number }) => {
  const pdf = ObjectStore('pdf').useValue(id)
  const pdfMeta = MetaStore.useObjectToMetaValue(id)
  const [barState, setBarState] = usePDFBarState()
  const [pdfState, setPdfState] = usePdfState()
  const totalPages = pdfState.numPages
  const instance = usePDFInstance()
  const [focused, setFocused] = useState(false)
  const { t } = useTranslation()
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
          padding: '12px',
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
          <AnimatePopover
            boundaryInset={0}
            padding={5}
            positions={['bottom']}
            align={'start'}
            content={setV => (
              <WithBorder padding={'0.2rem 0 0.4rem'}>
                <Menu.NavigationMenu
                  defaultSelected={[barState.sidebarActive]}
                  onSelect={v => {
                    setV(false)
                    if (v?.type === 'item') {
                      setBarState(s => ({ ...s, sidebarActive: v.key }))
                    }
                  }}
                  layout={[
                    {
                      type: 'title',
                      name: t('general.Sidebar')
                    },
                    {
                      type: 'item',
                      key: 'hide',
                      text: t('general.Hide sidebar')
                    },
                    {
                      type: 'item',
                      key: 'label',
                      text: t('general.Highlights')
                    },
                    {
                      type: 'item',
                      key: 'thumbnail',
                      text: t('general.Thumbnail')
                    },
                    {
                      type: 'item',
                      key: 'outline',
                      text: t('general.Contents')
                    },
                    {
                      type: 'item',
                      key: 'search',
                      text: t('general.Search')
                    },
                    {
                      type: 'item',
                      key: 'ai',
                      text: t('general.AI')
                    },
                    {
                      type: 'item',
                      key: 'mindmap',
                      text: t('general.Mindmap')
                    }
                  ]}
                />
              </WithBorder>
            )}
          >
            <Content flex gap={4} className={ClassName.flatButton(4, '5px')}>
              <Icon size={16} name={'custom-left-bar'} />
              <Icon size={14} name={'park-down'} />
            </Content>
          </AnimatePopover>
          {width > 600 && <div className={ClassName.ellipsisFont(1)}>{pdfMeta.name}</div>}
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
              if (totalPages && num > totalPages) {
                setPageValue(totalPages)
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
          / {totalPages || 0}
          <Content flex gap={4} style={{ opacity: isInPages || focused ? 1 : 0, transition: 'opacity 0.2s ease', marginLeft: 8 }}>
            <Icon
              name={'park-plus'}
              className={ClassName.flatButton(4, '4px')}
              onClick={() => {
                const next = Math.min(pageValue + 1, totalPages || 1)
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
              strokeWidth={3}
              onClick={() => {
                setPdfState(s => ({ ...s, handDrag: !s.handDrag }))
              }}
              size={16}
              style={{
                color: pdfState.handDrag ? Colors.Common.SelectColor : undefined,
                background: pdfState.handDrag ? Colors.Common.SelectColorTransparentLight : undefined
              }}
              className={ClassName.flatButton(4, '5px')}
              name={'park-hand-drag'}
            />
          </Tooltip>
          <Icon
            onClick={() => {
              if (pdf) {
                instance.actionOps?.doublePage()
              }
            }}
            size={16}
            style={{
              color: pdfState.state?.doublePage ? Colors.Common.SelectColor : undefined,
              background: pdfState.state?.doublePage ? Colors.Common.SelectColorTransparentLight : undefined
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
            style={{
              color: pdfState.croppingImage ? Colors.Common.SelectColor : undefined,
              background: pdfState.croppingImage ? Colors.Common.SelectColorTransparentLight : undefined
            }}
            onClick={() => {
              setPdfState(s => ({ ...s, croppingImage: !s.croppingImage }))
            }}
          />
        </Content>
      </Content>
    )
  }
}

export default Header
