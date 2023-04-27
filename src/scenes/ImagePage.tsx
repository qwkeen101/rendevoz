import { Container, Content } from '@/components'
import TabTitle from '@/components/layout/TabTitle'
import { getIcon } from '@/components/layout/sidebar/items/SidebarObjectItem'
import ImageDisplayer from '@/core/image/ImageDisplayer'
import { MetaStore, ObjectStore } from '@/stores'
import createPanZoom from 'panzoom'
import { useEffect, useRef } from 'react'

const ImagePage = ({ imageId }: { imageId: number }) => {
  const image = ObjectStore('image').useValue(imageId)
  const imageMeta = MetaStore.getMetaObjectByObjectId(imageId)

  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const img = imgRef.current
    if (img) {
      const pz = createPanZoom(img)
      return () => {
        pz.dispose()
      }
    }
  }, [image?.imageUrl])
  return (
    <Content fullWidth fullHeight>
      <TabTitle title={imageMeta?.name || 'Unnamed Image'} icon={getIcon('image')} />
      <ImageDisplayer imageId={imageId} />
    </Content>
  )
}

export default ImagePage
