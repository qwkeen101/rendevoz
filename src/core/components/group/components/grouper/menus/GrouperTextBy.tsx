import { StringGroupRule } from '~/typings/components/group/property-group'
import { Button } from '@/components'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { useTranslation } from 'react-i18next'

export default ({ onBack }: { onBack: VoidFunction }) => {
  const options: StringGroupRule['textBy'][] = ['exact', 'alphabetical']
  const instance = useGroupInstance()
  const { t } = useTranslation()
  return (
    <div style={{ padding: '0px 4px 4px' }}>
      {options.map(o => (
        <Button.IconButton
          onClick={() => {
            instance.updateCurrentView?.(w => ({ ...w, group: { ...w.group, textBy: o } }))
            onBack?.()
          }}
          text={t(`general.${o}`)}
          key={o}
        />
      ))}
    </div>
  )
}
