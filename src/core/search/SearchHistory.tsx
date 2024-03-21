import KeyvalueStore from '@/api/stores/keyvalue.store'
import { Content, Icon } from '@/components'
import { ClassName } from 'rendevoz'
import FontSize from '@/consts/font'
import { useTranslation } from 'react-i18next'
import { useIsIn } from '@/hooks'
import classnames from 'classnames'

type SearchHistoryProps = {
  onClick: (name: string) => void
}
const SearchHistory = ({ onClick }: SearchHistoryProps) => {
  const { t } = useTranslation()
  const searchHistory = KeyvalueStore.useValue('searchHistory') || []
  if (!searchHistory.length) return null
  return (
    <Content flex column style={{ padding: 6 }}>
      <div className={'font-size-12 transparent-font'} style={{ paddingLeft: '0.5em', marginBottom: '0.3em' }}>
        {t('general.Search history')}
      </div>
      {searchHistory.map((i, index) => (
        <HistoryItem
          key={i}
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
  return (
    <Content
      flex
      onClick={() => {
        onClick()
      }}
      gap={30}
      alignItems={'center'}
      justifyContent={'space-between'}
      className={classnames(ClassName.flatButton(4, '4px 6px'), 'font-size-13')}
    >
      <div className={ClassName.ellipsisFont(1)}>{name}</div>
      <Icon
        name={'park-close'}
        size={13}
        className={classnames(ClassName.flatButton(4, '4px'), 'super-transparent-font')}
        onClick={e => {
          e.stopPropagation()
          onDelete()
        }}
      />
    </Content>
  )
}
export default SearchHistory
