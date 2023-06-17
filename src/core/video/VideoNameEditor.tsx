import { Content, Icon } from '@/components'
import { KEY } from '@/consts'
import Colors from '@/consts/colors'
import ClassName from '@/styles/classNames'
import isHotkey from 'is-hotkey'
import { CSSProperties, useRef, useState } from 'react'

const NameEditor = ({ value, onChange, style }: { value: string; onChange: (v: string) => void; style?: CSSProperties }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [innerValue, setInnerValue] = useState(value)
  return (
    <Content
      onClick={e => e.stopPropagation()}
      style={{ border: `1px solid ${Colors.Background.Border}`, padding: '2px 4px', borderRadius: 6, ...style }}
      flex
      alignItems="center"
    >
      <input
        style={{
          flex: 1,
          width: '100%'
        }}
        autoFocus
        className={ClassName.noStyleInput}
        ref={inputRef}
        defaultValue={value}
        onChange={e => setInnerValue(e.target.value)}
        onKeyDown={e => {
          if (isHotkey(KEY.Enter, e)) {
            onChange(innerValue)
          }
        }}
      ></input>
      <Icon
        containerStyle={{ flexShrink: 0 }}
        onClick={() => onChange(innerValue)}
        className={ClassName.circleButton(2)}
        name="park-check"
      />
    </Content>
  )
}

export default NameEditor
