import { AnimatePopover } from '@/components'
import ColorPicker from '@/components/picker/colorPicker'
import { CSSProperties, FC, ReactNode, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import BorderInput from '../BorderInput'
import Content from '../Content'
import WithBorder from '../WithBorder'
import { useCanSubmit } from './useCanSubmit'

type FormItemConditionalProps = { disable?: boolean } & (
  | {
      onChange?: (value: string) => void
      text: string
      type: 'input' | 'textarea'
      onUpload?: never
      children?: never
      value?: string
      onKeyDown?: React.KeyboardEventHandler
      maxRows?: number
      maxLength?: number
      minRows?: number
      minLength?: number
      autoFocus?: boolean
    }
  | {
      type: 'file'
      onChange?: never
      text?: never
      onUpload: (file: File) => void
      children?: never
      value?: string
    }
  | {
      type: 'colorPicker'
      onChange?: (color: string) => void
      text?: string
      onUpload?: never
      children?: never
      value?: string
    }
  | {
      type: 'component'
      onChange?: never
      text?: string
      onUpload?: never
      children: ReactNode
      value?: string
    }
)
interface FormItemCommonProps {
  type: 'input' | 'textarea' | 'file' | 'colorPicker' | 'component'
  requireMessage?: string
  required?: boolean
  style?: CSSProperties
}
type FormItemProps = FormItemCommonProps & FormItemConditionalProps
const FormItem: FC<FormItemProps> = ({ onChange, onUpload, text, type, children, required, requireMessage, value, disable, ...rest }) => {
  const [innerValue, setInnerValue] = useState<File | string>()
  const [color, setColor] = useState<string>()
  const [colorPickerVisible, setColorPickerVisible] = useState(false)
  const [, setCanSubmit] = useCanSubmit()
  const isEmpty = innerValue === '' || innerValue === undefined || innerValue === null

  useEffect(() => {
    if (type === 'component') {
      return
    }
    if (isEmpty) {
      setCanSubmit(false)
    } else {
      setCanSubmit(true)
    }
  }, [innerValue])
  const childrenRenderer = () => {
    switch (type) {
      case 'input': {
        return (
          <BorderInput
            value={value}
            autoFocus={rest.autoFocus}
            spellCheck="false"
            defaultValue={value}
            style={{ height: 40, ...rest.style }}
            textarea={false}
            placeholder={text}
            onKeyDown={rest.onKeyDown}
            disable={disable}
            onChange={e => {
              onChange?.(e)
              setInnerValue(e)
            }}
          ></BorderInput>
        )
      }
      case 'textarea': {
        const { maxRows, maxLength, minRows = 2, autoFocus } = rest
        return (
          <BorderInput
            value={value}
            defaultValue={value}
            onKeyDown={rest.onKeyDown}
            textarea={true}
            style={{ height: 40, ...rest.style }}
            placeholder={text}
            disable={disable}
            spellCheck="false"
            maxRows={maxRows}
            autoFocus={autoFocus}
            maxLength={maxLength}
            minRows={minRows}
            onChange={e => {
              onChange?.(e)
              setInnerValue(e)
            }}
          ></BorderInput>
        )
      }

      case 'colorPicker':
        return (
          <Content flex alignItems="center" justifyContent="space-between">
            <span>{text}</span>
            <AnimatePopover
              containerStyle={{ zIndex: '999' }}
              padding={10}
              visible={colorPickerVisible}
              content={
                <WithBorder>
                  <ColorPicker
                    onPick={color => {
                      setColorPickerVisible(false)
                      setInnerValue(color)
                      onChange?.(color)
                    }}
                  />
                </WithBorder>
              }
            >
              <div
                onClick={() => setColorPickerVisible(!colorPickerVisible)}
                style={{
                  backgroundColor: color ?? 'white',
                  width: 40,
                  height: 25,
                  borderRadius: 4,
                  border: '1px solid #eee',
                  cursor: 'pointer'
                }}
              ></div>
            </AnimatePopover>
          </Content>
        )
      case 'component':
        return children
      default:
        return null
    }
  }

  return childrenRenderer()
}

export default FormItem
