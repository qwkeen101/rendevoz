import { SelectProps } from '@/components/base/select/Select'
import Select from '@/components/base/select'
import { Content, Icon } from '@/components'
import { Colors } from '@/consts'

export default (
  props: SelectProps & {
    name: string
  }
) => {
  return (
    <Select
      {...props}
      style={{
        width: '100%',
        maxWidth: '100%',
        height: 'auto',
        ...props.style
      }}
      closeOnSelect={true}
      displayRenderer={(value, children) => (
        <Content fullWidth flex style={{ fontSize: 14 }} justifyContent={'space-between'} alignItems={'center'}>
          <div>{props.name}</div>
          <Content flex gap={4} style={{ color: Colors.Font.Transparent, fontSize: 13 }}>
            {children}
            <Icon name={'park-down'} />
          </Content>
        </Content>
      )}
    />
  )
}
