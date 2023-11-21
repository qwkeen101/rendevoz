import { Content, Footer, Icon } from '@/components'
import MetaTagPicker from '@/core/object/MetaTagPicker'
import { MetaStore } from '@/api/stores'
import { ClassName } from 'rendevoz'
import { useTranslation } from 'react-i18next'

export default ({ metaId, onBack }: { metaId: number; onBack: VoidFunction }) => {
  const obj = MetaStore.useValue(metaId)
  const { t } = useTranslation()
  return (
    <Content
      style={{
        padding: 8,
        minWidth: 'min(400px, 90vw)',
        maxWidth: 'min(660px, 90vw)',
        minHeight: 'min(420px, 90vh)',
        maxHeight: '80vh'
      }}
    >
      <Content flex gap={12} alignItems={'center'} className={ClassName.title()}>
        <Icon name={'park-left'} className={ClassName.circleButton()} onClick={onBack} />
        {t('general.Select tags')}
      </Content>
      <MetaTagPicker alreadyTags={obj?.tags || []} onChange={v => MetaStore.updateMetaObject({ id: metaId, tags: v }, true)} />
    </Content>
  )
}
