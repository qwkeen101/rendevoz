import { Content, Icon, Toolbar, VirtualList } from '@/components'
import _ from 'lodash'
import { FC, useMemo } from 'react'
import { ClassName } from 'rendevoz'

interface IconPickerProps {
  icons: string[]
  rowSize?: number
  onIconPick?: (icon: string) => void
}
const IconPicker: FC<IconPickerProps> = ({ icons, onIconPick, rowSize = 10 }) => {
  const chunked = useMemo(() => {
    return _.chunk(icons, rowSize)
  }, [])
  return (
    <Content style={{ padding: 4 }} flex column fullHeight fullWidth>
      <VirtualList
        style={{
          width: '100%',
          height: '100%'
        }}
        estimateSize={32}
        items={chunked}
        getKey={i => i[0]}
        renderItem={i => (
          <Content flex>
            {i.map(ii => (
              <Icon className={ClassName.flatButton(4, '4px')} size={24} onClick={() => onIconPick?.(ii)} name={ii}></Icon>
            ))}
          </Content>
        )}
      />
    </Content>
  )
}
export default IconPicker
