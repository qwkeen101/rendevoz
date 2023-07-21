import { findPathsBetweenTwoMetaObjects } from '@/core/graph/utils/findPathsBetweenTwoNodes'
import { t } from 'i18next'
import { TypeToTypeName } from '@/core'

const Meta = {
  findPathsBetweenTwoMetaObjects,
  getTypeName: (type: string) => {
    return t(`general.${TypeToTypeName[type]}`)
  }
}

export default Meta
