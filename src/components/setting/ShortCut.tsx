import { KEY } from '@/consts/key'
import ClassName from '@/styles/classNames'
import produce from 'immer'
import isHotkey from 'is-hotkey'
import _ from 'lodash'
import { memo, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Content, Icon } from '../base'
import SettingItem from './Item'
import { IShortCutSetting, useSetting } from './Main'

const shortCutNameToTitle: Record<keyof IShortCutSetting['shortcut'], string> = {
  openObjectPanel: 'open quick object panel',
  quickCreateObject: 'open create object form',
  openScreenShot: 'open screen shot'
}
const ShortCutSetting = () => {
  const { t } = useTranslation()
  const globalItems: SettingItem[] = [
    {
      title: t(`settings.${shortCutNameToTitle['openObjectPanel']}`),
      children: <ShortCutItem shortCutName="openObjectPanel" />
    },
    {
      title: t(`settings.${shortCutNameToTitle['quickCreateObject']}`),
      children: <ShortCutItem shortCutName="quickCreateObject" />
    },
    {
      title: t(`settings.${shortCutNameToTitle['openScreenShot']}`),
      children: <ShortCutItem shortCutName="openScreenShot" />
    }
  ]

  return (
    <>
      <div className={ClassName.title('18px')}>{t('settings.global shortcuts')}</div>
      {globalItems.map(i => (
        <SettingItem titleSize={14} key={i.title} {...i} />
      ))}
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
            const { ctrlKey, altKey, shiftKey, key } = e
            let realKey: string | undefined = key
            if ([KEY.Alt, KEY.Shift, KEY.Control].includes(key)) {
              realKey = undefined
            }
            draft.shortcut[shortCutName] = {
              ctrlKey,
              altKey,
              shiftKey,
              key: realKey
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
    const { ctrlKey, altKey, shiftKey, key } = shortCut
    return `${ctrlKey ? 'Ctrl + ' : ''}${altKey ? 'Alt + ' : ''}${shiftKey ? 'Shift + ' : ''}${
      key ? key?.charAt(0).toUpperCase() + key?.slice(1) : ''
    }`
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
