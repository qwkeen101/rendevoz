import { ObjectStore } from '@/api/stores'
import { Content, Icon, Markdown } from '@/components'

const MessageContentDisplayer = ({ id }: { id?: number }) => {
  const message = ObjectStore('message').useValue(id)
  if (message && typeof message.content === 'string' && message.content) {
    return (
      <div className={'font-size-12 p-3'}>
        <Markdown className={'markdown'}>{message.content}</Markdown>
      </div>
    )
  }
  return (
    <Content flex centered fullHeight fullWidth>
      <Icon name={Global.utils.getIcon('message')} size={36} />
    </Content>
  )
}

export default MessageContentDisplayer
