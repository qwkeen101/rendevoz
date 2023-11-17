import { useEffect, useState } from 'react'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import Colors from '../../../../consts/colors'

const inputClassName = css({
  padding: '2px 8px',
  lineHeight: 1,
  boxShadow: 'var(--darken-node-color) 0px 0px 0px calc(1px * var(--zoom-level))',
  transition: 'all 0.2s ease',
  letterSpacing: '-0.04px',
  color: 'inherit',
  background: Colors.Background.Linear,
  outline: 'none',
  border: 'none',
  width: '60%',
  minWidth: '200px',
  overflow: 'hidden',
  borderRadius: 6,
  ':focus': {
    boxShadow: 'var(--node-color) 0px 0px 0px calc(1px * var(--zoom-level))'
  }
})

const ChangeNameInput = ({
  name,
  onChange,
  isEditing = false,
  onEditStateChange
}: {
  name: string
  onChange: (name: string) => void
  isEditing?: boolean
  onEditStateChange?: (isEditing: boolean) => void
}) => {
  const [innerName, setInnerName] = useState(name)
  useEffect(() => {
    if (isEditing) {
      setInnerName(name)
    }
  }, [isEditing])
  const keyDownHandler: React.KeyboardEventHandler = e => {
    e.stopPropagation()
    if (isHotkey(KEY.Escape, e)) {
      onEditStateChange?.(false)
    }
    if (isHotkey(KEY.Enter, e)) {
      onEditStateChange?.(false)
      onChange?.(innerName)
    }
  }

  return isEditing ? (
    <input
      spellCheck="false"
      autoFocus
      value={innerName}
      onKeyDownCapture={keyDownHandler}
      className={inputClassName}
      onChange={e => setInnerName(e.target.value)}
    />
  ) : (
    <div className={ClassName.ellipsisFont(1)}>{name || 'Unnamed Group'}</div>
  )
}

export default ChangeNameInput
