import produce from 'immer'
import { useTranslation } from 'react-i18next'
import { AnimatePopover, Button, Content, Switch } from '../../components/base'
import { ISettingItem } from './SettingItem'
import GlobalSetting from '.'
import Select from '@/components/base/select'
import { ChromePicker } from 'react-color'
import { useEffect, useRef } from 'react'
import { useUpdate } from 'react-use'
import { NumberInput } from '@/components'
import { IComponentSetting } from '@/core/setting/types'
import SettingGroup from '@/core/setting/SettingGroup'
import BlockColorPicker from '@/core/components/editor/components/BlockColorPicker'
import { Colors } from '@/consts'
import { CodeLangs } from '@/core/components/code/CodeHeader'
import EditorSetting from '@/core/setting/Editor'

const ComponentSetting = () => {
  const { t } = useTranslation()
  const [setting, setSetting] = GlobalSetting.useSetting()
  function toggleSetting<K extends keyof IComponentSetting>(key: K, v: keyof IComponentSetting[K]) {
    setSetting(s =>
      produce(s, draft => {
        draft[key][v] = !draft[key][v]
      })
    )
  }
  const webpageSettingItems: ISettingItem[] = [
    {
      title: t('settings.Automatically add head image'),
      children: <Switch value={setting.webpage.autoAddHeadImage} onChange={() => toggleSetting('webpage', 'autoAddHeadImage')} />
    },
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
      title: t('settings.Expand to fixed height'),
      type: 'switch',
      value: !!setting.whiteboard.expandToFixedSize,
      onChange: v => setSetting(s => ({ ...s, whiteboard: { ...s.whiteboard, expandToFixedSize: v } }))
    },
    {
      title: t('settings.drop file auto object'),
      children: <Switch value={!!setting.whiteboard.dropFileAutoObject} onChange={() => toggleSetting('whiteboard', 'dropFileAutoObject')} />
    },
    {
      title: t('settings.Only erase hand draw'),
      children: <Switch value={!!setting.whiteboard.onlyEraseFreeDraw} onChange={() => toggleSetting('whiteboard', 'onlyEraseFreeDraw')} />
    },
    {
      title: t('settings.Scroll behavior in select mode'),
      children: (
        <Select
          onSelect={v => {
            setSetting(s =>
              produce(s, s => {
                s.whiteboard.scrollModeInSelect = v[0]
              })
            )
          }}
          value={setting.whiteboard.scrollModeInSelect}
          options={[
            { value: 'zoom', children: t('settings.Zoom') },
            { value: 'pan', children: t('settings.Pan') }
          ]}
        />
      )
    }
  ]

  const editorSettingItems: (ISettingItem | undefined)[] = [
    {
      type: 'switch',
      title: t('settings.Auto open highlight editor'),
      value: !!setting.editor.autoOpenHighlightEditor,
      onChange: v => setSetting(s => ({ ...s, editor: { ...s.editor, autoOpenHighlightEditor: v } }))
    },
    {
      type: 'switch',
      title: t('settings.Show highlight details'),
      value: !!setting.editor.showHighlightText,
      onChange: v => setSetting(s => ({ ...s, editor: { ...s.editor, showHighlightText: v } }))
    },
    setting.editor.showHighlightText
      ? {
          type: 'switch',
          title: t('settings.Default expand highlight details'),
          value: !!setting.editor.defaultExpandHighlightText,
          onChange: v => setSetting(s => ({ ...s, editor: { ...s.editor, defaultExpandHighlightText: v } }))
        }
      : undefined,
    {
      title: t('settings.object auto become inline when dragged into editor'),
      children: <Switch value={!!setting.editor.objectAutoBecomeInline} onChange={() => toggleSetting('editor', 'objectAutoBecomeInline')} />
    },
    {
      title: t('settings.Custom editor format'),
      type: 'switch',
      value: !!setting.editor.enableFormat,
      onChange: v => setSetting(s => ({ ...s, editor: { ...s.editor, enableFormat: !s.editor.enableFormat } }))
    }
  ].filter(i => i)
  const sidebarItems: ISettingItem[] = [
    {
      type: 'switch',
      value: !!setting.sidebar.previewTitleMode,
      title: t('settings.Preview library content'),
      onChange: v => setSetting(s => ({ ...s, sidebar: { ...s.sidebar, previewTitleMode: !s.sidebar.previewTitleMode } }))
    },
    {
      type: 'switch',
      value: !!setting.sidebar.previewCollectionContent,
      title: t('settings.Preview collection content'),
      onChange: v => setSetting(s => ({ ...s, sidebar: { ...s.sidebar, previewCollectionContent: !s.sidebar.previewCollectionContent } }))
    }
  ]
  const codeSettingItems: ISettingItem[] = [
    {
      title: t('settings.Default programming language'),
      children: (
        <Select
          onSelect={v => {
            setSetting(
              produce(setting, draft => {
                draft.code.defaultLanguage = v[0]
              })
            )
          }}
          value={setting.code?.defaultLanguage}
          menuStyle={{
            textTransform: 'capitalize',
            maxHeight: 300,
            overflowY: 'auto'
          }}
          style={{
            textTransform: 'capitalize'
          }}
          closeOnSelect={true}
          options={CodeLangs.sort().map(i => ({
            value: i,
            children: i
          }))}
        />
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
      type: 'switch',
      title: t('settings.Auto open highlight editor'),
      value: !!setting.pdf.autoOpenHighlightEditor,
      onChange: v => setSetting(s => ({ ...s, pdf: { ...s.pdf, autoOpenHighlightEditor: v } }))
    },
    {
      type: 'switch',
      title: t('settings.Show highlight details'),
      value: !!setting.pdf.showHighlightText,
      onChange: v => setSetting(s => ({ ...s, pdf: { ...s.pdf, showHighlightText: v } }))
    },
    setting.pdf.showHighlightText
      ? {
          type: 'switch',
          title: t('settings.Default expand highlight details'),
          value: !!setting.pdf.defaultExpandHighlightText,
          onChange: v => setSetting(s => ({ ...s, pdf: { ...s.pdf, defaultExpandHighlightText: v } }))
        }
      : undefined,
    {
      title: t('settings.Auto width'),
      type: 'switch',
      value: !!setting.pdf.autoWidth,
      onChange: v => setSetting(s => ({ ...s, pdf: { ...s.pdf, autoWidth: v } }))
    },
    {
      title: t('settings.Default PDF label color'),
      children: (
        <AnimatePopover
          content={setV => (
            <BlockColorPicker
              bgBackDefault={false}
              showBg={true}
              showFont={false}
              onPickBackgroundColor={v => {
                setV(false)
                setSetting(
                  produce(setting, draft => {
                    draft.pdf.defaultLabelColor = v
                  })
                )
              }}
            />
          )}
        >
          <div
            style={{
              width: 24,
              cursor: 'pointer',
              height: 24,
              borderRadius: 3,
              background: Colors.getAdaptColor(setting.pdf.defaultLabelColor)
            }}
          ></div>
        </AnimatePopover>
      )
    },
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

  const videoSettingItems: ISettingItem[] = [
    {
      title: t('settings.Auto open highlight editor'),
      children: (
        <Switch
          value={setting.media.openPopoverWhenHighlight}
          onChange={v => {
            setSetting(
              produce(setting, draft => {
                draft.media.openPopoverWhenHighlight = v
              })
            )
          }}
        />
      )
    },
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
      <SettingGroup title={t('settings.Sidebar settings')} layout={sidebarItems} />
      <SettingGroup title={t('settings.webpage settings')} layout={webpageSettingItems} />
      <SettingGroup title={t('settings.whiteboard settings')} layout={whiteboardSettingItems} />
      <SettingGroup title={t('settings.editor settings')} layout={editorSettingItems} />
      {setting.editor.enableFormat && <EditorSetting />}
      <SettingGroup title={t('settings.code settings')} layout={codeSettingItems} />
      {/*<SettingGroup title={t('settings.translate settings')} layout={translateSettingItems} />*/}
      <SettingGroup title={t('settings.pdf settings')} layout={pdfSettingItems} />
      <SettingGroup title={t('settings.video settings')} layout={videoSettingItems} />
    </>
  )
}

export default ComponentSetting
