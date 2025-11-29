import { GlobalSetting } from '@/core'
import { AnimatePopover, Select, Slider, Switch, WithBorder } from '@/components'
import BlockColorPicker from '@/core/components/editor/components/BlockColorPicker'
import { Colors } from '@/consts'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { GlobalGraphAtom } from '@/scenes/GraphPage'
import { useGlobalAtomValue } from '@/hooks'

export default memo(() => {
  const graphValue = useGlobalAtomValue(GlobalGraphAtom)
  const [setting, setSetting] = GlobalSetting.useSetting()
  const { t } = useTranslation()
  return (
    <div className={'flex flex-col h-full gap-5 p-6 overflow-y-auto pb-40'}>
      <div className={'flex flex-col gap-4'}>
        <div className={'menu-sub-title -mb-2'}>{t('graph.Node')}</div>
        <div className={'flex justify-between items-center gap-3'}>
          <div>{t('graph.Color')}</div>
          <AnimatePopover
            padding={6}
            positions={['bottom', 'top']}
            content={setV => (
              <WithBorder>
                <BlockColorPicker
                  showBg={true}
                  showFont={false}
                  bgBackDefault={false}
                  onPickBackgroundColor={v => {
                    setV(false)
                    setSetting(s => ({ ...s, graph: { ...s.graph, nodeColor: v } }))
                  }}
                />
              </WithBorder>
            )}
          >
            <div
              className={'size-6 cursor-pointer rounded'}
              style={{
                background: Colors.getAdaptColor(setting.graph.nodeColor)
              }}
            ></div>
          </AnimatePopover>
        </div>
        <div className={'flex flex-col gap-3'}>
          <div>{t('graph.Distance')}</div>
          <Slider
            min={40}
            max={160}
            onChange={v => setSetting(s => ({ ...s, graph: { ...s.graph, nodeDistance: v } }))}
            value={setting.graph.nodeDistance}
          />
        </div>
        <div className={'flex flex-col gap-3'}>
          <div>{t('graph.Radius')}</div>
          <Slider
            min={5}
            step={0.1}
            max={20}
            onChange={v => setSetting(s => ({ ...s, graph: { ...s.graph, nodeSize: v } }))}
            value={setting.graph.nodeSize}
          />
        </div>
      </div>
      <div className={'flex flex-col gap-4'}>
        <div className={'menu-sub-title -mb-2'}>{t('general.More')}</div>
        <div className={'flex gap-6 justify-between items-center -mb-1'}>
          <div>{t('general.Open object in')}</div>
          <Select
            value={setting.graph.openIn}
            onSelect={v => {
              setSetting(s => ({ ...s, graph: { ...s.graph, openIn: v[0] } }))
            }}
            className={'font-size-13'}
            options={[
              {
                value: 'new tab',
                children: t('general.New tab')
              },
              {
                value: 'side peek',
                children: t('general.Side peek')
              }
            ]}
          />
        </div>
        <div className={'flex gap-6 justify-between items-center'}>
          <div>{t('graph.Simple mode')}</div>
          <Switch value={setting.graph.simpleMode} onChange={v => setSetting(s => ({ ...s, graph: { ...s.graph, simpleMode: v } }))} />
        </div>
        <div className={'flex gap-6 justify-between items-center'}>
          <div>{t('graph.Preview node content when hover')}</div>
          <Switch
            value={setting.graph.previewContent}
            onChange={v => setSetting(s => ({ ...s, graph: { ...s.graph, previewContent: v } }))}
          />
        </div>
        {graphValue?.mode !== 'object' && (
          <>
            <div className={'flex gap-6 justify-between items-center'}>
              <div>{t('graph.Show highlights')}</div>
              <Switch
                value={setting.graph.showHighlight}
                onChange={v => setSetting(s => ({ ...s, graph: { ...s.graph, showHighlight: v } }))}
              />
            </div>
            <div className={'flex gap-6 justify-between items-center'}>
              <div>{t('graph.Show hidden objects')}</div>
              <Switch value={setting.graph.showHidden} onChange={v => setSetting(s => ({ ...s, graph: { ...s.graph, showHidden: v } }))} />
            </div>
          </>
        )}
      </div>
    </div>
  )
})
