import { useGroupInstance, useGroupState } from '@/core/components/group/hooks'

export default () => {
  const instance = useGroupInstance()
  const [groupState, setGroupState] = useGroupState()
  const data = groupState.data
  return (
    <div
      className={''}
      style={{
        flex: '1 1 0'
      }}
    >
    </div>
  )
}
