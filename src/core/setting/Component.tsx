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

  const editorSettingItems: SettingItem[] = [
    {
      title: t('settings.object auto become inline when dragged into editor'),
      children: <Switch value={setting.editor.objectAutoBecomeInline} onChange={() => toggleSetting('editor', 'objectAutoBecomeInline')} />
    }
  ]
  const translateSettingItems: SettingItem[] = [
    {
      title: t('settings.auto go to translate original text'),
      children: <Switch value={setting.translate.autoGotoHoverText} onChange={() => toggleSetting('translate', 'autoGotoHoverText')} />
    },
    {
      title: t('settings.show original text when hover on text'),
      children: (
        <Switch value={setting.translate.showOrigWhenHoverText} onChange={() => toggleSetting('translate', 'showOrigWhenHoverText')} />
      )
    }
  ]

  const webpageSettingItems: SettingItem[] = [
    {
      title: t('settings.enable search auto suggestion'),
      children: (
        <Switch
          value={setting.webpage.enableSearchAutoSuggestion}
          onChange={() => toggleSetting('webpage', 'enableSearchAutoSuggestion')}
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
      <div className={ClassName.title('18px')} style={{ marginTop: 10 }}>
        {t('settings.editor settings')}
      </div>
      {editorSettingItems.map(i => (
        <SettingItem titleSize={14} key={i.title} {...i} />
      ))}
      <div className={ClassName.title('18px')} style={{ marginTop: 10 }}>
        {t('settings.translate settings')}
      </div>
      {translateSettingItems.map(i => (
        <SettingItem titleSize={14} key={i.title} {...i} />
      ))}
      <div className={ClassName.title('18px')} style={{ marginTop: 10 }}>
        {t('settings.webpage settings')}
      </div>
      {webpageSettingItems.map(i => (
        <SettingItem titleSize={14} key={i.title} {...i} />
      ))}
    </>
  )
}

export default ComponentSetting
