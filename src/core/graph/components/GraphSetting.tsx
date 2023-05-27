import { Content } from '@/components'
import useGraphMode from '../hooks/useGraphMode'
import Select from '@/components/base/select'

const GraphSetting = () => {
  const [graphMode, setGraphMode] = useGraphMode()
  return (
    <Content column flex gap={10} style={{ padding: 12 }}>
      <Content flex gap={20} justifyContent="space-between" alignItems="center">
        <div>Graph Mode</div>
        <Select
          onSelect={v => {
            setGraphMode(v[0])
          }}
          value={graphMode}
          options={[
            {
              value: 'simple',
              children: 'Simple'
            },
            {
              value: 'normal',
              children: 'normal'
            }
          ]}
        />
      </Content>
    </Content>
  )
}

export default GraphSetting
