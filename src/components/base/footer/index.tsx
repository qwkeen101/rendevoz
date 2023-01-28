import { Noop } from '@/common/types'
import { Button } from '@/components/base/button'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import Content from '../Content'
import styles from './index.module.less'

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
      <Button className={styles.back} onClick={onBack}>
        {t(`footer.${backText}`)}
      </Button>
      <Button className={styles.submit} onClick={onSubmit}>
        {t(`footer.${submitText}`) }
      </Button>
    </Content>
  )
}

export default Footer
