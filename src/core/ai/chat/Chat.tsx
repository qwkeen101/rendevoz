import ChatHeader from '@/core/ai/chat/ChatHeader'
import ChatDialog from '@/core/ai/chat/ChatDialog'
import { IChatInstance } from '~/typings'
import { useContext, useMemo } from 'react'
import { createStore, Provider } from 'jotai'
import { ChatInstanceAtom } from '@/core/ai/chat/useChatInstance'
import { waitFor } from '@/utils'
import pageConfigContext from '@/core/components/PageConfigContext'

export default ({
  id,
  onInstanceInitialized,
  layout,
  styles
}: {
  id: number
  onInstanceInitialized?: (i: IChatInstance) => void
  layout?: {
    header?: boolean
  }
  styles?: {
    containerClassName?: string
    headerClassName?: string
  }
}) => {
  const context = useContext(pageConfigContext)
  const store = useMemo(() => {
    const s = createStore()
    s.set(ChatInstanceAtom, {})
    waitFor(
      () => !!s.get(ChatInstanceAtom).scrollToMessage,
      () => {
        onInstanceInitialized?.(s.get(ChatInstanceAtom))
      }
    )
    return s
  }, [])
  const showHeader = layout?.header && context.chatHeader !== false
  return (
    <Provider store={store}>
      <ChatDialog paddingStart={showHeader ? 25 : 0} className={styles?.containerClassName} id={id} />
    </Provider>
  )
}
