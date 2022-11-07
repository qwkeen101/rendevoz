import { Content } from '@/components/base'
import Select from '@/components/base/select'
import { ReactNode } from 'react'
import { useLocalStorage } from 'react-use'
import SettingItem from './Item'

const EditorSetting = () => {
  const [toolbar, setToolbar] = useLocalStorage('toolbar', 'top', { raw: true })
  const editor: { title: string; description: string; children: ReactNode }[] = [
    {
      title: 'Toolbar position',
      description: 'Change toolbar position',
      children: (
        <Select closeOnSelect deselectable={false} style={{ width: 200 }} onSelect={v => setToolbar(v[0])} defaultValue={toolbar}>
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
