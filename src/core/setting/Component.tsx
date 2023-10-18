import ClassName from '@/styles/classNames'
import produce from 'immer'
import { useTranslation } from 'react-i18next'
import { AnimatePopover, Button, Content, Switch } from '../../components/base'
import { ISettingItem } from './SettingItem'
import { useSetting } from '.'
import Select from '@/components/base/select'
import { ChromePicker } from 'react-color'
import { useEffect, useRef } from 'react'
import { useUpdate } from 'react-use'
import { NumberInput } from '@/components'
import { IComponentSetting } from '@/core/setting/types'
import SettingGroup from '@/core/setting/SettingGroup'

const ComponentSetting = () => {
  const { t } = useTranslation()
  const [setting, setSetting] = useSetting()
  function toggleSetting<K extends keyof IComponentSetting>(key: K, v: keyof IComponentSetting[K]) {
    setSetting(s =>
      produce(s, draft => {
        draft[key][v] = !draft[key][v]
      })
    )
  }

  const whiteboardSettingItems: ISettingItem[] = [
    {
      title: t('settings.enable add link between objects when connect'),
      children: (
        <Switch
          value={setting.whiteboard.enableAddLinkBetweenObjectsWhenConnect}
          onChange={() => toggleSetting('whiteboard', 'enableAddLinkBetweenObjectsWhenConnect')}
        />
      )
    },
    {
      title: t('settings.drop file auto object'),
      children: <Switch value={setting.whiteboard.dropFileAutoObject} onChange={() => toggleSetting('whiteboard', 'dropFileAutoObject')} />
    }
  ]

  const editorSettingItems: ISettingItem[] = [
    {
      title: t('settings.object auto become inline when dragged into editor'),
      children: <Switch value={setting.editor.objectAutoBecomeInline} onChange={() => toggleSetting('editor', 'objectAutoBecomeInline')} />
    }
  ]
  const translateSettingItems: ISettingItem[] = [
    {
      title: t('settings.auto go to translate original text'),
      children: <Switch value={setting.translate.autoGotoHoverText} onChange={() => toggleSetting('translate', 'autoGotoHoverText')} />
    },
    {
      title: t('settings.show original text when hover on text'),
      children: (
        <Switch value={setting.translate.showOrigWhenHoverText} onChange={() => toggleSetting('translate', 'showOrigWhenHoverText')} />
      )
    }
  ]

  const containerRef = useRef<HTMLDivElement>(null)

  const update = useUpdate()

  useEffect(() => {
    if (setting.pdf.renderMode === 'custom') {
      update()
    }
  }, [setting.pdf.renderMode])
  const pdfSettingItems: (ISettingItem | undefined)[] = [
    {
      title: t('settings.pdf render mode'),
      children: (
        <Select
          closeOnSelect
          value={setting.pdf.renderMode}
          options={[
            { value: 'default', children: t('settings.default') },
            { value: 'followTheme', children: t('settings.follow theme') },
            { value: 'custom', children: t('settings.custom') }
          ]}
          onSelect={v => {
            if (typeof v[0] === 'string') {
              setSetting(s =>
                produce(s, s => {
                  s.pdf.renderMode = v[0]
                })
              )
            }
          }}
        />
      )
    },
    setting.pdf.renderMode === 'custom'
      ? {
          title: t('settings.customize render mode'),
          // column: true,
          children: (
            <Content ref={containerRef} flex alignItems="center" gap={15}>
              <AnimatePopover
                padding={10}
                parentElement={containerRef.current}
                content={
                  <ChromePicker
                    disableAlpha
                    color={setting.pdf.customRenderBackground}
                    onChange={v => {
                      setSetting(s =>
                        produce(s, g => {
                          g.pdf.customRenderBackground = v.hex
                        })
                      )
                    }}
                  />
                }
              >
                <Content flex gap={6} alignItems="center">
                  <Button.IconButton text={t('settings.pdf background color')} />
                  {setting.pdf.customRenderBackground && (
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        background: setting.pdf.customRenderBackground,
                        borderRadius: 4
                      }}
                    ></div>
                  )}
                </Content>
              </AnimatePopover>
              <AnimatePopover
                padding={10}
                parentElement={containerRef.current}
                content={
                  <ChromePicker
                    disableAlpha
                    color={setting.pdf.customRenderFont}
                    onChange={v => {
                      setSetting(s =>
                        produce(s, g => {
                          g.pdf.customRenderFont = v.hex
                        })
                      )
                    }}
                  />
                }
              >
                <Content flex gap={6} alignItems="center">
                  <Button.IconButton text={t('settings.pdf font color')} />
                  {setting.pdf.customRenderFont && (
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        background: setting.pdf.customRenderFont,
                        borderRadius: 4
                      }}
                    ></div>
                  )}
                </Content>
              </AnimatePopover>
            </Content>
          )
        }
      : undefined
  ].filter(i => i)

  const webpageSettingItems: ISettingItem[] = [
    {
      title: t('settings.enable search auto suggestion'),
      children: (
        <Switch
          value={setting.webpage.enableSearchAutoSuggestion}
          onChange={() => toggleSetting('webpage', 'enableSearchAutoSuggestion')}
        />
      )
    }
  ]

  const videoSettingItems: ISettingItem[] = [
    {
      title: t('settings.jump back when making label'),
      children: (
        <NumberInput
          min={0}
          max={20}
          defaultValue={setting.video.goBackWhenMakingLabel || 0}
          onChange={v => {
            setSetting(
              produce(setting, draft => {
                draft.video.goBackWhenMakingLabel = v as number
              })
            )
          }}
        />
      )
    }
  ]
  return (
    <>
      <SettingGroup title={t('settings.whiteboard settings')} layout={whiteboardSettingItems} />
      <SettingGroup title={t('settings.editor settings')} layout={editorSettingItems} />
      <SettingGroup title={t('settings.translate settings')} layout={translateSettingItems} />
      <SettingGroup title={t('settings.webpage settings')} layout={webpageSettingItems} />
      <SettingGroup title={t('settings.pdf settings')} layout={pdfSettingItems} />
      <SettingGroup title={t('settings.video settings')} layout={videoSettingItems} />
    </>
  )
}

export default ComponentSetting
