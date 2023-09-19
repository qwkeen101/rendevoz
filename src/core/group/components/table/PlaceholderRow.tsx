import { AnimatePopover, Content, Icon, WithBorder } from '@/components'
import { useGroupInstance } from '@/core/group/hooks/useGroupInstance'

const PlaceholderRow = () => {
  const instance = useGroupInstance()
  return (
    <AnimatePopover
      positions={['top']}
      content={
        <WithBorder>
          <div
            onClick={() => {
              instance.valueOps?.insertValueByPath({
                type: 'text',
                textContent: ''
              })
            }}
          >
            新建文本行
          </div>
          <div>新建分类</div>
          <div>新建组</div>
          <div>新建子组</div>
        </WithBorder>
      }
    >
      <Content flex gap={6}>
        <Icon name={'park-plus'} />
        Add
      </Content>
    </AnimatePopover>
  )
}

export default PlaceholderRow
