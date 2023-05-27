import { Container, Content } from '@/components'
import TabTitle from '@/components/layout/TabTitle'
import { getIcon } from '@/components/layout/sidebar/items/SidebarObjectItem'
import ImageDisplayer from '@/core/image/ImageDisplayer'
import { MetaStore } from '@/stores'

const ImagePage = ({ imageId }: { imageId: number }) => {
  const imageMeta = MetaStore.getMetaObjectByObjectId(imageId)

  return (
    <Content fullWidth fullHeight>
      <TabTitle title={imageMeta?.name || 'Unnamed Image'} icon={getIcon('image')} />
      <ImageDisplayer imageId={imageId} />
    </Content>
  )
}

export default ImagePage
