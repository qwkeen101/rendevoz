import { Noop } from '@/common/types'
import { Button } from '@/components/base/button'
import { css } from '@emotion/css'
import { CSSProperties, FC } from 'react'
import { useTranslation } from 'react-i18next'
import Content from './Content'

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
      <Button
        style={{
          padding: '6px 18px',
          boxShadow: 'none',
          marginRight: 30,
          ...buttonStyle
        }}
        onClick={onBack}
      >
        {t(`footer.${backText}`)}
      </Button>
      <Button
        style={{
          boxShadow: 'none',
          padding: '6px 18px',
          borderRadius: 6,
          ...buttonStyle
        }}
        onClick={onSubmit}
      >
        {t(`footer.${submitText}`)}
      </Button>
    </Content>
  )
}

export default Footer
