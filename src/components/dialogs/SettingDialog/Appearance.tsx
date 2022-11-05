import { Content } from '@/components/base'
import Select from '@/components/base/select'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocalStorage } from 'react-use'
import SettingItem from './Item'

const SupportedLangs = {
  'en-US': 'English',
  'zh-CN': '简体中文'
}
const AppearanceSetting = () => {
  const [lang, setLang] = useLocalStorage('lang', Object.keys(SupportedLangs)[0], { raw: true })
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
          onSelect={v => {
            i18n.changeLanguage(v[0])
            setLang(v[0])
          }}
          defaultValue={lang}
        >
          {Object.entries(SupportedLangs).map(([key, value]) => (
            <Select.Option value={key}>{value}</Select.Option>
          ))}
        </Select>
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
