import { Button, Content } from '@/components'
import { ClassName } from 'rendevoz'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

export default memo(({ onBack }: { onBack: VoidFunction }) => {
  const { t } = useTranslation()
  return (
    <Content flex centered fullHeight>
      <Content
        flex
        column
        alignItems={'center'}
        style={{
          fontSize: 22,
          fontWeight: 'bold',
          padding: '48px'
        }}
        gap={24}
      >
        <div style={{ fontSize: 48 }}>🎉🎉🎉</div>
        {t('general.Congradulations! You have finished studying all cards!')}
        <Button.IconButton
          icon={'park-degree-hat'}
          text={t('general.Study again')}
          onClick={onBack}
          style={{
            fontSize: 15
          }}
          className={ClassName.selectButton()}
        />
      </Content>
    </Content>
  )
})
