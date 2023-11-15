import Id from '@/utils/id'
import { MIME_TYPES, serializeAsJSON } from '@excalidraw/excalidraw'
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types'
import FileSystem from '@/api/fileSystem'

const saveExcalidraw = async (api: ExcalidrawImperativeAPI, url?: string) => {
  // delete the initial file, because we don't need it
  const files = api.getFiles()
  delete files['initial_image']
  const serializedJsonData = serializeAsJSON(api.getSceneElements(), api.getAppState(), files, 'local')
  const blob = new Blob([serializedJsonData], {
    type: MIME_TYPES.excalidraw
  })

  return await FileSystem.fs.writeFile(blob, `/files/excalidraw_data_${url ?? Id.getStrId()}`)
}

export default saveExcalidraw
