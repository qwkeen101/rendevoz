import { ObjectStore } from '@/api/stores'
import { Content, Icon } from '@/components'
import ChatMessage from '@/core/ai/chat/message/ChatMessage'

const ChatContentDisplayer = ({ id }: { id?: number }) => {
  const chat = ObjectStore('chat').useValue(id)
  const messages = chat?.messages.slice(0, 5)
  if (messages?.length) {
    return (
      <div className={'font-size-12 flex flex-col gap-3 p-3'}>
        {messages.map(i => (
          <ChatMessage className={'!py-0'} lineClamp={'line-clamp-3'} showSource={false} id={i} key={i} noToolbar />
        ))}
      </div>
    )
  }
  return (
    <Content flex centered fullHeight fullWidth>
      <Icon name={Global.utils.getIcon('chat')} size={36} />
    </Content>
  )
}

export default ChatContentDisplayer
