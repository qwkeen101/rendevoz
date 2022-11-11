import { Content } from '@/components/base'
import Select from '@/components/base/select'
import Switch from '@/components/base/Switch'
import { useSetting } from '@/hooks'
import produce from 'immer'
import { ReactNode } from 'react'
import { useLocalStorage } from 'react-use'
import SettingItem from './Item'

const EditorSetting = () => {
  const [setting, setSetting] = useSetting()
  const editor: { title: string; description: string; children: ReactNode }[] = [
    {
      title: 'Toolbar position',
      description: 'Change toolbar position',
      children: (
        <Select
          closeOnSelect
          deselectable={false}
          style={{ width: 200 }}
          menuStyle={{ width: 200 }}
          onSelect={v =>
            setSetting(
              produce(setting, draft => {
                draft.editor.toolbarPosition = v[0]
              })
            )
          }
          defaultValue={setting.editor.toolbarPosition}
        >
          <Select.Option value="top">Top</Select.Option>
          <Select.Option value="bottom">Bottom</Select.Option>
          <Select.Option value="float">Float</Select.Option>
        </Select>
      )
    },
    {
      title: 'Unsaved notes reminder',
      description: 'Toggle unsaved notes reminder when leaving editor page',
      children: (
        <Switch
          defaultValue={setting.editor.confirmExit}
          onChange={v =>
            setSetting(
              produce(setting, draft => {
                draft.editor.confirmExit = v
              })
            )
          }
        />
      )
    }
  ]
  return (
    <Content flex column>
      {editor.map(i => (
        <SettingItem {...i} />
      ))}
    </Content>
  )
}

export default EditorSetting
