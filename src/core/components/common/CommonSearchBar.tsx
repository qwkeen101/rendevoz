// search through library, favourite, folders

import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import React, { memo, useRef, useState } from 'react'
import { AnimatePopover, BetterInput, Icon, Menu, Modal, WithBorder } from '@/components'
import { Icons, KEY } from '@/consts'
import isHotkey from 'is-hotkey'
import { IMenuLayoutItem } from '@/components/base/menu'

export default memo(
  ({
    search = '',
    onSearchChange,
    onOptionChange,
    options
  }: {
    search?: string
    onSearchChange: (v: string) => void
    options?: IMenuLayoutItem[]
    onOptionChange?: (key: string | undefined) => void
  }) => {
    const ref = useRef<HTMLInputElement>(null)
    const { t } = useTranslation()
    const [visible, setVisible] = useState(false)
    return (
      <>
        <AnimatePopover
          positions={['bottom']}
          visible={visible && (options?.length ?? 0) > 0}
          padding={5}
          withClickCover
          content={
            <WithBorder style={{ width: 360 }}>
              <Menu.NavigationMenu
                className={'py-1'}
                layout={options ?? []}
                onSelect={v => {
                  ref.current?.blur()
                  onOptionChange?.(v.key)
                  setVisible(false)
                }}
              />
            </WithBorder>
          }
        >
          <div
            onClick={e => {
              e.currentTarget.querySelector('input')?.focus()
            }}
            style={{ flex: '0 1 360px', height: 34, appRegion: 'no-drag', background: 'var(--background-base)' }}
            className={'mx-3 cursor-text rounded-3xl transparent-font px-3 items-center gap-3 flex'}
          >
            <Icon size={16} name={Icons.Search} />
            <BetterInput
              value={search}
              onChange={e => onSearchChange?.(e.target.value)}
              className='flex-1'
              onBlur={() => setVisible(false)}
              ref={ref}
              onKeyDown={e => {
                if (isHotkey(KEY.Enter, e)) {
                  onOptionChange?.(undefined)
                  ref.current?.blur()
                  setVisible(false)
                }
              }}
              onFocus={() => setVisible(true)}
              placeholder={t(trans.Search)}
            ></BetterInput>
          </div>
        </AnimatePopover>
      </>
    )
  }
)
