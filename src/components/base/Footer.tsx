import { Noop } from '@/common/types'
import { Button } from '@/components/base/button'
import { CSSProperties, FC } from 'react'
import { useTranslation } from 'react-i18next'
import Content from './Content'
import { ClassName } from 'rendevoz'
import classnames from 'classnames'

interface FooterProps {
  submitText?: string
  backText?: string
  onSubmit?: Noop
  onBack?: Noop
  buttonStyle?: CSSProperties
}
const Footer: FC<FooterProps> = ({ onBack, onSubmit, submitText = 'submit', backText = 'back', buttonStyle }) => {
  const { t } = useTranslation()
  return (
    <Content flex alignItems="center" justifyContent="space-between">
      <div
        className={classnames(ClassName.flatButton(), 'border-box-shadow')}
        style={{
          padding: '3px 12px',
          marginRight: 30,
          fontWeight: 500,
          ...buttonStyle
        }}
        onClick={onBack}
      >
        {t(`footer.${backText}`)}
      </div>
      <div
        className={ClassName.selectButton()}
        style={{
          padding: '3px 12px',
          borderRadius: 6,
          ...buttonStyle
        }}
        onClick={onSubmit}
      >
        {t(`footer.${submitText}`)}
      </div>
    </Content>
  )
}

export default Footer
