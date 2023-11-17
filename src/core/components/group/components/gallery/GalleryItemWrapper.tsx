import { MetaGroupChild } from '~/typings'
import { MetaStore } from '@/api/stores'
import { Content } from '@/components'
import ImageItem from '@/core/components/group/components/gallery/items/ImageItem'

export default ({ value }: { value: MetaGroupChild & { type: 'metaObject' } }) => {
  const meta = MetaStore.useValue(value.id)
  if (!meta) return null
  return (
    <Content>
      <ImageItem value={meta.coverImgSrc} onChange={v => {}} />
      <div>{meta.name}</div>
    </Content>
  )
}
