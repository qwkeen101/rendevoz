import Zindexes from '@/consts/zindex'
import { useToggle } from '@/hooks'
import ClassName from '@/styles/classNames'
import produce from 'immer'
import { AnimatePopover, Content, Icon, Switch, WithBorder } from '../base'
import SettingItem from './Item'
import { useSetting } from './Main'

const NotificationSetting = () => {
  const [customizeVisible, toggleCustomizeVisible] = useToggle(false)
  const [setting, setSetting] = useSetting()

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
      title: 'Toggle All Notifications',
      description: 'Enable or disable all notifications',
      children: <Switch defaultValue={notification.enabled} onChange={v => toggleCustomize('enabled', v)} />
    },
    {
      title: 'Customize Displayed Notifications',
      description: 'Choose which notification should be displayed',
      children: (
        <AnimatePopover
          positions={['bottom']}
          padding={10}
          content={
            <WithBorder borderRadius={8} style={{ width: 300, padding: 12, fontSize: 16, fontWeight: 600, fontFamily: 'Muli' }}>
              <Content className={ClassName.flatButton()} alignItems="center" flex justifyContent="space-between">
                Object
                <Switch onChange={v => toggleCustomize('object', v)} defaultValue={notification.object} />
              </Content>
              <Content className={ClassName.flatButton()} alignItems="center" flex justifyContent="space-between">
                Link
                <Switch onChange={v => toggleCustomize('link', v)} defaultValue={notification.link} />
              </Content>
              <Content className={ClassName.flatButton()} alignItems="center" flex justifyContent="space-between">
                PDF
                <Switch onChange={v => toggleCustomize('pdf', v)} defaultValue={notification.pdf} />
              </Content>
              <Content className={ClassName.flatButton()} alignItems="center" flex justifyContent="space-between">
                Editor
                <Switch onChange={v => toggleCustomize('editor', v)} defaultValue={notification.editor} />
              </Content>
              <Content className={ClassName.flatButton()} alignItems="center" flex justifyContent="space-between">
                Label
                <Switch onChange={v => toggleCustomize('label', v)} defaultValue={notification.label} />
              </Content>
              <Content className={ClassName.flatButton()} alignItems="center" flex justifyContent="space-between">
                Collection
                <Switch onChange={v => toggleCustomize('collection', v)} defaultValue={notification.collection} />
              </Content>
            </WithBorder>
          }
          visible={customizeVisible}
          onClickOutside={toggleCustomizeVisible}
          containerStyle={{ zIndex: String(Zindexes.Tooltip) }}
        >
          <Content onClick={toggleCustomizeVisible} className={ClassName.flatButton()} flex gap={4}>
            <span>Customize</span>
            <Icon name="park-down" />
          </Content>
        </AnimatePopover>
      )
    }
  ]
  return (
    <>
      {items.map(i => (
        <SettingItem {...i} />
      ))}
    </>
  )
}

export default NotificationSetting
