import ClassName from '@/styles/classNames'
import produce from 'immer'
import { useTranslation } from 'react-i18next'
import { Switch } from '../../components/base'
import SettingItem from './SettingItem'
import { IObjectsAndLinkSetting, useSetting } from '.'
import SettingGroup from '@/core/setting/SettingGroup'

const ObjectsAndLinksSetting = () => {
  const { t } = useTranslation()
  const [setting, setSetting] = useSetting()
  const toggleSetting = (key: keyof IObjectsAndLinkSetting['objectAndLink']) => {
    if ((key !== 'enableAll' && setting.objectAndLink.enableAll) || key === 'enableAll') {
      setSetting(s =>
        produce(s, draft => {
          draft.objectAndLink[key] = !draft.objectAndLink[key]
        })
      )
    }
  }
  const {
    enableAll,
    enableDropOnEditorLink,
    enableDropOnPDFLink,
    enableDropOnWhiteboardLink,
    enableDragFromEditorLink,
    enableDragFromPDFLink,
    enableDropAutoGenerateObject
  } = setting.objectAndLink
  const linkSettingItems: SettingItem[] = [
    {
      title: t('settings.enable auto add link'),
      children: <Switch value={enableAll} onChange={() => toggleSetting('enableAll')} />
    }
  ]
  const objectSettingItems: SettingItem[] = [
    {
      title: t('settings.enable drop auto generate object'),
      children: <Switch value={enableDropAutoGenerateObject} onChange={() => toggleSetting('enableDropAutoGenerateObject')} />
    },
    {
      title: t('settings.auto hide label object'),
      children: (
        <Switch
          value={setting.object.autoHideLabelObject}
          onChange={() =>
            setSetting(s =>
              produce(s, draft => {
                draft.object.autoHideLabelObject = !draft.object.autoHideLabelObject
              })
            )
          }
        />
      )
    }
  ]
  return (
    <>
      <SettingGroup title={t('settings.link settings')} layout={linkSettingItems} />
      <SettingGroup title={t('settings.object settings')} layout={objectSettingItems} />
    </>
  )
}

export default ObjectsAndLinksSetting
