import { WithBorder } from '@/components'
import { ObjectStore } from '@/api/stores'

export default ({ id }: { id: number }) => {
  const feed = ObjectStore('feed').useValue(id)
  return <WithBorder></WithBorder>
}
