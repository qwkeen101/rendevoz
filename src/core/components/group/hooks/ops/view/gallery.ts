import { IGroupInstance } from '~/typings'
import { assignProperties } from '@/utils'

export default function assignGalleryOps(instance: IGroupInstance) {
  assignProperties(instance, {
    viewOps: {
      ...instance.viewOps,
      galleryOps: {
        editItem: rowId => {
          instance.values.inViewRowFuncs.get(rowId)?.edit?.()
        },
        uneditItem: rowId => {
          instance.values.inViewRowFuncs.get(rowId)?.unedit?.()
        }
      }
    }
  })
}
