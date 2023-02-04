import { Noop } from '@/common/types'
import { Button } from '@/components/base/button'
import { css } from '@emotion/css'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import Content from './Content'

interface FooterProps {
  submitText?: string
  backText?: string
  onSubmit?: Noop
  onBack?: Noop
}
const Footer: FC<FooterProps> = ({ onBack, onSubmit, submitText = 'submit', backText = 'back' }) => {
  const { t } = useTranslation()
  return (
    <Content flex alignItems="center" justifyContent="space-between">
      <Button
        style={{
          color: '#64707d',
          background: 'transparent',
          padding: '6px 18px 6px 6px',
          boxShadow: 'none',
          marginRight: 30
        }}
        onClick={onBack}
      >
        {t(`footer.${backText}`)}
      </Button>
      <Button
        style={{
          background: '#8590ae',
          boxShadow: 'none',
          padding: '6px 18px',
          borderRadius: 6
        }}
        onClick={onSubmit}
      >
        {t(`footer.${submitText}`)}
      </Button>
    </Content>
  )
}

export default Footer
