import { Noop } from '@/common/types'
import { Button } from '@/components/base/button'
import { FC } from 'react'
import Content from '../Content'
import styles from './index.module.less'

interface FooterProps {
  submitText?: string
  backText?: string
  onSubmit?: Noop
  onBack?: Noop
}
const Footer: FC<FooterProps> = ({ onBack, onSubmit,submitText = 'Submit',backText = 'Back' }) => {
  return (
    <Content flex alignItems="center" justifyContent="space-between">
      <Button className={styles.back} onClick={onBack}>
        {backText}
      </Button>
      <Button className={styles.submit} onClick={onSubmit}>
        {submitText}
      </Button>
    </Content>
  )
}

export default Footer
