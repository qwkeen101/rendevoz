import { memo, useLayoutEffect } from 'react'
import usePDFState from '@/core/components/pdf/hooks/usePDFState'
import CommonAISidebar from '@/core/components/ai/CommonAISidebar'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import { ObjectStore } from '@/api/stores'

export default memo(() => {
  const [state, setState] = usePDFState()
  const instance = usePDFInstance()
  const chat = state.state?.aiChat
  const initializeChat = () => {
    ObjectStore('chat')
      .addOne({
        messages: [],
        parentMetaId: state.state?.metaId
      })
      .then(res => {
        instance.on?.({
          type: 'stateChange',
          state: {
            aiChat: {
              ids: [res.id],
              currentChat: res.id
            }
          }
        })
      })
  }
  useLayoutEffect(() => {
    if (state.document && (!chat || !chat.ids.length)) {
      initializeChat()
    }
  }, [state.document])
  if (chat) {
    return (
      <CommonAISidebar
        currentFocusMessageId={state.currentFocusMessageId}
        chat={chat}
        onChange={v => {
          if (v) {
            instance.on?.({
              type: 'stateChange',
              state: {
                aiChat: v
              }
            })
          } else {
            initializeChat()
          }
        }}
        isSummarizing={!!state.isSummarizing}
        onSummarize={async type => {
          if (type === 'exam') {
            await instance.aiOps?.exam()
          } else {
            await instance.aiOps?.summarize()
          }
        }}
        onCreateChat={async () => {
          return (
            await ObjectStore('chat').addOne({
              messages: [],
              parentMetaId: state.state?.metaId
            })
          ).id
        }}
        onScrollToQuestion={id => {
          instance.aiOps?.scrollToQuestion(id)
        }}
        initialMessages={instance.aiOps?.getInitialMessages}
      />
    )
  }
})
