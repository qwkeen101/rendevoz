import KeyvalueStore, { IFocusSettings } from '@/api/stores/keyvalue.store'
import { mergeWith } from 'lodash'
import { useMemo } from 'react'

export default () => {
  const value = KeyvalueStore.useValue('focusSettings')
  const merged = useMemo(
    () =>
      mergeWith(
        {
          controlbarCollapsed: false,
          targetTranslate: 'zh-CN',
          layout: 'theater',
          subtitleMode: 'both'
        } as IFocusSettings,
        value
      ),
    [value]
  )
  return [
    merged,
    (updater: (v: IFocusSettings) => IFocusSettings) => {
      KeyvalueStore.updateOne('focusSettings', { ...updater(merged) })
    }
  ] as [Required<IFocusSettings>, (updater: (v: IFocusSettings) => IFocusSettings) => void]
}
