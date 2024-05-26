import { loadFromBlob } from '@excalidraw/excalidraw'

const transformUrlToData = async (excalidrawFileUrl: string) => {
  try {
    const data = await fetch(excalidrawFileUrl)
    const blob = await data.blob()
    const state = await loadFromBlob(blob, null, null)
    return state
  } catch (e) {
    console.error(e)
  }
}

export default transformUrlToData
