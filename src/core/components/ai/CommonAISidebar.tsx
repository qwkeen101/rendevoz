import ChatDialog, { IAIActions, IChatDialogRef } from '@/core/ai/chat/ChatDialog'
import { memo, useEffect, useRef } from 'react'
import { Icon } from '@/components'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import AICommands from '@/core/components/ai/AICommands'
import toast from 'react-hot-toast'
import { ObjectStore } from '@/api/stores'
import { waitFor } from '@/utils'
import { ISubChat } from '~/typings'
import EmptyList from '@/core/components/common/EmptyList'
import { CoreMessage } from 'ai'
export default memo(
  ({
    initialMessages,
    onSummarize,
    isSummarizing,
    currentFocusMessageId,
    chat,
    onChange,
    onCreateChat,
    onScrollToQuestion
  }: {
    chat: ISubChat
    onChange: (chat: ISubChat | undefined) => void
    initialMessages?: CoreMessage[] | (() => Promise<CoreMessage[]>)
    onSummarize: (type: 'summarize' | 'exam') => Promise<void>
    isSummarizing: boolean
    currentFocusMessageId?: number
    onCreateChat: () => Promise<number>
    onScrollToQuestion?: (id: number) => void
  }) => {
    const chatRef = useRef<IChatDialogRef>(null)
    const { t } = useTranslation()
    const chatId = chat.currentChat
    const currentChat = ObjectStore('chat').useValue(chatId)
    const all = ObjectStore('chat').useMultiple(chat.ids)
    useEffect(() => {
      if (currentFocusMessageId) {
        const targetChat = all.find(i => i.messages.includes(currentFocusMessageId))
        if (targetChat) {
          if (targetChat.id !== chatId) {
            onChange({
              ...chat,
              currentChat: targetChat.id
            })
          }
        }
        setTimeout(() => {
          waitFor(
            () => !!chatRef.current,
            () => {
              chatRef.current?.scrollToMessage(currentFocusMessageId)
            }
          )
        }, 100)
      }
    }, [currentFocusMessageId])
    const handleSummarize = (type: 'summarize' | 'exam') => {
      if (isSummarizing) return
      const id = toast.loading(t(trans.AI.Summarizing), { duration: 99999 * 1000 })
      onSummarize(type).finally(() => toast.dismiss(id))
    }

    const renderChatPlaceholder = (e: (event: IAIActions) => void) => {
      const renderCommand = (i: keyof typeof AICommands) => {
        const command = AICommands[i]
        if (!command) return null
        return (
          <div
            onClick={async () => {
              const messages = typeof initialMessages === 'function' ? await initialMessages() : initialMessages
              if (!messages || !messages.length) {
                toast.error(t('ai.No text available'))
                return
              }
              if (command.key === 'insight') {
                handleSummarize('summarize')
              } else if (command.key === 'quiz') {
                handleSummarize('exam')
              } else {
                e(command.key)
              }
            }}
            className={
              'flex select-none bg-input items-center gap-2 font-size-12 default-transition light-hover cursor-default rounded-3xl px-3 py-1.5'
            }
            key={command.key}
          >
            <Icon name={command.icon} size={15} />
            {t(command.text)}
          </div>
        )
      }
      return (
        <div className={'flex flex-col p-6'}>
          <div className='font-bold text-3xl mb-3'>你好,</div>
          <div className={'font-bold text-2xl'}>{t('ai.Chat greetings')}</div>
          <div className={'menu-sub-title mb-2 mt-6'}>{t('ai.Suggested')}</div>
          <div className='flex flex-wrap gap-2'>{renderCommand('insight')}</div>
          <div className={'menu-sub-title mb-3 mt-4'}>{t('ai.Think')}</div>
          <div className='flex flex-wrap gap-2'>
            {renderCommand('overview')}
            {renderCommand('outline')}
            {renderCommand('points')}
            {renderCommand('question')}
          </div>
          <div className={'menu-sub-title mb-3 mt-4'}>{t('ai.Write')}</div>
          <div className='flex flex-wrap gap-2'>
            {renderCommand('table')}
            {renderCommand('mindmap')}
          </div>
        </div>
      )
    }
    const renderChat = () => {
      if (!currentChat) return <EmptyList />
      return (
        <>
          {/*<div className={'flex gap-2 items-center transparent-font font-size-13 p-2'}>*/}
          {/*  <IconWithPopover*/}
          {/*    content={setV => (*/}
          {/*      <WithBorder className={'min-w-56 max-w-96 max-h-80 overflow-y-auto'}>*/}
          {/*        <div className={'p-1 border-bottom'}>*/}
          {/*          <div className={'menu-sub-title px-2 pt-1 pb-0.5'}>{t('ai.All chats')}</div>*/}
          {/*          {all.map(i => (*/}
          {/*            <div*/}
          {/*              onClick={() => {*/}
          {/*                onChange({*/}
          {/*                  ...chat,*/}
          {/*                  currentChat: i.id*/}
          {/*                })*/}
          {/*                setV(false)*/}
          {/*              }}*/}
          {/*              className={'button gap-8 flex justify-between'}*/}
          {/*              key={i.id}*/}
          {/*            >*/}
          {/*              <div className={classnames('line-clamp-1 font-size-13 break-all', !i.name && 'super-transparent-font')}>*/}
          {/*                {i.name || t(trans.Unnamed)}*/}
          {/*              </div>*/}
          {/*              <Icon*/}
          {/*                name={Icons.Delete}*/}
          {/*                className={'hover-active-button'}*/}
          {/*                onClick={e => {*/}
          {/*                  e.stopPropagation()*/}
          {/*                  const idx = chat.ids.lastIndexOf(i.id)*/}
          {/*                  const prev = idx - 1*/}
          {/*                  if (prev <= -1) {*/}
          {/*                    onChange(undefined)*/}
          {/*                  } else {*/}
          {/*                    onChange({*/}
          {/*                      ids: chat.ids.filter(o => o !== i.id),*/}
          {/*                      currentChat: chat.ids[prev]*/}
          {/*                    })*/}
          {/*                  }*/}
          {/*                }}*/}
          {/*              />*/}
          {/*            </div>*/}
          {/*          ))}*/}
          {/*        </div>*/}
          {/*        <div className={'p-1 transparent-font'}>*/}
          {/*          <Button.IconButton*/}
          {/*            text={t(trans.AI.NewChat)}*/}
          {/*            icon={Icons.Create}*/}
          {/*            onClick={() => {*/}
          {/*              setV(false)*/}

          {/*            }}*/}
          {/*          />*/}
          {/*        </div>*/}
          {/*      </WithBorder>*/}
          {/*    )}*/}
          {/*    className={'square-button'}*/}
          {/*    size={14}*/}
          {/*    placement={['bottom']}*/}
          {/*    align={'start'}*/}
          {/*    name={'park-hamburger-button'}*/}
          {/*  ></IconWithPopover>*/}
          {/*  <BetterInput*/}
          {/*    value={currentChat?.name || ''}*/}
          {/*    onChange={v => ObjectStore('chat').updateOne({ id: chatId, name: v.target.value })}*/}
          {/*    className={'flex-1'}*/}
          {/*    placeholder={t(trans.AI.NewChat)}*/}
          {/*  />*/}
          {/*  {currentChat.messages.length ? (*/}
          {/*    <AnimatePopover*/}
          {/*      positions={['bottom']}*/}
          {/*      padding={6}*/}
          {/*      content={setVisible => (*/}
          {/*        <WithBorder className={'popover-menu-mid'}>*/}
          {/*          <Menu.NavigationMenu*/}
          {/*            layout={[*/}
          {/*              {*/}
          {/*                type: 'title',*/}
          {/*                name: t('general.Commands'),*/}
          {/*                key: 't-1'*/}
          {/*              },*/}
          {/*              ...(['overview', 'outline', 'points', 'background', 'question', 'table', 'mindmap'] as (keyof typeof AICommands)[])*/}
          {/*                .map(i => AICommands[i])*/}
          {/*                .map(i => ({*/}
          {/*                  type: 'item',*/}
          {/*                  key: i.key,*/}
          {/*                  icon: i.icon,*/}
          {/*                  text: t(i.text),*/}
          {/*                  onSelect: () => {*/}
          {/*                    setVisible(false)*/}
          {/*                    chatRef.current?.action(i.key)*/}
          {/*                  }*/}
          {/*                })),*/}
          {/*              {*/}
          {/*                type: 'separator',*/}
          {/*                key: 's-1'*/}
          {/*              },*/}
          {/*              {*/}
          {/*                type: 'item',*/}
          {/*                key: 'exam',*/}
          {/*                icon: Global.utils.getIcon('exam'),*/}
          {/*                text: t(AICommands['quiz'].text),*/}
          {/*                onSelect: () => {*/}
          {/*                  handleSummarize('exam')*/}
          {/*                  setVisible(false)*/}
          {/*                }*/}
          {/*              },*/}
          {/*              {*/}
          {/*                type: 'item',*/}
          {/*                key: 'summarize',*/}
          {/*                icon: 'custom-stars',*/}
          {/*                text: t(trans.AI.Summarize),*/}
          {/*                onSelect: () => {*/}
          {/*                  handleSummarize('summarize')*/}
          {/*                  setVisible(false)*/}
          {/*                }*/}
          {/*              },*/}
          {/*              {*/}
          {/*                type: 'item',*/}
          {/*                key: 'delete',*/}
          {/*                icon: Icons.Delete,*/}
          {/*                text: t('ai.Clear chat history'),*/}
          {/*                onSelect: () => {*/}
          {/*                  ChatStore.clearHistory(chatId)*/}
          {/*                  setVisible(false)*/}
          {/*                }*/}
          {/*              }*/}
          {/*            ]}*/}
          {/*          />*/}
          {/*        </WithBorder>*/}
          {/*      )}*/}
          {/*    >*/}
          {/*      <Icon className={'square-button'} size={14} name={Icons.More} />*/}
          {/*    </AnimatePopover>*/}
          {/*  ) : null}*/}
          {/*</div>*/}
          <ChatDialog
            onScrollToQuestion={onScrollToQuestion}
            paddingStart={10}
            ref={chatRef}
            onCreateChat={() => {
              onCreateChat().then(id => {
                onChange({
                  currentChat: id,
                  ids: [...chat.ids, id]
                })
              })
            }}
            placeholder={e => renderChatPlaceholder(e)}
            initialMessages={initialMessages}
            id={chatId}
          />
        </>
      )
    }
    return <div className={'w-full h-full flex flex-col'}>{renderChat()}</div>
  }
)
