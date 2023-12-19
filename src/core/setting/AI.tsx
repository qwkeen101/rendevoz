import { ISettingItem } from '@/core/setting/SettingItem'
import { useSetting } from '@/core'
import produce from 'immer'
import { Switch } from '@/components'

export default () => {
  const [setting, setSetting] = useSetting()
  const updateSetting = (updater: (s: typeof setting) => typeof setting) => {
    setSetting(s =>
      produce(s, draft => {
        updater(draft)
      })
    )
  }
  const questionsSettings: ISettingItem[] = [
    {
      title: '总结以后生成问题',
      children: <Switch value={setting}/>
    }
  ]
}
