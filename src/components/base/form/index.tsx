import { KEY } from '@/consts/key'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import isHotkey from 'is-hotkey'
import { Provider } from 'jotai'
import { CSSProperties, FC, useEffect } from 'react'
import Content from '../Content'
import Footer from '../Footer'
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
    <div
      className={css({
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      })}
      style={style}
    >
      <Content flex column gap={16}>
        <div
          className={ClassName.title('14px')}
          style={{ paddingBottom: 8, textTransform: 'capitalize', borderBottom: '1px solid rgba(31,34,37,0.06)' }}
        >
          {title}
        </div>
        {description && <div className={styles.description}>{description}</div>}
        {children}
      </Content>
      <Footer
        backText={backText}
        submitText={submitText}
        onBack={onBack}
        onSubmit={() => {
          onSubmit?.()
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
