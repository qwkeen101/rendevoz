import { Descendant } from 'slate'
import normalizeElementToText from '@/core/components/editor/utils/normalize/normalizeElementToText'

export default (value: Descendant[]) => {
  return value.map(normalizeElementToText).join(' ')
}
