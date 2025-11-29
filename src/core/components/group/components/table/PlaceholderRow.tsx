import { Content, Icon } from '@/components'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'
import { useTranslation } from 'react-i18next'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'

const PlaceholderRow = ({ grouperId }: { grouperId?: number }) => {
  const { t } = useTranslation()
  const instance = useGroupInstance()
  return (
    <Content
      flex
      gap={6}
      onClick={() => {
        instance.metaOps?.createMeta(grouperId)
      }}
      className={ClassName.flatButton(0)}
      style={{
        height: 32,
        paddingLeft: 12,
        color: Colors.Font.Transparent,
        alignItems: 'center'
      }}
    >
      <Icon name={'park-plus'} />
      {t('general.New')}
    </Content>
  )
}

export default PlaceholderRow
