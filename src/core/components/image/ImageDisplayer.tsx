import { ObjectStore } from '@/api/stores'
import { useEffect, useRef } from 'react'
import createPanZoom from 'panzoom'

const ImageDisplayer = ({ id }: { id?: number }) => {
  const image = ObjectStore('image').useValue(id)
  const imgRef = useRef<HTMLImageElement>(null)
  useEffect(() => {
    const img = imgRef.current
    if (img) {
      const panzoom = createPanZoom(img)
      return () => {
        panzoom.dispose()
      }
    }
  }, [])
  return (
    <img
      style={{
        maxHeight: '80%',
        maxWidth: '80%'
      }}
      ref={imgRef}
      className={'rounded-lg'}
      src={image?.url}
    />
  )
}

export default ImageDisplayer
