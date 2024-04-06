import { Content } from '@/components'
import { useTranslation } from 'react-i18next'
import { memo, useEffect, useState } from 'react'
import { useDebounceEffect } from '@/hooks'
import AutosizeTextarea from '@/components/custom/input/AutoSizeTextArea'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'

export default memo(({ name, onRename }: { name?: string; onRename?: (n: string) => void }) => {
  const [innerName, setInnerName] = useState(name)
  useEffect(() => {
    setInnerName(name)
  }, [name])
  useDebounceEffect(
    () => {
      if (innerName !== name) {
        onRename?.(innerName || '')
      }
    },
    [innerName],
    { wait: 200 }
  )
  const { t } = useTranslation()
  return (
    <AutosizeTextarea
      placeholder={t('general.untitled')}
      value={innerName}
      onChange={e => {
        setInnerName(e)
      }}
      onKeyDown={e => {
        if (isHotkey(KEY.Enter, e)) {
          e.preventDefault()
          e.currentTarget.blur()
        }
      }}
      className={'focus-input ellipsis-font-1'}
      spellCheck={'false'}
      style={{
        borderRadius: 4,
        position: 'absolute',
        left: 16,
        top: 16,
        fontSize: 14,
        maxWidth: '240px',
        whiteSpace: 'nowrap',
        zIndex: 20,
        padding: '4px 8px',
        fontWeight: 500
      }}
    ></AutosizeTextarea>
  )
})
