import { Content } from '@/components/base'
import Select from '@/components/base/select'
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
