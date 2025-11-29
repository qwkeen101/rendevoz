import { memo, useLayoutEffect } from 'react'
import useEditorState from '../hooks/useEditorState'
import CommonAISidebar from '@/core/components/ai/CommonAISidebar'
import useEditorInstance from '../hooks/useEditorInstance'
import { ObjectStore } from '@/api/stores'

export default memo(({ visible }: { visible: boolean }) => {
  const [state, setState] = useEditorState()
  const instance = useEditorInstance()
  const aiChat = state.state?.aiChat
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
        type: 'chatChange',
        chat: {
          currentChat: id,
          ids: [id]
        }
      })
    })
  }
  useLayoutEffect(() => {
    if (!aiChat && visible) {
      initializeChat()
    }
  }, [visible])
  if (aiChat) {
    return (
      <CommonAISidebar
        onChange={c => {
          if (c === undefined) {
            initializeChat()
          } else {
            instance.on({
              type: 'chatChange',
              chat: c
            })
          }
        }}
        onCreateChat={async () => await createChat()}
        currentFocusMessageId={state.currentFocusChatMessageId}
        isSummarizing={!!state.isSummarizing}
        chat={aiChat}
        onScrollToQuestion={id => {
          instance.aiOps?.scrollToQuestion(id)
        }}
        onSummarize={async type => {
          if (type === 'exam') {
            await instance.aiOps?.exam()
          } else {
            await instance.aiOps?.summarize()
          }
        }}
        initialMessages={async () => {
          return instance.aiOps?.getInitialMessages() || []
        }}
      />
    )
  }
})
