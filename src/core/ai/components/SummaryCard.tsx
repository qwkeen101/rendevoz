import { Content } from '@/components'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

export default memo(({ summary, onChange }: { summary: string; onChange?: (v: string) => void }) => {
  const { t } = useTranslation()
  return (
    <Content style={{ marginBottom: 28, fontSize: 14, padding: '12px 12px 0px 12px' }}>
      <div
        style={{
          fontSize: 13,
          color: Colors.Font.Transparent,
          marginBottom: 4
        }}
      >
        {t('general.Summary')}
      </div>
      <div>{summary}</div>
    </Content>
  )
})
