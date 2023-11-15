import { toPng } from 'html-to-image'
import { MetaStore } from '@/api/stores'
import { deleteLocalFile, saveImageLocally } from '@/utils'
import { RefObject } from 'react'
import { useDebounceEffect } from '@/hooks'

const useCapturePreviewImage = () => {
  const captureImage = async (
    metaId?: number,
    container?: HTMLElement,
    options?: {
      width?: number
      height?: number
      backgroundColor?: string
    }
  ) => {
    if (!metaId || !container) return
    const currentMeta = await MetaStore.getMetaObjectById(metaId)
    if (!currentMeta) return
    const prevPreview = currentMeta.coverImgSrc
    if (prevPreview) {
      deleteLocalFile(prevPreview)
    }
    const res = await toPng(container, {
      cacheBust: true,
      ...options
    })
    console.log(res)
    const path = await saveImageLocally(res)
    await MetaStore.updateMetaObject({ id: metaId, coverImgSrc: path }, true)
  }

  const updatePreview = async (dataURL: string) => {
    // if (!metaId) return
    // const currentMeta = await MetaStore.getMetaObjectById(metaId)
    // if (!currentMeta) return
    // const prevPreview = currentMeta.coverImgSrc
    // if (prevPreview) {
    //   await deleteLocalFile(prevPreview)
    // }
    // const path = await saveImageLocally(dataURL)
    // await MetaStore.updateMetaObject({ id: metaId, coverImgSrc: path }, true)
  }
  return {
    captureImage,
    updatePreview
  }
}

export default useCapturePreviewImage
