import { useState } from 'react'
import { Icon } from '@/components'
import useGraph from '@/core/components/graph/hooks/useGraph'

export default () => {
  const [state, setState] = useState<{
    start?: number
    end?: number
    active?: boolean
  }>({
    active: false
  })
  const graph = useGraph()
  const renderLinePicker = () => {
    return (
      <div className={'bg-popover p-3 rounded-lg'}>
        <div>添加关联</div>
        <div>选择初实际饿点</div>
      </div>
    )
  }
  const renderIcon = () => {
    return <Icon name={'park-arrow-right-up'} className={'square-button z-[10]'} />
  }
  return {
    renderIcon
  }
}
