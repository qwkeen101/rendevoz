import { Fragment } from 'react'
import classnames from 'classnames'
import { Icon, Markdown } from '@/components'
import { MetaStore, ObjectStore } from '@/api/stores'
import { IAIMessage, IGeneralSource } from '~/typings'
import { useTranslation } from 'react-i18next'
import addSourceAsLabel from '@/core/global/common/addSourceAsLabel'
import toast from 'react-hot-toast'
import trans from '@/consts/trans'
import { Icons } from '@/consts'
import addMessageAsMeta from '@/core/ai/chat/addMessageAsMeta'
import ChatReasoningRenderer from '@/core/ai/chat/message/ChatReasoningRenderer'

export default ({
  message,
  className,
  noToolbar,
  onRetry,
  nextMessage,
  prevMessage
}: {
  message: IAIMessage
  nextMessage?: IAIMessage
  className?: string
  noToolbar?: boolean
  prevMessage?: IAIMessage
  onRetry?: VoidFunction
}) => {
  if (message.content && typeof message.content !== 'string') return null
  return (
    <>
      <div className={classnames('em:pt-4 group max-w-full', message.loadState === 'failed' && 'em:pb-4', className)}>
        <ChatReasoningRenderer
          nextMessage={nextMessage}
          onRetry={onRetry}
          timeUsed={message.timeUsed}
          loadState={message.loadState}
          content={message.content}
          collapsed={message.reasoningCollapsed}
          reasoning={message.reasoning}
          references={message.references}
          onCollapse={() => ObjectStore('message').updateOne({ id: message.id, reasoningCollapsed: !message.reasoningCollapsed })}
        />
        {message.loadState !== 'failed' && (
          <div className={'relative'}>
            <Markdown>{message.content}</Markdown>
          </div>
        )}
        {!noToolbar && !(message.loadState === 'connecting' || message.loadState === 'failed' || message.loadState === 'loading') && (
          <ResponseToolbar
            prevMessageId={prevMessage?.id}
            message={message}
            messageId={message.id}
            chatId={message.parentObjectId}
            source={prevMessage?.source}
          />
        )}
      </div>
    </>
  )
}

const ResponseToolbar = ({
  source,
  chatId,
  messageId,
  message,
  prevMessageId
}: {
  source?: IGeneralSource
  messageId: number
  chatId?: number
  message: IAIMessage
  prevMessageId?: number
}) => {
  const messageLabel = MetaStore.useValue(message.label)
  const content = message.content
  const hasLabel = messageLabel && !messageLabel.deleted
  const { t } = useTranslation()
  const deleteMessage = async () => {
    const chat = await ObjectStore('chat').getOneById(chatId)
    const messages = chat?.messages
    if (messages) {
      const idx = messages.findIndex(i => i === messageId)
      if (idx >= 0) {
        const newMessages = [...messages]
        const deletedIds = newMessages.splice(idx - 1, 2)
        deletedIds.forEach(id => {
          ObjectStore('message').deleteOneById(id)
        })
        ObjectStore('chat').updateOne({ id: chatId, messages: newMessages })
      }
    }
  }
  const size = 13
  const className = 'square-button hover-active-button !transition-colors'
  const hasStrContent = content && typeof content === 'string'
  const canAddAsLabel = source && !(source.type === 'pdf' && (source.labelId || (!source.rects && !source.cropLabel)))
  return (
    <div style={{ opacity: hasLabel ? 1 : undefined }} className={'flex em:gap-1 em:mt-2 em:-ml-1 em:mb-3'}>
      {canAddAsLabel && (
        <Icon
          size={size}
          className={classnames(className, hasLabel && 'text-yellow-500')}
          onClick={() => {
            if (hasLabel) {
              Global.layoutOps?.openObject(messageLabel.id)
              return
            }
            if (!hasStrContent) return
            addSourceAsLabel(source.selectedText, content, source).then(async id => {
              if (id) {
                toast.success(t(trans.Success.SavedSuccessfully))
                ObjectStore('message').updateOne({ id: messageId, label: id })
              }
            })
          }}
          name={'park-label'}
          tooltip={hasLabel ? t('ai.View highlight') : t('ai.Save as highlight')}
        />
      )}
      <Icon
        size={size}
        className={className}
        onClick={() => {
          if (hasStrContent) {
            navigator.clipboard.writeText(content)
            toast.success(t(trans.Copied))
          }
        }}
        name={Icons.Copy}
        tooltip={t(trans.Copy)}
      />
      <Icon
        size={size}
        className={className}
        onClick={() => {
          addMessageAsMeta(messageId, prevMessageId).then(i => {
            if (i) {
              Global.metaOps.copyLink(i)
            }
          })
        }}
        name={Icons.Link}
        tooltip={t(trans.CopyLink)}
      />
      <Icon
        size={size}
        className={className}
        onClick={() => {
          deleteMessage()
        }}
        name={Icons.Delete}
        tooltip={t(trans.Delete)}
      />
    </div>
  )
}
