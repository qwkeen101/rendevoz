import { AnimatePopover, Button, Content, Icon, Tooltip, WithBorder } from '@/components'
import { useSetting } from '@/core'
import produce from 'immer'
import { ClassName } from 'rendevoz'
import { useTranslation } from 'react-i18next'

const WhiteboardSettings = () => {
  const [setting, setSetting] = useSetting()
  const { t } = useTranslation()
  return (
    <Content flex column style={{ position: 'absolute', right: 20, top: 15 }} className={ClassName.circleButton(4, 4)}>
      <AnimatePopover
        padding={10}
        closeOnClickOutside={true}
        align="start"
        content={
          <WithBorder
            padding={6}
            style={{
              fontSize: '0.857rem'
            }}
          >
            <Button.IconButton
              icon="park-zoom-internal"
              text={t('settings.keep ratio when resizing image')}
              className={ClassName.flatButton(4, '2px 6px')}
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
              className={ClassName.flatButton(4, '2px 6px')}
              enabled={setting.whiteboard.snapToObject}
              onClick={() => {
                setSetting(s =>
                  produce(s, draft => {
                    draft.whiteboard.snapToObject = !draft.whiteboard.snapToObject
                  })
                )
              }}
            />
          </WithBorder>
        }
        positions={['left']}
      >
        <Icon size={20} name="park-setting" />
      </AnimatePopover>
    </Content>
  )
}

export default WhiteboardSettings
