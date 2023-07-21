import { KEY } from "@/consts/key";
import ClassName from "@/styles/classNames";
import { css } from "@emotion/css";
import { isHotkey } from "is-hotkey";
import { Provider } from "jotai";
import { CSSProperties, FC, useEffect } from "react";
import Content from "../Content";
import Footer from "../Footer";
import FormItem from "./FormItem";
import { useCanSubmit } from "./useCanSubmit";
import { useIsSubmitted } from "./useIsSubmitted";

interface FormProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  onBack?: () => void;
  onSubmit?: () => void;
  style?: CSSProperties;
  submitText?: string;
  backText?: string;
  extra?: React.ReactNode;
}
interface IForm extends FC<FormProps> {
  Item: typeof FormItem
}
const InnerForm: FC<FormProps> = ({ children, title, description, onBack, onSubmit, style, backText, submitText, extra }) => {
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
        <Content
          flex
          alignItems="center"
          justifyContent="space-between"
          style={{ borderBottom: '1px solid rgba(31,34,37,0.06)', paddingBottom: 8 }}
        >
          <div className={ClassName.title('14px')}>{title}</div>
          {extra}
        </Content>
        {description && <div className={ClassName.description()}>{description}</div>}
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
