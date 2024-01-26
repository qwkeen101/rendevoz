import { NumberGroupRule } from '~/typings/components/group/property-group'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { GROUPER_DEFAULT_GROUP_EVERY } from '@/core/components/group/hooks/grouper/calculator/number'

export default memo(({ rule, value }: { rule: NumberGroupRule; value: string }) => {
  const { t } = useTranslation()
  if (value === 'outOfRange') {
    return <div>{t('general.Out of range')}</div>
  }
  const num = Number(value)
  if (!Number.isNaN(num)) {
    const every = rule.groupEvery ?? GROUPER_DEFAULT_GROUP_EVERY
    if (every !== 1 && every !== 0) {
      return (
        <div>
          {num}
          <span style={{ margin: '0px 4px' }}>–</span>
          {num + every}
        </div>
      )
    }
    return <div>{num}</div>
  }
  return null
})
