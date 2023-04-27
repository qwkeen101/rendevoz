import { Content, Icon } from '@/components'
import { ObjectStore } from '@/stores'
import ImageCanvas from './ImageCanvas'
import { useState } from 'react'
import { Provider, atom } from 'jotai'
import CanvasManager from '@/components/base/canvas/CanvasManager'
import ImageToolbar from './ImageToolbar'
import Colors from '@/consts/colors'

export const CanvasManagerAtom = atom<CanvasManager | undefined>(undefined)
const ImageDisplayer = ({ imageId }: { imageId: number }) => {
  const image = ObjectStore('image').useValue(imageId)
  return (
    <Content fullWidth fullHeight>
      <Provider>
        <div
          style={{
            position: 'absolute',
            top: 30,
            right: 30,
            zIndex: 10,
            padding: '4px 12px',
            borderRadius: 999,
            background: Colors.Background.Linear
          }}
        >
          <ImageToolbar />
        </div>
        {image?.imageUrl && <ImageCanvas imageUrl={image.imageUrl} />}
      </Provider>
    </Content>
  )
}

export default ImageDisplayer
