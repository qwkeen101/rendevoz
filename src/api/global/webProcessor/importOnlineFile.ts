import getFileDetailsFromURL from '@/api/global/webProcessor/getFileDetailsFromURL'
import { IImportResult, importAudio, importImage, importPDF, importVideo } from '@/api/global/fileProcessor'
import { IAudio, IImage, IPdfDocument, IVideo } from '~/typings'

export default async (url: string): Promise<IImportResult<IPdfDocument | IVideo | IAudio | IImage>> => {
  const fileDetails = await getFileDetailsFromURL(url)
  if (fileDetails) {
    const file = new File(
      [await fetch(url).then(i => i.blob())],
      fileDetails.name ? [fileDetails.name, fileDetails.extension].filter(i => i).join('.') : url
    )
    if (fileDetails.type === 'pdf') {
      return await importPDF(file)
    }
    if (fileDetails.type === 'image') {
      return await importImage(file)
    }
    if (fileDetails.type === 'video') {
      return await importVideo(file)
    }
    if (fileDetails.type === 'audio') {
      return await importAudio(file)
    }
  }
  return Promise.reject()
}
