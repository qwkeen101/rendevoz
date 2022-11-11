import { GlobalScope } from '@/jotai/jotaiScope'
import { atom, useAtom } from 'jotai'

interface Setting {
  appearance: {
    language: string
    logo: boolean
  }
  editor: {
    toolbarPosition: 'float' | 'top' | 'bottom',
    confirmExit: boolean
  }
}
const defaultSetting: Setting = {
  appearance: {
    language: 'en-US',
    logo: true
  },
  editor: {
    toolbarPosition: 'float',
    confirmExit: true
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
