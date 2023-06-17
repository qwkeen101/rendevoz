import { Content } from '@/components'
import TabTitle from '@/components/layout/TabTitle'
import ImageDisplayer from '@/core/image/ImageDisplayer'
import { Rendevoz } from '@/core/rendevoz'
import { MetaStore } from '@/stores'

const ImagePage = ({ imageId }: { imageId: number }) => {
  const imageMeta = MetaStore.getMetaObjectByObjectId(imageId)

  return (
    <Content fullWidth fullHeight>
      <TabTitle title={imageMeta?.name || 'Unnamed Image'} icon={Rendevoz.Utils.Object.getMetaObjectIcon('image')} />
      <ImageDisplayer imageId={imageId} />
    </Content>
  )
}

export default ImagePage
