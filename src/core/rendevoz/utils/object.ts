import { TypeToRegisteredMetaObject } from '@/api/stores/meta.store'
import { MetaObject } from '~/typings'

export const getMetaObjectIcon = (type?: MetaObject['type'], metaObject?: MetaObject) => {
  if (metaObject?.icon) {
    return metaObject.icon
  }
  if (metaObject?.from?.icon) {
    return metaObject.from.icon
  }
  if (type) {
    const registered = TypeToRegisteredMetaObject.get(type)
    if (registered?.icon) return registered.icon
  }
  switch (type) {
    case 'note':
      return 'park-notes'
    case 'pdf':
      return 'custom-pdf'
    case 'audio':
      return 'park-music'
    case 'webpage':
      return 'park-web-page'
    case 'video':
      return 'park-play-two'
    case 'webpageLabel':
    case 'audioLabel':
    case 'noteBlock':
    case 'noteLabel':
    case 'pdfLabel':
    case 'videoLabel':
      return 'park-label'
    case 'whiteboard':
      return 'park-new-computer'
    case 'image':
      return 'park-pic'
    case 'localFile':
      return 'park-log'
    case 'group':
      return 'park-form'
    case 'syncedBlock':
      return 'park-transfer-data'
    default:
      return 'park-file-question'
  }
}

const Object = {
  getMetaObjectIcon
}

export default Object
