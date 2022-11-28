import { ipcInstance, IpcResponse } from '@/plugins'

export const saveImageLocally = (imgName: string, imgData: string | Blob): Promise<IpcResponse<any>> => {
  let data = imgData

  if (imgData instanceof Blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(imgData)
      reader.onload = () => {
        data = reader.result as string
        ipcInstance.send('saveImage', imgName, data).then(data => resolve(data))
      }
      reader.onerror = () => {
        reject()
      }
    })
  }
  return ipcInstance.send('saveImage', imgName, data)
}
