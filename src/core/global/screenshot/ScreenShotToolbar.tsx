import { useGlobalAtomValue } from '@/hooks'
import { GlobalScreenShotSelectionBoxState } from '.'
import { Toolbar } from '@/components'
import { t } from 'i18next'

type ToolbarOnEvent =
  | {
      type: 'ocr'
    }
  | {
      type: 'download'
    }
  | {
      type: 'move-to'
    }
  | {
      type: 'return'
    }
  | {
      type: 'close'
    }
  | {
      type: 'add as object'
    }
const ScreenShotToolbar = ({ on }: { on: (event: ToolbarOnEvent) => void }) => {
  const selectionBoxState = useGlobalAtomValue(GlobalScreenShotSelectionBoxState)
  if (!selectionBoxState) return null
  return (
    <Toolbar itemSize={18}>
      <Toolbar.Item iconName="park-plus" tooltip={t('general.add as object')} onClick={() => on({ type: 'add as object' })} />
      <Toolbar.Item iconName="park-corner-up-right" tooltip={t('general.Move to')} onClick={() => on({ type: 'move-to' })} />
      <Toolbar.Item iconName="park-download" tooltip={t('general.Save')} onClick={() => on({ type: 'download' })} />
      <Toolbar.Item iconName="park-close" tooltip={t('general.close')} onClick={() => on({ type: 'close' })} />
    </Toolbar>
  )
}

export default ScreenShotToolbar
