import { memo, useRef, useState } from 'react'
import { AnimatePopover, Icon, Menu, WithBorder } from '@/components'
import { GlobalSetting } from '@/core'
import consts from './AIConsts'
import classnames from 'classnames'
const { BrandLogos, ModelNames, ModelInfos, Models } = consts
const flattedInfo = Object.entries(ModelInfos)
  .map(i => i[1].map(o => ({ ...o, logo: BrandLogos[i[0]], brand: i[0] })))
  .flat(1)
export default memo(() => {
  const [setting, setSetting] = GlobalSetting.useSetting()
  const [visible, setVisible] = useState(false)
  const [info, setInfo] = useState<(typeof flattedInfo)[0]>()
  const ref = useRef<HTMLDivElement>(null)
  const currentModel = flattedInfo.find(i => i.model === (setting.AI.provider || 'gpt-4o-mini'))
  return (
    <AnimatePopover
      padding={6}
      onVisiblityChange={v => setVisible(v)}
      positions={['top']}
      align={'start'}
      content={setV => (
        <AnimatePopover
          parentElement={ref}
          visible={info !== undefined}
          positions={['right', 'left']}
          align={'start'}
          innerRef={ref}
          padding={8}
          content={
            info && (
              <WithBorder style={{ width: 320 }} className={'p-3'}>
                <div className={'flex items-center'}>
                  {BrandLogos[info.brand]}
                  <div className={'space-x-1'}>
                    <span className={'transparent-font ml-2'}>{info.brand}</span>
                    <span className={'mx-1'}>{'/'}</span>
                    <span className={'font-medium'}>{ModelNames[info.model]}</span>
                  </div>
                </div>
                <div className={'font-size-12 mt-1 transparent-font'}>{info.description}</div>
                <table className={'font-size-12 [&_td]:py-1.5 mt-1 -mb-1.5 w-full'}>
                  <tbody>
                    <tr className={'border-bottom'}>
                      <td className={'transparent-font'}>Context</td>
                      <td>{new Intl.NumberFormat().format(info.context || 0)} tokens</td>
                    </tr>
                    <tr className={'border-bottom'}>
                      <td className={'transparent-font'}>Input pricing</td>
                      <td>${info.input?.toFixed(2)} / million tokens</td>
                    </tr>
                    <tr>
                      <td className={'transparent-font'}>Output pricing</td>
                      <td>${info.output?.toFixed(2)} / million tokens</td>
                    </tr>
                  </tbody>
                </table>
              </WithBorder>
            )
          }
        >
          <WithBorder className={'py-1 max-h-96 overflow-y-auto'} style={{ width: 260 }}>
            <Menu.NavigationMenu
              onSelect={v => {
                setV(false)
                setSetting(s => ({ ...s, AI: { ...s.AI, provider: v.key } }))
              }}
              onSelectChange={k => {
                const first = k[0]
                setInfo(flattedInfo.find(i => i.model === first))
              }}
              layout={Object.entries(Models)
                .map(i =>
                  i[1].map(o => ({
                    type: 'item',
                    key: o,
                    icon: <div className={'font-size-15'}>{BrandLogos[i[0]]}</div>,
                    text: ModelNames[o]
                  }))
                )
                .flat(1)}
            />
          </WithBorder>
        </AnimatePopover>
      )}
    >
      <div
        className={
          'bg-secondary select-none cursor-default gap-1.5 flex items-center px-2 py-1 rounded-3xl after:!transition-colors hover-after-bg-hover'
        }
      >
        <div className={'font-size-15'}>{currentModel?.logo}</div>
        <div className={'font-size-12'}>{ModelNames[currentModel?.model]}</div>
        <Icon
          name={'park-down'}
          strokeWidth={4}
          className={classnames('small-transparent transition-transform', visible ? '-rotate-180' : '')}
        />
      </div>
    </AnimatePopover>
  )
})
