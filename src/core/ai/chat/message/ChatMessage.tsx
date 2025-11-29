import { ObjectStore } from '@/api/stores'
import { useTranslation } from 'react-i18next'
import useUpdateIsomorphicLayoutEffect from '@/hooks/utils/useUpdateIsomorphicLayoutEffect'
import ChatAssistantMessageRenderer from '@/core/ai/chat/message/ChatAssistantMessageRenderer'
import ChatUserMessageRenderer from '@/core/ai/chat/message/ChatUserMessageRenderer'
import './shimmer.less'

export default ({
  id,
  prevMessageId,
  nextMessageId,
  onChange,
  noToolbar,
  className,
  showSource = true,
  lineClamp,
  onQuestion,
  onRetry
}: {
  id: number
  prevMessageId?: number
  nextMessageId?: number
  onChange?: VoidFunction
  onRetry?: VoidFunction
  onQuestion?: (id: number) => void
  lineClamp?: string
  noToolbar?: boolean
  showSource?: boolean
  className?: string
}) => {
  const message = ObjectStore('message').useValue(id)
  const prevMessage = ObjectStore('message').useValue(prevMessageId)
  const nextMessage = ObjectStore('message').useValue(nextMessageId)
  const { t } = useTranslation()
  useUpdateIsomorphicLayoutEffect(() => {
    onChange?.()
  }, [message?.content, message?.references, message?.reasoning])
  if (!message) return null
  const renderContextCleared = () => {
    if (noToolbar) return null
    if (message.noContext) {
      if (!nextMessage || nextMessage.noContext !== true) {
        return (
          <div className={'flex items-center gap-3 select-none'}>
            <div className={'border-bottom grow'}></div>
            <div className={'font-size-12 super-transparent-font'}>{t('ai.Above context has been cleared')}</div>
            <div className={'border-bottom grow'}></div>
          </div>
        )
      }
    }
  }
  return (
    <>
      {message.role === 'user' && (
        <ChatUserMessageRenderer
          onQuestion={onQuestion}
          lineClamp={lineClamp}
          className={className}
          message={message}
          showSource={showSource}
        />
      )}
      {message.role === 'assistant' && (
        <ChatAssistantMessageRenderer
          onRetry={onRetry}
          nextMessage={nextMessage}
          className={className}
          message={message}
          noToolbar={noToolbar}
          prevMessage={prevMessage}
        />
      )}
      {renderContextCleared()}
    </>
  )
}
