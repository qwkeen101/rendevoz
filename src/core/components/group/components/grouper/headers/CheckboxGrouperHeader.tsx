import { ObjectStore } from '@/api/stores'
import { CheckBox, Content } from '@/components'

export default ({ id, checked }: { id: number; checked: boolean }) => {
  const property = ObjectStore('metaProp').useValue(id)
  return (
    <Content flex gap={8} alignItems={'center'}>
      <CheckBox style={{ pointerEvents: 'none' }} checked={checked} />
      {property?.name}
    </Content>
  )
}
