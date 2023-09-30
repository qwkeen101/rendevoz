import KeyvalueStore from '@/stores/keyvalue.store'
import { Content, Icon } from '@/components'
import { ClassName } from 'rendevoz'
import FontSize from '@/consts/font'
import { useTranslation } from 'react-i18next'
import { useIsIn } from '@/hooks'

type SearchHistoryProps = {
  onClick: (name: string) => void
}
const SearchHistory = ({ onClick }: SearchHistoryProps) => {
  const { t } = useTranslation()
  const searchHistory = KeyvalueStore.useValue('searchHistory') || []
  if (!searchHistory.length) return null
  return (
    <Content flex column style={{ lineHeight: 1.3, padding: 6 }}>
      <div style={{ fontSize: 12, paddingLeft: 6, marginBottom: 4 }}>{t('general.Search history')}</div>
      {searchHistory.map((i, index) => (
        <HistoryItem
          name={i}
          onClick={() => onClick(i)}
          onDelete={() => {
            searchHistory.splice(index, 1)
            KeyvalueStore.updateOne('searchHistory', [...searchHistory])
          }}
        />
      ))}
    </Content>
  )
}

const HistoryItem = ({ name, onDelete, onClick }: { name: string; onDelete: VoidFunction; onClick: VoidFunction }) => {
  const { isIn, ref } = useIsIn()
  return (
    <Content
      flex
      onClick={() => {
        onClick()
      }}
      gap={30}
      alignItems={'center'}
      justifyContent={'space-between'}
      style={{ fontSize: 13 }}
      ref={ref}
      className={ClassName.flatButton(4, '4px 6px')}
    >
      <div className={ClassName.ellipsisFont(1)}>{name}</div>
      <Icon
        name={'park-close'}
        size={13}
        containerStyle={{
          opacity: isIn ? 1 : 0,
          transition: 'opacity 0.25s ease'
        }}
        className={ClassName.flatButton(4, '4px')}
        onClick={e => {
          e.stopPropagation()
          onDelete()
        }}
      />
    </Content>
  )
}
export default SearchHistory
