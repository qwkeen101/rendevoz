import { Content, Footer, Icon } from '@/components'
import MetaTagPicker from '@/core/object/MetaTagPicker'
import { MetaStore } from '@/api/stores'
import { ClassName } from 'rendevoz'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import updateMovetoCache from '@/components/form/quickAdd/updateMovetoCache'

export default ({ metaId, onBack }: { metaId: number[]; onBack: VoidFunction }) => {
  const obj = MetaStore.useMultipleObjects(metaId)
  const tags = useMemo(() => {
    const set = new Set<number>()
    obj.forEach(i => {
      i.tags?.forEach(t => {
        set.add(t)
      })
    })
    return Array.from(set.values())
  }, [obj])
  const { t } = useTranslation()
  return (
    <Content
      style={{
        padding: 8,
        minWidth: 'min(400px, 90vw)',
        maxWidth: 'min(660px, 90vw)',
        minHeight: 'min(360px, 90vh)',
        maxHeight: '80vh'
      }}
    >
      <Content flex gap={12} alignItems={'center'} className={ClassName.title()} style={{ paddingLeft: onBack ? 0 : 6 }}>
        {onBack && <Icon name={'park-left'} className={ClassName.circleButton()} onClick={onBack} />}
        {t('general.Select tags')}
      </Content>
      <MetaTagPicker
        alreadyTags={tags || []}
        onChange={v => {
          const newTags = v.filter(i => !tags.includes(i))
          if (newTags.length) {
            const id = newTags[0]
            updateMovetoCache(s => {
              s.recently = s.recently ? [{ type: 'tag', id }, ...s.recently.filter(i => i.id !== id)] : [{ type: 'tag', id }]
            })
          }
          metaId.forEach(id => {
            MetaStore.updateMetaObject({ id, tags: v })
          })
        }}
      />
    </Content>
  )
}
