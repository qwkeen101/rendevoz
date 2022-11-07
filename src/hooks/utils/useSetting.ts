import { GlobalScope } from '@/jotai/jotaiScope'
import { atom, useAtom } from 'jotai'

interface Setting {
  appearance: {
    language: string
  }
  editor: {
    toolbarPosition: 'float' | 'top' | 'bottom'
  }
}
const defaultSetting: Setting = {
  appearance: {
    language: 'en-US'
  },
  editor: {
    toolbarPosition: 'top'
  }
}
const localSetting = localStorage.getItem('setting')
const initialSetting = localSetting ? (JSON.parse(localSetting) as Setting) : defaultSetting
const settingAtom = atom<Setting>(initialSetting)
const useSetting = (): [Setting, (newSetting: Setting) => void] => {
  const [setting, setSetting] = useAtom(settingAtom, GlobalScope)
  const set = (newSetting: Setting) => {
    setSetting(newSetting)
    localStorage.setItem('setting', JSON.stringify(newSetting))
  }
  return [setting, set]
}

export default useSetting
