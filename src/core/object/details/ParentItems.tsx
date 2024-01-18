import { MetaStore } from '@/api/stores'
import { Content, Icon, AnimatePopover, WithBorder } from '@/components'
import { useTranslation } from 'react-i18next'
import { Rendevoz } from '@/core/rendevoz'
import { ClassName } from 'rendevoz'
import { ObjectActionPopover } from '@/core'

export default ({ metaId }: { metaId: number }) => {
  const parentItems = MetaStore.useIndexedMetaObjects()?.metaAttachmentIdToMetaIdsMap.get(metaId)
  const { t } = useTranslation()
  const parentMetas = MetaStore.useMultipleObjects(Array.from(parentItems?.values() || []))
  if (parentMetas.length) {
    return (
      <>
        <Content
          flex
          alignItems={'center'}
          gap={12}
          style={{
            fontWeight: 500,
            fontSize: 14,
            margin: '16px 0 12px'
          }}
        >
          <Icon
            name={'park-adjacent-item'}
            size={16}
            containerStyle={{
              background: 'linear-gradient(rgb(243 204 74) 0%, rgb(251 93 90) 140%)',
              color: 'white',
              borderRadius: 6,
              padding: 4
            }}
          />
          {t('general.Parent items')}
        </Content>
        <Content
          style={{
            cursor: 'pointer',
            border: '1px solid var(--border-background)',
            borderRadius: 8,
            padding: '8px',
            width: '100%',
            fontSize: 13
          }}
        >
          {parentMetas.map(i => (
            <Content gap={8} flex alignItems={'center'} key={i.id}>
              <AnimatePopover
                withClickCover
                content={setV => (
                  <WithBorder>
                    <ObjectActionPopover onClose={() => setV(false)} metaObjectId={i.id} />
                  </WithBorder>
                )}
              >
                <div className={'ellipsis-font-1 hover-link'}>{i.name || i.placeholderName}</div>
              </AnimatePopover>
              <div style={{ fontSize: 12 }} className={ClassName.objectTag}>
                {Rendevoz.Utils.Meta.getTypeName(i.type)}
              </div>
              {i.attachments?.length ? (
                <div style={{ fontSize: 12 }} className={ClassName.objectTag}>
                  {i.attachments.length} {t('general.att')}
                </div>
              ) : null}
            </Content>
          ))}
        </Content>
      </>
    )
  }
  return null
}
