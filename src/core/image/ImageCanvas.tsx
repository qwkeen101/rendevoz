import { Canvas } from '@/components'
import { useToggle } from '@/hooks'
import { useEffect } from 'react'

const ImageCanvas = ({ erase, imageUrl }: { erase: boolean; imageUrl: string }) => {
  const [showCanvas, toggleShowCanvas] = useToggle(false)
  useEffect(() => {
    // for get right bounding
    setTimeout(() => toggleShowCanvas(true), 10)
  }, [])
  if (showCanvas) {
    return <Canvas width="100%" height="100%" imageUrl={imageUrl} erase={erase}></Canvas>
  }
}

export default ImageCanvas
