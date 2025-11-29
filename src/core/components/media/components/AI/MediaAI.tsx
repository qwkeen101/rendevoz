import { MediaStateAtom, useSetMediaState } from '@/core/components/media/hooks/useMediaState'
import { memo, useLayoutEffect } from 'react'
import CommonAISidebar from '@/core/components/ai/CommonAISidebar'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { ObjectStore } from '@/api/stores'
import { useSelectAtomValue } from '@/hooks'

export default memo(() => {
  const { aiChat, currentFocusMessageId, isSummarizing } = useSelectAtomValue(MediaStateAtom, s => ({
    aiChat: s.aiChat,
    isSummarizing: s.isSummarizing,
    currentFocusMessageId: s.currentFocusMessageId
  }))
  const instance = useMediaInstance()
  const setState = useSetMediaState()
  const createChat = (): Promise<number> => {
    return new Promise(res => {
      instance.on({
        type: 'getMeta',
        onSuccess: id => {
          ObjectStore('chat')
            .addOne({ messages: [], parentMetaId: id })
            .then(c => res(c.id))
        },
        temp: true
      })
    })
  }
  const initializeChat = () => {
    createChat().then(id => {
      instance.on({
        type: 'update',
        updater: curr => ({
          ...curr,
          aiChat: {
            currentChat: id,
            ids: [id]
          }
        })
      })
    })
  }
  useLayoutEffect(() => {
    if (!aiChat) {
      initializeChat()
    }
  }, [aiChat])
  if (aiChat) {
    return (
      <CommonAISidebar
        initialMessages={instance.aiOps?.getInitialMessages}
        chat={aiChat}
        currentFocusMessageId={currentFocusMessageId}
        onCreateChat={async () => {
          return await createChat()
        }}
        onChange={chat => {
          if (chat) {
            instance.on({
              type: 'update',
              updater: c => ({ ...c, aiChat: chat })
            })
          } else {
            initializeChat()
          }
        }}
        onScrollToQuestion={id => {
          instance.aiOps?.scrollToQuestion(id)
        }}
        isSummarizing={!!isSummarizing}
        onSummarize={async type => {
          if (type === 'exam') {
            await instance.aiOps?.exam()
          } else {
            await instance.aiOps?.summarize()
          }
        }}
      />
    )
  }
})
