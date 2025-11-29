import { useEffect, useLayoutEffect } from 'react'
import { useMount } from '@/hooks'
import lightHighlighter from '@/assets/prism-light.css?inline'
import darkHighlighter from '@/assets/prism-dark.css?inline'
import { GlobalTheme } from '@/consts'
import { createPortal } from 'react-dom'
import { getOS } from '@/App'
import { GlobalSetting } from '@/core'
import 'prismjs/components/prism-markup-templating'
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-cpp'
import 'prismjs/components/prism-clojure'
import 'prismjs/components/prism-coffeescript'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-dart'
import 'prismjs/components/prism-erlang'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-haskell'
import 'prismjs/components/prism-http'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-kotlin'
import 'prismjs/components/prism-less'
import 'prismjs/components/prism-lua'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-php'
import 'prismjs/components/prism-powershell'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-rust'
import 'prismjs/components/prism-solidity'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-verilog'
import 'prismjs/components/prism-vhdl'
import 'prismjs/components/prism-yaml'

const ThemeSwitcher = () => {
  const [setting, setSetting] = GlobalSetting.useSetting()
  useMount(() => {
    const os = getOS()
    if (os === 'windows') {
      document.documentElement.setAttribute('custom-scrollbar', 'true')
    }
  })
  useEffect(() => {
    if (setting.general.followSystemTheme) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      setSetting(s => ({
        ...s,
        general: {
          ...s.general,
          darkMode: mq.matches
        }
      }))
      const listener = e => {
        if (e.matches) {
          setSetting(s => ({
            ...s,
            general: {
              ...s.general,
              darkMode: true
            }
          }))
        } else {
          setSetting(s => ({
            ...s,
            general: {
              ...s.general,
              darkMode: false
            }
          }))
        }
      }
      mq.addEventListener('change', listener)
      return () => {
        mq.removeEventListener('change', listener)
      }
    }
  }, [setting.general.followSystemTheme])
  useLayoutEffect(() => {
    GlobalTheme.isDark = setting.general.darkMode
    const highlighter = document.head.querySelector('#highlighter')
    if (highlighter) {
      highlighter.remove()
    }
    if (!setting.general.darkMode) {
      document.documentElement.setAttribute('theme', 'light')
      document.documentElement.classList.remove('dark')
      const style = document.createElement('style')
      style.setAttribute('id', 'highlighter')
      style.appendChild(document.createTextNode(lightHighlighter))
      document.head.appendChild(style)
    } else {
      document.documentElement.setAttribute('theme', 'dark')
      document.documentElement.classList.add('dark')
      const style = document.createElement('style')
      style.setAttribute('id', 'highlighter')
      style.appendChild(document.createTextNode(darkHighlighter))
      document.head.appendChild(style)
    }
  }, [setting.general.darkMode])
  if (setting.general.globalCSS) {
    return createPortal(<style>{setting.general.globalCSS}</style>, document.head)
  }
  return null
}

export default ThemeSwitcher
