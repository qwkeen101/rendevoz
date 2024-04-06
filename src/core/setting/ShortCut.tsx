import { KEY } from '@/consts/key'
import ClassName from '@/styles/classNames'
import produce from 'immer'
import isHotkey from 'is-hotkey'
import _ from 'lodash'
import { memo, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Content, Icon } from '../../components/base'
import { ISettingItem } from './SettingItem'
import { useSetting } from '.'
import { IShortCutSetting } from './types'
import SettingGroup from '@/core/setting/SettingGroup'

const shortCutNameToTitle = {
  function: {
    openSidebar: 'Open sidebar',
    openObjectPanel: 'Open object details',
    quickCreateObject: 'Create object',
    openScreenShot: 'open screen shot',
    openTranslatePanel: 'open translate panel',
    openGlobalSearch: 'open global text search'
  },
  layout: {
    closeCurrentTab: 'Close current focused tab',
    closeOtherTabs: 'Close other tabs',
    closeRightTabs: 'Close right tabs',
    closeLeftTabs: 'Close left tabs',
    switchToPrevTab: 'Switch to previous tab',
    switchToNextTab: 'Switch to next tab'
  },
  video: {
    makeVideoLabel: 'make video label',
    copyVideoTimestamp: 'Copy video timestamp',
    openMediaSidebar: 'Open sidebar'
  }
}

const ShortCutSetting = () => {
  const { t } = useTranslation()
  const functionItems: ISettingItem[] = Object.entries(shortCutNameToTitle.function).map(entry => ({
    title: t(`settings.${entry[1]}`),
    children: <ShortCutItem shortCutName={entry[0]} />
  }))
  const layoutItems: ISettingItem[] = Object.entries(shortCutNameToTitle.layout).map(entry => ({
    title: t(`settings.${entry[1]}`),
    children: <ShortCutItem shortCutName={entry[0]} />
  }))
  const videoItems: ISettingItem[] = Object.entries(shortCutNameToTitle.video).map(entry => ({
    title: t(`settings.${entry[1]}`),
    children: <ShortCutItem shortCutName={entry[0]} />
  }))
  return (
    <>
      <SettingGroup title={t('settings.Function shortcuts')} layout={functionItems} />
      <SettingGroup title={t('settings.Layout shortcuts')} layout={layoutItems} />
      <SettingGroup title={t('settings.video shortcuts')} layout={videoItems} />
    </>
  )
}

const ShortCutItem = memo(({ shortCutName }: { shortCutName: keyof IShortCutSetting['shortcut'] }) => {
  const [setting, setSetting] = useSetting()
  const shortCut = setting.shortcut?.[shortCutName]
  const [isSelected, setIsSelected] = useState(false)
  const [conflictState, setConflictState] = useState<
    Partial<{
      isConflicted: boolean
      conflictWith: string[]
    }>
  >({
    isConflicted: false
  })
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (isSelected) {
      const keyDownHandler = (e: KeyboardEvent) => {
        console.log(e)
        e.preventDefault()
        e.stopPropagation()
        if (isHotkey(KEY.Enter, e)) {
          const key = setting.shortcut[shortCutName]?.key
          if (!key || key === '') {
            setSetting(s =>
              produce(s, draft => {
                draft.shortcut[shortCutName] = null
              })
            )
          }
          setIsSelected(false)
          return
        }
        setSetting(s =>
          produce(s, draft => {
            const { ctrlKey, altKey, shiftKey, key, metaKey } = e

            let realKey: string | undefined = key
            if ([KEY.Alt, KEY.Shift, KEY.Control, KEY.Meta].includes(key)) {
              realKey = undefined
            }

            draft.shortcut[shortCutName] = {
              ctrlKey,
              altKey,
              shiftKey,
              metaKey,
              key: realKey,
              displayKey: realKey ? String.fromCharCode(e.keyCode) : undefined
            }
          })
        )
      }
      const clickHandler = (e: PointerEvent) => {
        if (!containerRef.current?.contains(e.target as HTMLElement)) {
          const key = setting.shortcut[shortCutName]?.key
          if (!key || key === '') {
            setSetting(s =>
              produce(s, draft => {
                draft.shortcut[shortCutName] = null
              })
            )
          }
          setIsSelected(false)
        }
      }
      document.addEventListener('keydown', keyDownHandler, true)
      document.addEventListener('pointerup', clickHandler)
      return () => {
        document.removeEventListener('keydown', keyDownHandler, true)
        document.removeEventListener('pointerup', clickHandler)
      }
    }
  }, [isSelected, setting])
  useEffect(() => {
    const conflictItems = Object.entries(setting.shortcut).filter(([k, v]) => k !== shortCutName && v !== null && _.isEqual(v, shortCut))
    if (conflictItems.length > 0) {
      setConflictState({
        isConflicted: true,
        conflictWith: conflictItems.map(i => shortCutNameToTitle[i[0]])
      })
    } else {
      setConflictState({
        isConflicted: false
      })
    }
  }, [shortCut, setting])
  const renderKey = () => {
    if (!shortCut) return 'Not Set'
    const { ctrlKey, altKey, shiftKey, key, metaKey, displayKey } = shortCut

    return `${ctrlKey ? 'Ctrl + ' : ''}${metaKey ? 'Meta + ' : ''}${altKey ? 'Alt + ' : ''}${shiftKey ? 'Shift + ' : ''}${key ? key : ''}`
  }
  return (
    <Content flex gap={10} ref={containerRef} alignItems="center">
      {conflictState.isConflicted && conflictState.conflictWith && (
        <div style={{ display: 'flex', gap: 10 }} className={ClassName.description()}>
          <span>Conflict with :</span>
          {conflictState.conflictWith?.length > 1 ? `${conflictState.conflictWith?.length} Shortcuts` : conflictState.conflictWith[0]}
        </div>
      )}
      <div
        onClick={() => {
          setIsSelected(true)
        }}
        style={{
          borderRadius: 4,
          padding: '4px 12px',
          width: 'fit-content',
          background: conflictState.isConflicted ? '#F55050' : '#E9E8E8',
          color: conflictState.isConflicted ? 'white' : 'black',
          cursor: 'pointer',
          textTransform: 'capitalize',
          outline: isSelected ? '1px solid #8590ae' : undefined
        }}
      >
        {renderKey()}
      </div>
      {isSelected && (
        <Icon
          className={ClassName.circleButton()}
          name="park-delete"
          onClick={() => {
            setSetting(s =>
              produce(s, draft => {
                draft.shortcut[shortCutName] = null
              })
            )
          }}
        />
      )}
    </Content>
  )
})
export default ShortCutSetting
