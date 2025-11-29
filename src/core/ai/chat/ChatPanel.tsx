import KeyvalueStore, { IChatData } from '@/api/stores/keyvalue.store'
import { assignProperties } from '@/utils'
import { memo, useEffect } from 'react'
import { ObjectStore } from '@/api/stores'
import ChatHeader from '@/core/ai/chat/ChatHeader'
import updateSidebarState from '@/components/layout/sidebar/updateSidebarState'
import ChatDialog from '@/core/ai/chat/ChatDialog'
import getChatResponse from '@/core/ai/chat/getChatResponse'
import { getSidebarState } from '@/components/layout/sidebar/useSidebarState'

const defaultChat = { chats: [] }
export default memo(() => {
  const currentWorkspace = KeyvalueStore.useValue('currentWorkspace')
  const chat = KeyvalueStore.useValue('chatData')
  const data = currentWorkspace ? chat?.[currentWorkspace.id] || defaultChat : defaultChat
  const allChats = ObjectStore('chat').useMultiple(data.chats)
  useEffect(() => {
    if (!allChats.length && currentWorkspace) {
      ObjectStore('chat')
        .getMultipleByIds(data.chats)
        .then(res => {
          if (res.length === 0) {
            ObjectStore('chat')
              .addOne({
                messages: []
              })
              .then(res => {
                updateChatData(c => ({ ...c, chats: [res.id], currentChatId: res.id }))
              })
          }
        })
    }
  }, [allChats.length, currentWorkspace])

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
  assignProperties(Global, {
    aiOps: {
      ...Global.aiOps,
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
        if (!opts?.targetChatId && opts?.openSidebar !== false) {
          updateSidebarState(c => {
            c.leftVisible = 'chat'
            c.leftOpen = true
          })
        }
        const messages = opts?.messages
          ? await Promise.all(opts.messages.map(async message => await ObjectStore('message').addOne({ ...message })))
          : []
        const chatId = opts?.targetChatId || data.currentChatId
        if (chatId && !opts?.createNewChat) {
          const currentChat = await ObjectStore('chat').getOneById(chatId)
          if (currentChat) {
            await ObjectStore('chat').updateOne({
              id: currentChat.id,
              messages: [...currentChat.messages, ...messages.map(i => i.id)]
            })
            messages.forEach(m => {
              ObjectStore('message').updateOne({ id: m.id, parentObjectId: currentChat.id })
            })
            if (opts?.getResponse) {
              getChatResponse(currentChat.id, {
                context: opts.contextCount,
                initialMessages: opts.initialMessages
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
            context: opts.contextCount,
            initialMessages: opts.initialMessages
          })
        }
        updateChatData(c => ({ ...c, chats: [chat.id, ...(data.chats || [])], currentChatId: chat.id }))
      }
    }
  })
  return (
    <div className={'w-full h-full flex flex-col'}>
      {/*<ChatHeader*/}
      {/*  onDelete={id => {*/}
      {/*    if (id) {*/}
      {/*      updateChatData(c => ({*/}
      {/*        ...c,*/}
      {/*        chats: c.chats.filter(i => i !== id),*/}
      {/*        currentChatId: c.currentChatId === id ? c.chats.filter(i => i !== c.currentChatId)[0] : c.currentChatId*/}
      {/*      }))*/}
      {/*    } else {*/}
      {/*      updateChatData(c => ({*/}
      {/*        ...c,*/}
      {/*        chats: c.chats.filter(i => i !== c.currentChatId),*/}
      {/*        currentChatId: c.chats.filter(i => i !== c.currentChatId)[0]*/}
      {/*      }))*/}
      {/*    }*/}
      {/*  }}*/}
      {/*  onChatChange={id => updateChatData(c => ({ ...c, currentChatId: id }))}*/}
      {/*  allChats={data.chats}*/}
      {/*  currentChatId={data.currentChatId}*/}
      {/*/>*/}
      {data.currentChatId && <ChatDialog paddingStart={10} key={data.currentChatId} id={data.currentChatId} />}
    </div>
  )
})
