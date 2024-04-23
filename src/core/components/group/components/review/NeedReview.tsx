import { useEffect, useState } from 'react'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { Rendevoz } from '@/core/rendevoz'
import { MetaStore, ObjectStore } from '@/api/stores'
import { Content, Icon } from '@/components'
import { ClassName } from 'rendevoz'
import { GlobalInstance } from '@/hooks'
import { useTranslation } from 'react-i18next'

export default ({ inDues, list = false, onChange }: { inDues: number[]; list: boolean; onChange: (metaId: number) => void }) => {
  const [dueCards, setDueCards] = useState<
    {
      name: string
      icon: string
      id: number
    }[]
  >([])
  const { t } = useTranslation()
  useEffect(() => {
    setDueCards(
      inDues
        .map(i => {
          const m = MetaStore.getCachedMetaObject(i)
          if (m) {
            return {
              id: m.id,
              name: m.name || m.placeholderName || 'Unnamed object',
              icon: Rendevoz.Utils.Object.getMetaObjectIcon(m.type)
            }
          }
        })
        .filter(i => i) as typeof dueCards
    )
  }, [inDues.length])

  if (!inDues.length) return null
  return (
    <Content
      flex
      column
      style={{
        marginTop: list ? undefined : 18,
        maxWidth: list ? '320px' : 'min(90vw, 600px)'
      }}
    >
      <div style={list ? { fontSize: 13, color: 'var(--font-transparent)', marginLeft: 8 } : { fontSize: 18, fontWeight: 600 }}>
        {t('general.Card list')}
      </div>
      <Content
        flex
        column
        style={{
          maxHeight: '50vh',
          overflowY: 'auto',
          margin: !list ? '6px -8px 0px' : undefined
        }}
      >
        {dueCards.map(i => (
          <Content
            className={ClassName.flatButton()}
            onClick={() => {
              onChange(i.id)
            }}
            flex
            gap={8}
            key={i.id}
          >
            <Icon name={i.icon} />
            <div className={'ellipsis-font-1'}>{i.name}</div>
          </Content>
        ))}
      </Content>
    </Content>
  )
}
