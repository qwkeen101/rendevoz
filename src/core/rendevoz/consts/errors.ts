import { Consts } from '~/typings/rendevoz'
import { t } from 'i18next'
const Errors: (typeof Consts)['Errors'] = {
  NotSupportedFile: () => t('error.Not supported file')
}

export default Errors
