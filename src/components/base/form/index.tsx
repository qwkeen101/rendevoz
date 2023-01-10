import { Button } from '@/components/base/button'
import { KEY } from '@/consts/key'
import isHotkey from 'is-hotkey'
import { Provider } from 'jotai'
import { createContext, CSSProperties, FC, useEffect, useState } from 'react'
import Content from '../Content'
import Footer from '../footer'
import FormItem from './FormItem'
import styles from './index.module.less'
import { useCanSubmit } from './useCanSubmit'
import { useIsSubmitted } from './useIsSubmitted'

interface FormProps {
  children: React.ReactNode
  title: string
  description?: string
  onBack?: () => void
  onSubmit?: () => void
  style?: CSSProperties
  submitText?: string
  backText?: string
}
interface IForm extends FC<FormProps> {
  Item: typeof FormItem
}
const InnerForm: FC<FormProps> = ({ children, title, description, onBack, onSubmit, style, backText, submitText }) => {
  const [, setIsSubmitted] = useIsSubmitted()
  const [canSubmit] = useCanSubmit()
  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      if (isHotkey(KEY.Enter, e)) {
        if (canSubmit) {
          onSubmit?.()
        }
        setIsSubmitted(true)
      }
    }
    document.addEventListener('keydown', keydownHandler)
    return () => {
      document.removeEventListener('keydown', keydownHandler)
    }
  })
  return (
    <div className={styles.form} style={style}>
      <Content flex column>
        <div className={styles.title}>{title}</div>
        {description && <div className={styles.description}>{description}</div>}
        {children}
      </Content>
      <Footer
        backText={backText}
        submitText={submitText}
        onBack={onBack}
        onSubmit={() => {
          if (canSubmit) {
            onSubmit?.()
          }
          setIsSubmitted(true)
        }}
      />
    </div>
  )
}
const Form: IForm = props => (
  <Provider>
    <InnerForm {...props} />
  </Provider>
)
Form.Item = FormItem
export default Form
