import { GlobalInstances } from '~/typings'
import { GlobalTranslateInstance } from '../global/translate/GlobalTranslatePanel'

const translate: GlobalInstances.TranslateInstance['translate'] = async opts => {
  GlobalTranslateInstance.translate?.(opts)
}

const State = {
  Translate: {
    translate
  }
}

export default State
