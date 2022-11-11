import { Content } from '@/components/base'
import Select from '@/components/base/select'
import Switch from '@/components/base/Switch'
import { useSetting } from '@/hooks'
import produce from 'immer'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import SettingItem from './Item'

const SupportedLangs = {
  'en-US': 'English',
  'zh-CN': '简体中文'
}
const AppearanceSetting = () => {
  const [setting, setSetting] = useSetting()
  const { t, i18n } = useTranslation()
  const appearance: { title: string; description: string; children: ReactNode }[] = [
    {
      title: t('settings.language'),
      description: t('settings.language description'),
      children: (
        <Select
          closeOnSelect
          deselectable={false}
          style={{ width: 200 }}
          menuStyle={{ width: 200 }}
          onSelect={v => {
            i18n.changeLanguage(v[0])
            setSetting(
              produce(setting, draft => {
                draft.appearance.language = v[0]
              })
            )
          }}
          defaultValue={setting.appearance.language}
        >
          {Object.entries(SupportedLangs).map(([key, value]) => (
            <Select.Option value={key}>{value}</Select.Option>
          ))}
        </Select>
      )
    },
    {
      title: 'Logo',
      description: 'Show or hide logo',
      children: (
        <Switch
          onChange={v => {
            setSetting(
              produce(setting, draft => {
                draft.appearance.logo = v
              })
            )
          }}
          defaultValue={setting.appearance.logo}
        />
      )
    }
  ]
  return (
    <Content flex column>
      {appearance.map(i => (
        <SettingItem {...i} />
      ))}
    </Content>
  )
}

export default AppearanceSetting
