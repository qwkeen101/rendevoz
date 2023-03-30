import ClassName from '@/styles/classNames'
import produce from 'immer'
import { useTranslation } from 'react-i18next'
import { Switch } from '../../components/base'
import SettingItem from './Item'
import { IComponentSetting, useSetting } from '.'

const ComponentSetting = () => {
  const { t } = useTranslation()
  const [setting, setSetting] = useSetting()
  const toggleSetting = (key: keyof IComponentSetting, v: keyof IComponentSetting[keyof IComponentSetting]) => {
    setSetting(s =>
      produce(s, draft => {
        draft[key][v] = !draft[key][v]
      })
    )
  }

  const whiteboardSettingItems: SettingItem[] = [
    {
      title: t('settings.enable whiteboard minimap'),
      children: <Switch value={setting.whiteboard.enableMinimap} onChange={() => toggleSetting('whiteboard', 'enableMinimap')} />
    },
    {
      title: t('settings.enable add link between objects when connect'),
      children: (
        <Switch
          value={setting.whiteboard.enableAddLinkBetweenObjectsWhenConnect}
          onChange={() => toggleSetting('whiteboard', 'enableAddLinkBetweenObjectsWhenConnect')}
        />
      )
    }
  ]

  return (
    <>
      <div className={ClassName.title('18px')}>{t('settings.whiteboard settings')}</div>
      {whiteboardSettingItems.map(i => (
        <SettingItem titleSize={14} key={i.title} {...i} />
      ))}
    </>
  )
}

export default ComponentSetting
