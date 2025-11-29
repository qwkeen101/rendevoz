import KeyvalueStore, { IChatData } from '@/api/stores/keyvalue.store'
import { assignProperties } from '@/utils'
import { GlobalInstance } from '@/hooks'
import { memo, useEffect, useState } from 'react'
import { ObjectStore } from '@/api/stores'
import ChatHeader from '@/core/ai/chat/ChatHeader'
import updateSidebarState from '@/components/layout/sidebar/updateSidebarState'
import ChatDialog from '@/core/ai/chat/ChatDialog'
import getChatResponse from '@/core/ai/chat/getChatResponse'
import { getSidebarState } from '@/components/layout/sidebar/useSidebarState'

export default memo(() => {
  const currentWorkspace = KeyvalueStore.useValue('currentWorkspace')
  const chat = KeyvalueStore.useValue('chatData')
  const data = currentWorkspace ? chat?.[currentWorkspace.id] || { chats: [] } : { chats: [] }
  useEffect(() => {
    if (!data.chats.length) {
      ObjectStore('chat')
        .addOne({
          messages: []
        })
        .then(res => {
          updateChatData(c => ({ ...c, chats: [res.id], currentChatId: res.id }))
        })
    }
  }, [data])
  const [scrollToBottom, setScrollToBottom] = useState(0)
  const updateChatData = (updater: (curr: IChatData) => IChatData) => {
    if (currentWorkspace) {
      KeyvalueStore.updateOne('chatData', {
        ...chat,
        [currentWorkspace.id]: {
          ...data,
          ...updater(data)
        }
      })
    }
  }
  assignProperties(GlobalInstance, {
    aiOps: {
      ...GlobalInstance.aiOps,
      isChatOpen: () => {
        const sidebar = getSidebarState()
        if (sidebar.leftOpen && sidebar.leftVisible === 'chat') {
          return true
        }
        return false
      },
      getChatBySource: async source => {
        const existedChat = await ObjectStore('chat')
          .getMultipleByIds(data.chats)
          .then(res => res.find(i => i.objectId === source.objectId))
        return existedChat?.id
      },
      chat: async opts => {
        updateSidebarState(c => {
          c.leftVisible = 'chat'
          c.leftOpen = true
        })
        const messages = opts?.messages
          ? await Promise.all(opts.messages.map(async message => await ObjectStore('message').addOne({ ...message })))
          : []
        if (opts?.changeChatToSource) {
          if (opts?.source) {
            const existedChat = await GlobalInstance.aiOps?.getChatBySource?.(opts.source)
            if (existedChat) {
              const chat = await ObjectStore('chat').getOneById(existedChat)
              await ObjectStore('chat').updateOne({
                id: existedChat,
                messages: [...(chat?.messages || []), ...messages.map(i => i.id)]
              })
              messages.forEach(m => {
                ObjectStore('message').updateOne({ id: m.id, parentObjectId: existedChat })
              })
              if (opts.getResponse) {
                getChatResponse(existedChat, {
                  context: opts.contextCount
                })
              }
              updateChatData(c => ({ ...c, currentChatId: existedChat }))
              setTimeout(() => {
                setScrollToBottom(s => s + 1)
              })
              return
            }
          }
        }
        if (data.currentChatId && !opts?.createNewChat) {
          const currentChat = await ObjectStore('chat').getOneById(data.currentChatId)
          if (currentChat) {
            await ObjectStore('chat').updateOne({
              id: currentChat.id,
              messages: [...currentChat.messages, ...messages.map(i => i.id)]
            })
            messages.forEach(m => {
              ObjectStore('message').updateOne({ id: m.id, parentObjectId: currentChat.id })
            })
            setScrollToBottom(s => s + 1)
            if (opts?.getResponse) {
              getChatResponse(currentChat.id, {
                context: opts.contextCount
              })
            }
            return
          }
        }
        const chat = await ObjectStore('chat').addOne({
          messages: messages.map(i => i.id),
          objectId: opts?.source?.objectId
        })
        messages.forEach(m => {
          ObjectStore('message').updateOne({ id: m.id, parentObjectId: chat.id })
        })
        if (opts?.getResponse) {
          getChatResponse(chat.id, {
            context: opts.contextCount
          })
        }
        updateChatData(c => ({ ...c, chats: [chat.id, ...(data.chats || [])], currentChatId: chat.id }))
      }
    }
  })
  return (
    <div className={'w-full h-full flex flex-col'}>
      <ChatHeader
        onChatChange={id => updateChatData(c => ({ ...c, currentChatId: id }))}
        allChats={data.chats}
        currentChatId={data.currentChatId}
      />
      {data.currentChatId && <ChatDialog scrollToBottom={scrollToBottom} key={data.currentChatId} id={data.currentChatId} />}
    </div>
  )
})
