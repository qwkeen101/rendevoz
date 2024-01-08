import { Content, Icon } from '@/components'
import QuestionCard from '@/core/ai/components/question/QuestionCard'
import { MetaStore } from '@/api/stores'
import { TabTitle } from '@/core/rendevoz/components'
import { Rendevoz } from '@/core/rendevoz'
import { memo } from 'react'
import MetaPropDisplayer from '@/core/object/renderer/properties/MetaPropDisplayer'
import { useTranslation } from 'react-i18next'
import { useSelectSetting } from '@/core'

export default memo(({ id }: { id: number }) => {
  const q = MetaStore.useObjectToMetaValue(id)
  const { t } = useTranslation()
  const showProps = useSelectSetting(s => s.object.showPropertiesInComponentPage)
  return (
    <Content
      flex
      fullHeight
      fullWidth
      column
      style={{
        overflowY: 'auto',
        padding: 24
      }}
    >
      <TabTitle title={q?.name || 'Unnamed question'} icon={<Icon name={Rendevoz.Utils.Object.getMetaObjectIcon('question')} />} />
      <Content
        style={{
          margin: 'auto',
          minWidth: 'min(600px,90%)',
          maxWidth: '800px'
        }}
      >
        <QuestionCard
          display={{
            from: true
          }}
          pointerEllipsis={0}
          id={id}
        />
        {q && showProps && Object.keys(q.properties || {}).length > 0 && (
          <div style={{ padding: '0px 12px' }}>
            <div
              className={'font-size-13 transparent-font'}
              style={{
                marginBottom: 8
              }}
            >
              {t('general.Properties')}
            </div>
            <MetaPropDisplayer metaId={q.id} />
          </div>
        )}
      </Content>
    </Content>
  )
})
