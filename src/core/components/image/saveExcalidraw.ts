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
  const id = url ? url.replace('rendefile:///files/excalidraw_data_', '') : Id.getStrId()
  return await FileSystem.fs.writeFile(blob, `/files/excalidraw_data_${id}`)
}

export default saveExcalidraw
