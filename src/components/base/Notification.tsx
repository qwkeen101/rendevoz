import ClassName from '@/styles/classNames'
import { ReactNode } from 'react'
import Content from './Content'

interface NotificationProps {
  title?: string | ReactNode
  content?: string | ReactNode
}

const Notification = ({ title, content }: NotificationProps) => {
  return (
    <Content flex column>
      <div className={ClassName.title('14px')}>{title}</div>
      {typeof content === 'string' ? <div className={ClassName.description('13px')}>{content}</div> : content}
    </Content>
  )
}

export default Notification
