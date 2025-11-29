import TabTitle from '@/components/layout/TabTitle'
import ImageDisplayer from '@/core/components/image/ImageDisplayer'
import { MetaStore } from '@/api/stores'

const ImagePage = ({ imageId }: { imageId: number }) => {
  const imageMeta = MetaStore.getMetaObjectByObjectId(imageId)
  const icon = imageMeta?.coverImgSrc ? (
    <img src={imageMeta.coverImgSrc} className={'w-6 h-6 object-cover rounded'} />
  ) : (
    Global.utils.getIcon('image')
  )
  return (
    <div className={'flex items-center justify-center w-full h-full'}>
      <TabTitle title={imageMeta?.name} icon={icon} />
      <ImageDisplayer id={imageId} />
    </div>
  )
}

export default ImagePage
