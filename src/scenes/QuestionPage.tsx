import { Content, Icon, TabTitle } from '@/components'
import QuestionCard from '@/core/ai/components/question/QuestionCard'
import { MetaStore } from '@/api/stores'
import { memo } from 'react'
import MetaPropDisplayer from '@/core/object/renderer/properties/MetaPropDisplayer'
import { useTranslation } from 'react-i18next'
import { GlobalSetting } from '@/core'
import { useGlobalAtomValue } from '@/hooks'

export default memo(({ id }: { id: number }) => {
  const q = MetaStore.useObjectToMetaValue(id)
  const { t } = useTranslation()
  const showProps = useGlobalAtomValue(GlobalSetting.atoms.showPropertiesInComponentPage)
  return (
    <Content flex fullHeight fullWidth column className={'p-3 overflow-y-auto'}>
      <TabTitle title={q?.name} icon={<Icon name={Global.utils.getIcon('question')} />} />
      <Content
        style={{
          margin: 'auto',
          minWidth: 'min(600px,100%)',
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
