import { Icon, Tooltip } from '@/components'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import { Colors, Icons, KEY } from '@/consts'
import { useIsIn } from '@/hooks'
import { useEffect, useState } from 'react'
import isHotkey from 'is-hotkey'
import usePDFState from '@/core/components/pdf/hooks/usePDFState'
import TooltipWithCmd from '@/components/TooltipWithCmd'
import { useTranslation } from 'react-i18next'
import classnames from 'classnames'
import trans from '@/consts/trans'

const Header = () => {
  const { t } = useTranslation()
  const [state, setState] = usePDFState()
  const lastReadPage = state.state?.initialPage
  const totalPages = state.numPages
  const instance = usePDFInstance()
  const [focused, setFocused] = useState(false)
  const [pageValue, setPageValue] = useState((lastReadPage || 0) + 1)
  const { ref: pagesRef, isIn: isInPages } = useIsIn()
  const handleJump = () => {
    if (pageValue >= 0) {
      instance.navigateOps?.jumpToPage?.(pageValue - 1)
    } else {
      setPageValue(1)
      instance.navigateOps?.jumpToPage?.(0)
    }
  }
  useEffect(() => {
    const lastPage = (lastReadPage ?? 0) + 1
    let realPageValue = Math.max(state.state?.doublePage ? lastPage - 1 : lastPage, 1)
    if (lastPage === totalPages) {
      realPageValue = totalPages
    }
    setPageValue(realPageValue)
  }, [lastReadPage])
  return (
    <div className={'justify-center bg-global @container z-30 flex w-full items-center gap-1 pl-4 pr-3 py-2 sticky top-0'}>
      <div className={'font-size-13 @3xl:flex-1'}>
        <span className={'@3xl:line-clamp-1 break-all hidden'} style={{ maxWidth: '90%' }}>
          {state.state?.name}
        </span>
      </div>
      <div className={'flex items-center gap-3'}>
        <div
          ref={pagesRef}
          onClick={e => {
            e.currentTarget.querySelector('input')?.focus()
          }}
          className={'items-center transition-all font-size-13 shrink-0 py-1 px-2.5 rounded-md hidden @md:flex'}
          style={{
            boxShadow: focused ? `0 0 0 2px ${Colors.Common.SelectColor}` : isInPages ? `0 0 0 1px ${Colors.Background.Border}` : undefined
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
            style={{
              width: `calc(${(pageValue || 0).toString().length}ch)`,
              appearance: 'textfield'
            }}
            value={pageValue}
            min={1}
            max={totalPages}
            className={'mr-2'}
          />
          / <span className={'ml-2'}>{totalPages || 0}</span>
        </div>
        <div className={'border-right h-6'}></div>
        <div className={'flex gap-2.5 items-center'}>
          <Icon
            size={16}
            className={'square-button-small'}
            onClick={() => {
              instance.actionOps?.zoomOut()
            }}
            name={'park-minus'}
          />
          <div
            className={'cursor-pointer font-semibold font-size-12'}
            onClick={() => {
              instance.actionOps?.fitWidth()
            }}
          >
            {((state.finalScale ?? 1) * 100).toFixed(0)}%
          </div>
          <Icon
            onClick={() => {
              instance.actionOps?.zoomIn()
            }}
            size={16}
            className={'square-button-small'}
            name={'park-plus'}
          />
        </div>
      </div>
      <div className={'flex flex-1 gap-3 justify-end shrink-0 items-center'}>
        <Icon
          tooltip={<TooltipWithCmd name={'Clip'} cmd={'Cmd+A'}></TooltipWithCmd>}
          size={16}
          className={classnames('square-button', state.croppingImage && 'active-button')}
          name={'park-screenshot'}
          onClick={() => {
            setState(s => ({ ...s, croppingImage: !s.croppingImage }))
          }}
        />
        <Icon
          size={16}
          className={classnames('square-button', state.document?.doublePage && 'active-button')}
          name={'park-column'}
          onClick={() => {
            instance.actionOps?.doublePage()
          }}
          tooltip={'Double Page'}
        />
        <Tooltip content={<TooltipWithCmd name={t(trans.Search)} cmd={'Cmd+F'} />}>
          <Icon
            size={16}
            className={'square-button'}
            name={Icons.Search}
            onClick={() => {
              instance.actionOps?.toggleSearch()
            }}
          />
        </Tooltip>
        <Icon
          onClick={() => {
            setState(s => ({ ...s, sidebarVisible: !s.sidebarVisible }))
          }}
          className={'square-button'}
          size={16}
          name={'custom-right-bar'}
        />
      </div>
    </div>
  )
}

export default Header
