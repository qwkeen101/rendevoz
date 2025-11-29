import { IconWithPopover, Menu, WithBorder } from '@/components'
import { Icons } from '@/consts'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'

export default ({ on }: { on: (type: 'chat' | 'copy' | 'resummarize') => void }) => {
  const { t } = useTranslation()
  return (
    <IconWithPopover
      name={Icons.More}
      size={20}
      className={'button !p-1 !rounded-full'}
      placement={['right', 'left']}
      align={'start'}
      content={setV => (
        <WithBorder className={'py-1.5 min-w-52'}>
          <Menu.NavigationMenu
            layout={[
              {
                type: 'item',
                key: 'continue-with-chat',
                text: t(trans.AI.ContinueWithChat),
                icon: 'custom-stars',
                onSelect: () => {
                  on?.('chat')
                  setV(false)
                }
              },
              {
                type: 'item',
                key: 'copy',
                text: t(trans.Copy),
                icon: Icons.Copy,
                onSelect: () => {
                  on?.('copy')
                  setV(false)
                }
              }
            ]}
          />
        </WithBorder>
      )}
    ></IconWithPopover>
  )
}
