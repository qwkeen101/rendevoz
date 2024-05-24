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
        padding={10}
        closeOnClickOutside={true}
        align="start"
        content={
          <WithBorder
            padding={6}
            style={{
              fontSize: '0.95rem'
            }}
          >
            <Button.IconButton
              icon="park-zoom-internal"
              text={t('settings.keep ratio when resizing image')}
              className={buttonClazz}
              onClick={() => {
                setSetting(s =>
                  produce(s, draft => {
                    draft.whiteboard.imageResizeKeepRatio = !draft.whiteboard.imageResizeKeepRatio
                  })
                )
              }}
              enabled={setting.whiteboard.imageResizeKeepRatio}
            />
            <Button.IconButton
              icon="park-horizontally-centered"
              text={t('settings.snap to objects')}
              className={buttonClazz}
              enabled={setting.whiteboard.snapToObject}
              onClick={() => {
                setSetting(s =>
                  produce(s, draft => {
                    draft.whiteboard.snapToObject = !draft.whiteboard.snapToObject
                  })
                )
              }}
            />
            <div className={ClassName.description()} style={{ marginTop: 10 }}>
              {t('general.Default line type')}
            </div>
            <Button.IconButton
              enabled={whiteboardLineType === 'straight'}
              className={buttonClazz}
              icon="custom-straight"
              onClick={() => setLineType('straight')}
              text={t('general.Straight line')}
            />
            <Button.IconButton
              enabled={whiteboardLineType === 'curve'}
              className={buttonClazz}
              icon="custom-curve"
              onClick={() => setLineType('curve')}
              text={t('general.Curve line')}
            />
            <Button.IconButton
              enabled={whiteboardLineType === 'polyline'}
              className={buttonClazz}
              icon="park-connection"
              onClick={() => setLineType('polyline')}
              text={t('general.Step line')}
            />
            <div className={ClassName.description()} style={{ marginTop: 10 }}>
              {t('general.Background type')}
            </div>
            <Button.IconButton
              enabled={whiteboardBackgroundType === 'none'}
              className={buttonClazz}
              icon="park-close"
              onClick={() => setBackgroundType('none')}
              text={t('general.None')}
            />
            <Button.IconButton
              enabled={whiteboardBackgroundType === 'dot'}
              className={buttonClazz}
              icon="custom-dots"
              onClick={() => setBackgroundType('dot')}
              text={t('general.Dots')}
            />
            <Button.IconButton
              enabled={whiteboardBackgroundType === 'line'}
              className={buttonClazz}
              icon="park-grid-two"
              onClick={() => setBackgroundType('line')}
              text={t('general.Line')}
            />
          </WithBorder>
        }
        positions={['left']}
      >
        <Tooltip content={'Settings'} align={'end'}>
          <Icon
            className={ClassName.flatButton(4, '4px')}
            size={18}
            name="park-more"
            containerStyle={{
              pointerEvents: 'auto'
            }}
          />
        </Tooltip>
      </AnimatePopover>
    </>
  )
})

export default WhiteboardSettings
