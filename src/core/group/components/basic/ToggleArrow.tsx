import { Path } from 'slate'
import { Content, Icon } from '@/components'
import { ClassName } from 'rendevoz'
import { useGroupInstance } from '@/core/group/hooks/useGroupInstance'

const ToggleArrow = ({ path, toggled }: { path: Path; toggled: boolean }) => {
  const instance = useGroupInstance()
  return (
    <Content flex alignItems={'center'}>
      <div className={ClassName.circleButton(3, 4)}>
        <Icon
          onClick={e => {
            e.stopPropagation()
            instance.valueOps?.updateValueByPath({ toggled: !toggled }, path)
          }}
          style={{
            transform: toggled ? undefined : 'rotate(90deg)',
            transition: 'all 0.25s ease'
          }}
          name={'park-right-one'}
          theme={'filled'}
        />
      </div>
    </Content>
  )
}

export default ToggleArrow
