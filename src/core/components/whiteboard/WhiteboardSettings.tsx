import { AnimatePopover, Button, Content, Icon, Modal, Tooltip, WithBorder } from '@/components'
import { GlobalSetting } from '@/core'
import produce from 'immer'
import { ClassName } from 'rendevoz'
import { useTranslation } from 'react-i18next'
import { WhiteboardAtom } from '@/core/components/whiteboard/StateHooks'
import { useSelectAtomValue, useToggle } from '@/hooks'
import { ObjectStore } from '@/api/stores'
import ExportPanel from '@/core/components/whiteboard/toolbars/ExportPanel'
import { memo } from 'react'

const WhiteboardSettings = memo(() => {
  const [setting, setSetting] = GlobalSetting.useSetting()
  const { t } = useTranslation()
  const [exportModalVisible, toggleExportModalVisible] = useToggle(false)
  const whiteboardLineType = useSelectAtomValue(WhiteboardAtom, s => s?.lineType)
  const whiteboardBackgroundType = useSelectAtomValue(WhiteboardAtom, s => s?.backgroundType)
  const whiteboardId = useSelectAtomValue(WhiteboardAtom, s => s?.id)

  const setLineType = t => {
    setSetting(
      produce(setting, draft => {
        draft.whiteboard.defaultLineType = t
      })
    )
    if (whiteboardId) {
      ObjectStore('whiteboard').updateOne({ id: whiteboardId, lineType: t })
    }
  }
  const setBackgroundType = t => {
    setSetting(
      produce(setting, draft => {
        draft.whiteboard.defaultBackgroundType = t
      })
    )
    if (whiteboardId) {
      ObjectStore('whiteboard').updateOne({ id: whiteboardId, backgroundType: t })
    }
  }
  const buttonClazz = ClassName.flatButton(4, '2px 6px')
  return (
    <>
      <Modal visible={exportModalVisible} onClose={() => toggleExportModalVisible(false)}>
        <ExportPanel
          onBack={() => {
            toggleExportModalVisible(false)
          }}
        />
      </Modal>
      <AnimatePopover
        padding={6}
        closeOnClickOutside={true}
        align="start"
        content={
          <WithBorder className={'font-size-13'} padding={6} width={220}>
            <Button.IconButton
              icon="park-horizontally-centered"
              text={t('settings.snap to objects')}
              className={setting.whiteboard.snapToObject ? 'bg-hover' : ''}
              onClick={() => {
                setSetting(s =>
                  produce(s, draft => {
                    draft.whiteboard.snapToObject = !draft.whiteboard.snapToObject
                  })
                )
              }}
            />
            <div className={'menu-sub-title'} style={{ margin: '4px 6px' }}>
              {t('whiteboard.Line type')}
            </div>
            <Button.IconButton
              className={whiteboardLineType === 'straight' ? 'bg-hover' : ''}
              icon="custom-straight"
              onClick={() => setLineType('straight')}
              text={t('whiteboard.Straight line')}
            />
            <Button.IconButton
              className={whiteboardLineType === 'curve' ? 'bg-hover' : ''}
              icon="custom-curve"
              onClick={() => setLineType('curve')}
              text={t('whiteboard.Curve line')}
            />
            <Button.IconButton
              className={whiteboardLineType === 'polyline' ? 'bg-hover' : ''}
              icon="park-connection"
              onClick={() => setLineType('polyline')}
              text={t('whiteboard.Step line')}
            />
            <div className={'menu-sub-title'} style={{ margin: '4px 6px' }}>
              {t('general.Background type')}
            </div>
            <Button.IconButton
              className={whiteboardBackgroundType === 'none' ? 'bg-hover' : ''}
              icon="park-close"
              onClick={() => setBackgroundType('none')}
              text={t('general.None')}
            />
            <Button.IconButton
              className={whiteboardBackgroundType === 'dot' ? 'bg-hover' : ''}
              icon="custom-dots"
              onClick={() => setBackgroundType('dot')}
              text={t('general.Dots')}
            />
            <Button.IconButton
              className={whiteboardBackgroundType === 'line' ? 'bg-hover' : ''}
              icon="park-grid-two"
              onClick={() => setBackgroundType('line')}
              text={t('general.Line')}
            />
          </WithBorder>
        }
        positions={['left']}
      >
        <Icon
          className={'button p-4'}
          size={18}
          name="park-more"
          containerStyle={{
            pointerEvents: 'auto'
          }}
        />
      </AnimatePopover>
    </>
  )
})

export default WhiteboardSettings
