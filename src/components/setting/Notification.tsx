import Zindexes from '@/consts/zindex'
import { useToggle } from '@/hooks'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import produce from 'immer'
import { useTranslation } from 'react-i18next'
import { AnimatePopover, Content, Icon, Switch, WithBorder } from '../base'
import SettingItem from './Item'
import { useSetting } from './Main'

const NotificationSetting = () => {
  const [customizeVisible, toggleCustomizeVisible] = useToggle(false)
  const [setting, setSetting] = useSetting()
  const { t } = useTranslation()
  const { notification } = setting
  const toggleCustomize = (key: keyof typeof notification, value: boolean) => {
    setSetting(
      produce(setting, draft => {
        draft.notification[key] = value
      })
    )
  }
  const items: SettingItem[] = [
    {
      title: t('settings.enable all notifications'),
      description: t('settings.enable or disable all notifications'),
      children: <Switch defaultValue={notification.enabled} onChange={v => toggleCustomize('enabled', v)} />
    },
    {
      title: t('settings.customize displayed notifications'),
      description: t('settings.choose which notification should be displayed'),
      children: (
        <AnimatePopover
          positions={['bottom']}
          padding={10}
          content={
            <WithBorder
              borderRadius={8}
              className={css({
                textTransform: 'capitalize',
                '> div': css([
                  ClassName.flatButton(),
                  {
                    alignItems: 'center',
                    display: 'flex',
                    justifyContent: 'space-between',
                    textTransform: 'capitalize'
                  }
                ])
              })}
              style={{ width: 300, padding: 12, fontSize: 16, fontWeight: 600, fontFamily: 'Muli' }}
            >
              <div>
                {t('general.object')}
                <Switch onChange={v => toggleCustomize('object', v)} defaultValue={notification.object} />
              </div>
              <div>
                {t('general.link')}
                <Switch onChange={v => toggleCustomize('link', v)} defaultValue={notification.link} />
              </div>
              <div>
                {t('general.pdf')}
                <Switch onChange={v => toggleCustomize('pdf', v)} defaultValue={notification.pdf} />
              </div>
              <div>
                {t('general.note')}
                <Switch onChange={v => toggleCustomize('editor', v)} defaultValue={notification.editor} />
              </div>
              <div>
                {t('general.label')}
                <Switch onChange={v => toggleCustomize('label', v)} defaultValue={notification.label} />
              </div>
              <div>
                {t('general.collection')}
                <Switch onChange={v => toggleCustomize('collection', v)} defaultValue={notification.collection} />
              </div>
            </WithBorder>
          }
          visible={customizeVisible}
          onClickOutside={toggleCustomizeVisible}
          containerStyle={{ zIndex: String(Zindexes.Notification) }}
        >
          <Content onClick={toggleCustomizeVisible} style={{ textTransform: 'capitalize' }} className={ClassName.flatButton()} flex gap={4}>
            <span>{t('general.customize')}</span>
            <Icon name="park-down" />
          </Content>
        </AnimatePopover>
      )
    }
  ]
  return (
    <>
      {items.map((i, idx) => (
        <SettingItem key={idx} {...i} />
      ))}
    </>
  )
}

export default NotificationSetting
