import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import { Rendevoz } from '@/core/rendevoz'
import { ObjectStore } from '@/api/stores'
import toast from 'react-hot-toast'
import { getSetting } from '@/core'
import fileSystem from '@/api/fileSystem'
import { IWhiteboardInstance } from '~/typings'
import { mousePos } from '@/hooks/utils/useMousePositionRef'

export default async (e: KeyboardEvent, instance: IWhiteboardInstance) => {
  const clipboardItems = await navigator.clipboard.read()
  for (const i of clipboardItems) {
    const imageType = i.types.find(i => i.startsWith('image/'))
    console.log(i, imageType)
    if (imageType) {
      const blob = await i.getType(imageType)
      const setting = getSetting()
      const img = await fileSystem.saveImage(blob)
      console.log(img)
      if (setting.whiteboard.dropFileAutoObject) {
        try {
          const result = await ObjectStore('image')
            .addOneWithMeta(
              {
                url: img
              },
              {
                currentMeta: {
                  coverImgSrc: img
                }
              }
            )
            .then(i => i.meta)
          const pos = mousePos.current
          instance.insertMetasAtPointer?.({ clientY: pos[1], clientX: pos[0] }, [result.id])
          return
        } catch (e) {
          toast.error(Rendevoz.Consts.Errors.NotSupportedFile())
          console.error(e)
        }
      } else {
        const transformed = instance.coordOps?.transformWindowPositionToPosition({
          x: mousePos.current[0],
          y: mousePos.current[1]
        })
        if (transformed) {
          instance.insertNode?.({
            type: 'image',
            imageUrl: img,
            x: transformed.x,
            y: transformed.y
          })
        }
      }
      break
    }
  }
}
