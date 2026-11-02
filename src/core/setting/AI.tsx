import { ISettingItem } from '@/core/setting/SettingItem'
import { GlobalSetting } from '@/core'
import produce from 'immer'
import { Button, Content, Icon, Modal } from '@/components'
import { useTranslation } from 'react-i18next'
import SettingGroup from '@/core/setting/SettingGroup'
import Select from '@/components/base/select'
import { Line } from 'rc-progress'
import { useToggle } from '@/hooks'
import BuyCredit from '@/components/BuyCredit'
import { usesOfficialAI } from '@/api/services/ai/universalAIProvider'
import { OFFICIAL_BACKEND_ENABLED } from '@/config/backend'
import { memo, useEffect } from 'react'
import UserService from '@/api/services/user.service'
import toast from 'react-hot-toast'
import trans from '@/consts/trans'
import { AIService } from '@/api/services'

export default memo(() => {
  const [setting, setSetting] = GlobalSetting.useSetting()
  const { t } = useTranslation()
  const [user] = UserService.useUser()

  const [buyCreditVisible, toggleBuyCreditVisible] = useToggle(false)
  const updateSetting = (updater: (s: typeof setting) => void) => {
    setSetting(s =>
      produce(s, draft => {
        updater(draft)
      })
    )
  }
  const isPro = UserService.useIsUserPro(true)
  const isPaidPro = UserService.useIsUserPro(false)
  useEffect(() => {
    if (isPro && OFFICIAL_BACKEND_ENABLED) {
      UserService.getUserDetails()
    }
  }, [])
  if (!isPro) {
    return (
      <div className={'w-full my-auto'}>
        <div className={'flex gap-8 items-center'}>
          <div className={'text-4xl font-bold mb-1 flex gap-3'}>
            <Icon name={'custom-stars'} />
            Use AI with Premium
          </div>
        </div>
        <div className={'transparent-font text-lg'}>Subscribe today to make AI your study copilot and enjoy access to those features.</div>
        <div className={'flex flex-wrap gap-x-12 mt-6 gap-y-6'}>
          <div>
            <div className={'font-size-12 font-bold transparent-font mb-2'}>With Premium you can</div>
            {[
              'Unlimited AI summary',
              'Generate comprehensive outlines and highlights',
              'View and download AI mindmap',
              'AI audio transcription',
              'AI translation',
              'AI chat',
              'Use your own OpenAI API key and provider'
            ].map(i => (
              <div key={i} className={'flex w-fit mb-2 text-md rounded-full py-1 items-center gap-2'}>
                <Icon theme={'filled'} size={16} className={'text-green-600'} name={'park-check-one'} />
                {i}
              </div>
            ))}
          </div>
          <div>
            <div className={'font-size-12 font-bold transparent-font mb-2'}>More upcoming features</div>
            {['Search through your knowledge base smartly', 'And more...'].map(i => (
              <div key={i} className={'flex w-fit mb-2 text-md rounded-full py-1 items-center gap-2'}>
                <Icon theme={'filled'} size={16} className={'text-green-600'} name={'park-check-one'} />
                {i}
              </div>
            ))}
          </div>
        </div>
        <div className={'flex gap-6 items-center mt-3'}>
          <div
            onClick={() => {
              const user = UserService.getUser()
              if (!user) {
                toast.error(t(trans.Errors.FailedToValidateUser))
                return
              }
              GlobalSetting.focusSetting('subscription')
            }}
            className={'reverse-theme-button w-fit font-medium !rounded-full !px-4 !py-1.5'}
          >
            Subscribe now and get AI
          </div>
        </div>
      </div>
    )
  }

  const usageSettings: ISettingItem[] = [
    {
      title: t('settings.Available AI credits'),
      description: `${(user?.availableAICredit ?? 0).toFixed()}`,
      children: (
        <Button.IconButton
          text={t('settings.Buy credits')}
          icon={'park-buy'}
          className={'select-button !px-3.5 font-medium !rounded-md'}
          onClick={() => {
            toggleBuyCreditVisible(true)
          }}
        ></Button.IconButton>
      )
    }
  ].filter(i => i)
  const openAISettings: ISettingItem[] = [
    // @ts-ignore
    ...(!usesOfficialAI(setting.AI.provider)
      ? [
          {
            title: 'API key',
            focusKey: 'openaiApiKey',
            type: 'input',
            value: setting.AI.apiKey,
            onChange: v =>
              setSetting(s => ({
                ...s,
                AI: { ...s.AI, apiKey: v }
              }))
          },
          {
            title: 'Base URL',
            type: 'input',
            description: t('settings.Base URL desc'),
            value: setting.AI.baseUrl,
            onChange: v =>
              setSetting(s => ({
                ...s,
                AI: { ...s.AI, baseUrl: v }
              }))
          }
        ]
      : usageSettings)
  ]

  const functionSettings: ISettingItem[] = [
    {
      title: t('settings.Output language'),
      children: (
        <Select
          menuStyle={{
            maxHeight: 300,
            overflowY: 'auto'
          }}
          closeOnSelect={true}
          value={setting.AI.language}
          options={AIService.getAvailableAILanguages().map(i => ({
            value: i,
            children: i
          }))}
          onSelect={v => {
            updateSetting(s => {
              s.AI.language = v[0]
            })
          }}
        />
      )
    },
    {
      title: t('settings.Enable AI translation'),
      type: 'switch',
      value: !!setting.AI.aiTranslator,
      onChange: () => setSetting(s => ({ ...s, AI: { ...s.AI, aiTranslator: !s.AI.aiTranslator } }))
    },
    {
      title: t('settings.AI chat context count'),
      type: 'input',
      inputType: 'number',
      description: t('settings.AI chat context desc'),
      value: `${setting.AI.aiChatHistoryCount}`,
      onChange: v =>
        setSetting(s => ({
          ...s,
          AI: { ...s.AI, aiChatHistoryCount: v === '' ? undefined : !Number.isNaN(Number(v)) ? Number(v) : undefined }
        }))
    },
    {
      title: t('settings.Custom explain prompt'),
      type: 'input',
      value: `${setting.AI.customExplainPrompt || ''}`,
      onChange: v =>
        setSetting(s => ({
          ...s,
          AI: { ...s.AI, customExplainPrompt: v }
        }))
    },
    {
      title: t('settings.Custom translate prompt'),
      type: 'input',
      value: `${setting.AI.customTranslatePrompt || ''}`,
      onChange: v =>
        setSetting(s => ({
          ...s,
          AI: { ...s.AI, customTranslatePrompt: v }
        }))
    }
  ]
  return (
    <>
      <Modal visible={buyCreditVisible} onClose={toggleBuyCreditVisible}>
        <BuyCredit />
      </Modal>
      <SettingGroup title={t('settings.AI')} layout={openAISettings} />
      <SettingGroup title={t('general.More')} layout={functionSettings} />
    </>
  )
})
