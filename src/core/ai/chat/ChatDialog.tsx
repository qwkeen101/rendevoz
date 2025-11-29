import { CSSProperties, forwardRef, memo, ReactNode, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import { MetaStore, ObjectStore } from '@/api/stores'
import { IChat, IAIMessage } from '~/typings'
import { Virtualizer, VirtualList } from '@/components'
import classnames from 'classnames'
import getChatTitle from '@/core/ai/chat/getChatTitle'
import getChatResponse from '@/core/ai/chat/getChatResponse'
import { useTranslation } from 'react-i18next'
import ChatInput from '@/core/ai/chat/ChatInput'
import ChatMessage from '@/core/ai/chat/message/ChatMessage'
import { useAssignChatInstance } from '@/core/ai/chat/useChatInstance'
import { useMemoizedFn } from '@/hooks'
import useChatRelated from '@/core/ai/chat/useChatRelated'
import getPromptByAIAction from '@/core/ai/chat/getPromptByAIAction'
import { CoreMessage } from 'ai'
export type IAIActions = 'overview' | 'question' | 'table' | 'outline' | 'background' | 'insight' | 'points' | 'mindmap' | 'quiz'
export type IChatDialogRef = {
  action: (e: IAIActions) => void
  scrollToMessage: (id: number) => void
}
export default memo(
  forwardRef<
    IChatDialogRef,
    {
      id: number
      className?: string
      virtualizer?: boolean
      containerClassName?: string
      initialMessages?: CoreMessage[] | (() => Promise<CoreMessage[]>)
      containerStyle?: CSSProperties
      getTitle?: boolean
      onCreateChat?: VoidFunction
      placeholder?: (onAction: (e: IAIActions) => void) => ReactNode
      paddingStart?: number
      onScrollToQuestion?: (id: number) => void
    }
  >(
    (
      {
        id,
        containerClassName,
        className,
        virtualizer = true,
        containerStyle,
        initialMessages,
        paddingStart,
        onCreateChat,
        getTitle = true,
        placeholder,
        onScrollToQuestion
      },
      ref
    ) => {
      const chat = ObjectStore('chat').useValue(id)
      const messages = ObjectStore('message').useMultiple(chat?.messages)
      const chatMeta = MetaStore.useObjectToMetaValue(id)
      useChatRelated(id, messages)
      const containerRef = useRef<Virtualizer<any, any>>()
      const [isLoading, setIsLoading] = useState(false)
      const autoScroll = useRef(true)
      const { t } = useTranslation()
      useAssignChatInstance(chat, containerRef.current)
      const scrollBottom = useMemoizedFn(() => {
        const c = containerRef.current
        if (c && chat?.messages.length) {
          const end = chat.messages.length - 1
          requestAnimationFrame(() => {
            c.scrollToIndex(end, { align: 'end' })
            autoScroll.current = true
          })
        }
      })
      useLayoutEffect(() => {
        scrollBottom()
      }, [messages.length])
      const handleAsk = async (value: string | CoreMessage['content'], type?: IAIMessage['type']) => {
        if (!value) return
        setIsLoading(true)
        const newMessage = await ObjectStore('message').addOne({
          role: 'user',
          content: value,
          parentObjectId: id,
          type
        })
        const messages: IChat['messages'] = [...(chat?.messages || []), newMessage.id]
        await ObjectStore('chat').updateOne({ id, messages })
        getChatResponse(id, {
          initialMessages,
          onStartOutput: () => {
            setIsLoading(false)
          }
        }).catch(() => {
          setIsLoading(false)
        })
      }
      const showDefaultMessage = !chat?.messages.length
      const isGettingTitle = useRef(false)
      const prevOffset = useRef<number>()
      useLayoutEffect(() => {
        if (getTitle && chat && !chat?.name && chat.messages.length && !isGettingTitle.current) {
          isGettingTitle.current = true
          ObjectStore('message')
            .getMultipleByIds(chat.messages)
            .then(async messages => {
              let allMessages = [...messages]
              if (initialMessages) {
                const initial = typeof initialMessages === 'function' ? await initialMessages() : initialMessages
                allMessages = [...initial, ...allMessages]
              }
              getChatTitle(allMessages)
                .then(title => {
                  ObjectStore('chat').updateOne({ id: chat.id, name: title })
                  if (chatMeta) {
                    MetaStore.updateMetaObject({ id: chatMeta.id, name: title })
                  }
                })
                .finally(() => {
                  isGettingTitle.current = false
                })
            })
        }
      }, [chat?.messages])
      const handleAction = (e: IAIActions) => {
        const prompt = getPromptByAIAction(e)
        if (prompt) {
          handleAsk(prompt, e)
        }
      }
      useImperativeHandle(ref, () => ({
        action: handleAction,
        scrollToMessage: messageId => {
          const idx = chat?.messages.findIndex(i => i === messageId)
          if (idx !== undefined && idx >= 0) {
            containerRef.current?.scrollToIndex(idx, { align: 'start' })
          }
        }
      }))
      if (!chat) return null
      return (
        <div style={containerStyle} className={classnames('w-full flex-1 overflow-hidden flex-col flex', containerClassName)}>
          {showDefaultMessage ? (
            <div
              className={classnames(
                'h-full w-full overflow-y-auto min-h-80 flex grow gap-1 flex-col items-center justify-center',
                className
              )}
            >
              {placeholder?.(e => handleAction(e)) || <div className={'font-medium text-2xl'}>{t('ai.Chat greetings')}</div>}
            </div>
          ) : messages.length ? (
            <VirtualList
              ref={r => {
                if (r) {
                  containerRef.current = r
                }
              }}
              onScroll={e => {
                const prev = prevOffset.current
                const current = e.currentTarget.scrollTop
                if (prev) {
                  if (current < prev) {
                    autoScroll.current = false
                  }
                }
                prevOffset.current = current
              }}
              estimateSize={100}
              paddingEnd={35}
              paddingStart={paddingStart}
              scrollPaddingEnd={35}
              className={'w-full flex-1'}
              childrenContainerClassname={classnames('px-4 min-h-80 pt-0', className)}
              items={messages}
              overscan={virtualizer ? 3 : 999999}
              getKey={i => i.id}
              renderItem={(item, idx) => {
                const prev = messages[idx - 1]
                const next = messages[idx + 1]
                return (
                  <ChatMessage
                    onRetry={() => {
                      setIsLoading(true)
                      getChatResponse(id, {
                        initialMessages,
                        onStartOutput: () => {
                          setIsLoading(false)
                        }
                      }).catch(() => {
                        setIsLoading(false)
                      })
                    }}
                    onQuestion={onScrollToQuestion}
                    onChange={() => {
                      if (autoScroll.current) {
                        scrollBottom()
                      }
                    }}
                    id={item.id}
                    prevMessageId={prev?.id}
                    nextMessageId={next?.id}
                  />
                )
              }}
            ></VirtualList>
          ) : null}
          <div className={classnames('w-full shrink-0 px-3 pb-3.5', className)}>
            <ChatInput
              reasoning={chat.reasoning}
              web={chat.web}
              onReasoning={() => {
                ObjectStore('chat').updateOne({ id: chat.id, reasoning: !chat?.reasoning })
              }}
              onCreateChat={onCreateChat}
              onWeb={() => {
                ObjectStore('chat').updateOne({ id: chat.id, web: !chat?.web })
              }}
              isLoading={isLoading}
              onAsk={handleAsk}
            />
          </div>
        </div>
      )
    }
  )
)
