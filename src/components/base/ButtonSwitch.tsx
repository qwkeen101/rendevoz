import { Content, Switch } from '@/components'
import { ClassName } from 'rendevoz'

export default ({ value, onChange, name }: { value: boolean; onChange: (v: boolean) => void; name: string }) => {
  return (
    <Content
      onClick={() => {
        onChange(!value)
      }}
      flex
      alignItems={'center'}
      justifyContent={'space-between'}
      className={ClassName.flatButton()}
    >
      <div>{name}</div>
      <Switch value={value} onChange={onChange} small={true} />
    </Content>
  )
}
