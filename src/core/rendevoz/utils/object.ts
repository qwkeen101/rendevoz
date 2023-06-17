import { MetaObject } from "~/typings";

export const getMetaObjectIcon = (type?: MetaObject['type'], metaObject?: MetaObject) => {
  if (metaObject?.icon) {
    return metaObject.icon
  }
  if (metaObject?.from?.icon) {
    return metaObject.from.icon
  }
  switch (type) {
    case 'note':
      return 'park-notes'
    case 'pdf':
      return 'park-file-pdf'
    case 'webpage':
      return 'park-web-page'
    case 'video':
      return 'park-play-two'
    case 'webpageLabel':
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
    default:
      return 'park-file-question'
  }
}

const Object = {
  getMetaObjectIcon
}

export default Object
