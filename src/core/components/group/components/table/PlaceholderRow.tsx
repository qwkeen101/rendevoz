import { AnimatePopover, Content, Icon, WithBorder } from '@/components'
import { ClassName } from 'rendevoz'
import NewRowMenu from '@/core/components/group/components/menu/NewRowMenu'
import { Colors } from '@/consts'
import { useTranslation } from 'react-i18next'

const PlaceholderRow = () => {
  const { t } = useTranslation()
  return (
    <AnimatePopover
      positions={['top']}
      align={'start'}
      padding={10}
      content={setV => (
        <WithBorder padding={6}>
          <NewRowMenu
            onClose={() => {
              setV(false)
            }}
            direction={'below'}
          />
        </WithBorder>
      )}
    >
      <Content
        flex
        gap={6}
        className={ClassName.flatButton(0)}
        style={{
          height: 32,
          paddingLeft: 12,
          alignItems: 'center',
          borderBottom: `1px solid ${Colors.Background.Border}`
        }}
      >
        <Icon name={'park-plus'} />
        {t('general.New')}
      </Content>
    </AnimatePopover>
  )
}

export default PlaceholderRow
