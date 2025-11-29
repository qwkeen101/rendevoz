import { atom } from 'jotai/index'
import { IChat, IChatInstance } from '~/typings'
import { useAtomValue } from 'jotai'
import { Virtualizer } from '@/components'
import { assignProperties } from '@/utils'

export const ChatInstanceAtom = atom<Partial<IChatInstance>>({})

const useChatInstance = () => {
  return useAtomValue(ChatInstanceAtom)
}

export const useAssignChatInstance = (chat?: IChat, virtualizer?: Virtualizer<any, any>) => {
  const instance = useChatInstance()
  assignProperties(instance, {
    scrollToMessage: id => {
      const idx = chat?.messages.findIndex(i => i === id) ?? -1
      if (idx >= 0) {
        virtualizer?.scrollToIndex(idx, { align: 'center' })
      }
    }
  })
}

export default useChatInstance
