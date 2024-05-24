import { useEffect, useState } from 'react'
import { GlobalSetting } from '@/core'
import { Content } from '@/components'
import CodeEditor from '@/core/components/code/CodeEditor'
import { useDebounceEffect } from '@/hooks'
import { useTranslation } from 'react-i18next'

export default () => {
  const [code, setCode] = useState<string>()
  const { t } = useTranslation()
  const getSetting = GlobalSetting.getSetting
  const setSetting = GlobalSetting.setSetting
  useEffect(() => {
    const s = getSetting()
    setCode(s.general.globalCSS)
  }, [])
  useDebounceEffect(
    () => {
      setSetting(s => ({
        ...s,
        general: {
          ...s.general,
          globalCSS: code
        }
      }))
    },
    [code],
    {
      wait: 100
    }
  )
  return (
    <Content style={{ width: '80vw', height: '80vh', overflowY: 'auto' }}>
      <div
        className={'border-bottom'}
        style={{
          padding: '6px 12px',
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 12
        }}
      >
        {t('settings.Global stylesheet')}
        <a
          style={{
            fontSize: 13,
            marginLeft: 24
          }}
          href={'https://github.com/Rendevoz/Rendevoz/blob/main/colors.less'}
          target={'_blank'}
        >
          Example
        </a>
      </div>
      <CodeEditor value={code} language={'css'} onChange={v => setCode(v)} />
    </Content>
  )
}
