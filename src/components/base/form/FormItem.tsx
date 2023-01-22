import { AnimatePopover } from '@/components'
import ColorPicker from '@/components/picker/colorPicker'
import classNames from 'classnames'
import { FC, ReactNode, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import BorderInput from '../BorderInput'
import Content from '../Content'
import WithBorder from '../WithBorder'
import styles from './index.module.less'
import { useCanSubmit } from './useCanSubmit'
import { useIsSubmitted } from './useIsSubmitted'

type FormItemConditionalProps =
  | {
      onChange?: (value: string) => void
      text: string
      type: 'input' | 'textarea'
      onUpload?: never
      children?: never
      value?: string
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
interface FormItemCommonProps {
  type: 'input' | 'textarea' | 'file' | 'colorPicker' | 'component'
  requireMessage?: string
  required?: boolean
}
type FormItemProps = FormItemCommonProps & FormItemConditionalProps
const FormItem: FC<FormItemProps> = ({ onChange, onUpload, text, type, children, required, requireMessage, value }) => {
  const { t } = useTranslation()
  const [innerValue, setInnerValue] = useState<File | string>()
  const [color, setColor] = useState<string>()
  const [colorPickerVisible, setColorPickerVisible] = useState(false)
  const [, setCanSubmit] = useCanSubmit()
  const fileUploaderRef = useRef<HTMLInputElement>(null)
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
      case 'input':
      case 'textarea':
        return (
          <BorderInput
            value={value}
            defaultValue={value}
            textarea={type === 'textarea'}
            style={{ height: 40 }}
            placeholder={text}
            onChange={e => {
              onChange?.(e)
              setInnerValue(e)
            }}
          ></BorderInput>
        )
      case 'file': {
        const file = innerValue as File | undefined
        return (
          <div className={styles.file}>
            {file ? <span>Filename: {file.name}</span> : <span>Upload File</span>}
            {file ? (
              <button onClick={e => setInnerValue(undefined)} className={styles.button}>
                Cancel
              </button>
            ) : (
              <>
                <button className={styles.button} onClick={e => fileUploaderRef.current?.click()}>
                  {t('form.upload')}
                </button>
                <input
                  ref={fileUploaderRef}
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setInnerValue(file)
                      onUpload?.(file)
                    }
                  }}
                  type="file"
                />
              </>
            )}
          </div>
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
