import { AnimatePopover, Content, WithBorder } from '@/components/base'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { DefaultEditorSettings } from '@/api/lifycycle/initializeApp/initializeSettings'
import { useTranslation } from 'react-i18next'
import { ClassName } from 'rendevoz'
import { ButtonChooser, Icon, Switch } from '@/components'
import { useEffect, useRef } from 'react'
import { useUpdate } from 'react-use'
import { ISettingItem } from '@/core/setting/SettingItem'
import SettingGroup from '@/core/setting/SettingGroup'
import { GlobalSetting } from '@/core'
import produce from 'immer'
import _ from 'lodash'
const allBuiltInTypefaces = ['Merriweather', 'Inter', 'Roboto', 'Source Serif', 'Open Sans', 'Muli', 'Lato']
const fontSizes = _.range(12, 31, 1).map(i => `${i.toString()}px`)
const lineSpacings = _.range(1.2, 2.5, 0.1).map(i => i.toFixed(1))
const editorPageWidth = ['X-Small', 'Small', 'Medium', 'Large', 'X-Large']
const EditorSetting = () => {
  const { t } = useTranslation()
  const editorSetting = KeyvalueStore.useValue('editorSettings') || DefaultEditorSettings
  const parentRef = useRef<HTMLElement>(null)
  const [setting, setSetting] = GlobalSetting.useSetting()
  const update = useUpdate()
  useEffect(() => {
    update()
  }, [])

  const renderOptions = (opts: (typeof DefaultEditorSettings)['editMode'], onChange: (opts: any) => void): ISettingItem[] => {
    return [
      {
        title: t('general.Typeface'),
        children: (
          <AnimatePopover
            positions={['bottom']}
            parentElement={parentRef.current}
            content={setVisible => (
              <WithBorder padding={6} width={180}>
                <Content flex column>
                  {allBuiltInTypefaces.map((i, idx) => (
                    <Content
                      onClick={() => {
                        onChange({
                          ...opts,
                          typeface: i
                        })
                        setVisible(false)
                      }}
                      className={ClassName.flatButton(0, '4px 8px')}
                      key={i}
                      flex
                      alignItems={'center'}
                      style={{
                        fontFamily: i
                      }}
                    >
                      {i}
                      {i === opts.typeface && <Icon name={'park-check'} containerStyle={{ marginLeft: 'auto' }} />}
                    </Content>
                  ))}
                </Content>
              </WithBorder>
            )}
          >
            <div className={ClassName.flatButton()}>{opts.typeface}</div>
          </AnimatePopover>
        )
      },
      {
        title: t('general.Font size'),
        children: (
          <ButtonChooser
            onChange={v => {
              onChange({
                ...opts,
                fontSize: parseInt(v)
              })
            }}
            value={`${opts.fontSize || 15}px`}
            options={fontSizes}
          />
        )
      },
      {
        title: t('general.Line spacing'),
        children: (
          <ButtonChooser
            onChange={v => {
              onChange({
                ...opts,
                lineSpacing: Number(parseFloat(v).toFixed(1))
              })
            }}
            value={`${(opts.lineSpacing || 1.2).toFixed(1)}`}
            options={lineSpacings}
          />
        )
      },
      {
        title: t('general.Page width'),
        children: (
          <ButtonChooser
            onChange={v => {
              onChange({
                ...opts,
                pageWidth: v
              })
            }}
            value={opts.pageWidth}
            options={editorPageWidth}
          />
        )
      }
    ]
  }
  return (
    <Content
      flex
      column
      ref={parentRef}
      gap={36}
      style={{ padding: '18px', marginTop: -18, borderRadius: 8 }}
      className={'border-box-shadow'}
    >
      <SettingGroup
        title={t('general.Reader mode')}
        layout={[
          ...renderOptions(editorSetting.readerMode, o =>
            KeyvalueStore.updateOne('editorSettings', {
              ...editorSetting,
              readerMode: o
            })
          ),
          {
            title: t('settings.Add paragraph spacing'),
            children: (
              <Switch
                value={setting.editor.addSpacingInReaderMode}
                onChange={v => {
                  setSetting(
                    produce(setting, draft => {
                      draft.editor.addSpacingInReaderMode = v
                    })
                  )
                }}
              />
            )
          }
        ]}
      />
      <SettingGroup
        title={t('general.Edit mode')}
        layout={renderOptions(editorSetting.editMode, o =>
          KeyvalueStore.updateOne('editorSettings', {
            ...editorSetting,
            editMode: o
          })
        )}
      />
    </Content>
  )
}

export default EditorSetting
