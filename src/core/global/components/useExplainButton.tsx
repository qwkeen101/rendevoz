import { IGeneralSource } from '~/typings'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'
import { Icons } from '@/consts'
import { CoreMessage } from 'ai'

export type ExplainInput = {
  source?: IGeneralSource
  query?: string
  image?: string
  targetChatId?: number
  initialMessages?: CoreMessage[] | (() => Promise<CoreMessage[]>)
}
export default ({ onGetExplain }: { onGetExplain?: () => Promise<ExplainInput | undefined> | ExplainInput | undefined }) => {
  const { t } = useTranslation()
  return {
    icon: Icons.Explain,
    text: t(trans.Explain),
    type: 'button',
    key: 'ai-explain',
    onClick: async (e: MouseEvent | PointerEvent) => {
      const input = await onGetExplain?.()
      if (input) {
        Global.aiOps?.explain?.({
          initialMessages: input.initialMessages,
          source: input.source,
          query: input.query,
          image: input.image,
          targetChatId: input.targetChatId,
          e
        })
      }
    }
  }
}
