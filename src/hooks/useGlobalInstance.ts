import { IGlobalInstance } from '~/typings'
import { assignProperties } from '@/utils'
import { toast } from 'react-hot-toast'
import { t } from 'i18next'
const GlobalInstance: Partial<IGlobalInstance> = {}

assignProperties(GlobalInstance, {
  metaOps: {
    copyLink: id => {
      const link = `rendevoz://object/${id}`
      navigator.clipboard.writeText(link)
      toast.success(t('general.link is generated for this object'))
    }
  }
})
export default GlobalInstance
