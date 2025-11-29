import { AnimatePopover, Button, Icon, Menu, WithBorder } from '@/components'
import langs from '@/core/components/feed/news/AvailableLangAndRegions.json'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import useFeedData from '../hooks/useFeedData'

export default () => {
  const data = useFeedData()
  const defaultLang = data.language ?? 'en'
  const defaultRegion = data.region ?? 'us'
  const langName = useMemo(
    () => langs.find(i => i.language === defaultLang && i.region === defaultRegion)?.name,
    [defaultLang, defaultRegion]
  )
  const { t } = useTranslation()
  return (
    <AnimatePopover
      align='start'
      padding={6}
      content={setV => (
        <WithBorder className={'py-1 min-w-56 max-h-72 overflow-y-auto'}>
          <Menu.NavigationMenu
            onSelect={k => {
              if (k && 'key' in k) {
                setV(false)
                const target = langs.find(i => i.name === k.key)
                if (target) {
                  useFeedData.updateData(curr => ({ ...curr, language: target.language, region: target.region }))
                }
              }
            }}
            defaultSelected={langName ? [langName] : undefined}
            layout={[
              {
                type: 'title',
                name: t(trans.ChooseLanguage)
              },
              // @ts-ignore
              ...langs.map(i => ({
                type: 'item',
                key: i.name,
                text: i.name
              }))
            ]}
          />
        </WithBorder>
      )}
      positions={['bottom']}
    >
      <div className='flex items-center rounded-3xl light-hover pl-3 pr-2 select-none py-2 cursor-default gap-3'>
        <Icon name='park-sphere' size={18} />
        <div className='font-bold font-size-13'>{langName?.split('(')[0]}</div>
        <Icon name='park-down' className='opacity-60 ml-2' strokeWidth={6} />
      </div>
    </AnimatePopover>
  )
}
