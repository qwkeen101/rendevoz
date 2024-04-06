import { useGlobalAtomValue, useToggle } from '@/hooks'
import { GlobalScreenShotSelectionBoxState } from '.'
import { IconWithPopover, Toolbar, WithBorder } from '@/components'
import { t } from 'i18next'
import ScreenShotOcr from './ScreenshotOcr'

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
  const [draggable, toggleDraggble] = useToggle(true)
  if (!selectionBoxState) return null
  return (
    <Toolbar>
      <Toolbar.Item>
        <IconWithPopover
          renderOnParent={true}
          tooltip={t('general.ocr')}
          placement={['top', 'bottom']}
          name="park-scanning"
          disableCloseOutside
          boundaryInset={20}
          contentDraggable={draggable}
          zIndex={19999}
          onClick={() => on({ type: 'ocr' })}
          content={
            <WithBorder>
              <ScreenShotOcr />
            </WithBorder>
          }
        ></IconWithPopover>
      </Toolbar.Item>

      <Toolbar.Item iconName="park-plus" tooltip={t('general.add as object')} onClick={() => on({ type: 'add as object' })} />
      <Toolbar.Item iconName="park-corner-up-right" tooltip={t('general.Move to')} onClick={() => on({ type: 'move-to' })} />
      <Toolbar.Item iconName="park-download" tooltip={t('general.download')} onClick={() => on({ type: 'download' })} />
      <Toolbar.Item iconName="park-return" tooltip={t('general.return')} onClick={() => on({ type: 'return' })} />
      <Toolbar.Item iconName="park-close" tooltip={t('general.close')} onClick={() => on({ type: 'close' })} />
    </Toolbar>
  )
}

export default ScreenShotToolbar
