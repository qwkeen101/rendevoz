import ButtonSwitch from '@/components/base/ButtonSwitch'
import { useGroupInstance, useGroupState } from '@/core/components/group/hooks'
import { useTranslation } from 'react-i18next'

export default () => {
  const instance = useGroupInstance()
  const { t } = useTranslation()
  const [groupState] = useGroupState()
  return (
    <div style={{ padding: '0 0.25rem 0.4rem' }}>
      <ButtonSwitch
        onChange={v => {
          instance.updateGroupData?.(s => ({
            ...s,
            enableReview: v
          }))
        }}
        name={t('general.Enable flashcards')}
        value={!!groupState.data?.enableReview}
      ></ButtonSwitch>
    </div>
  )
}
