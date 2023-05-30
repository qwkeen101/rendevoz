import { useTranslation } from 'react-i18next'
import { Icon } from '@/components'
import { MenuItem } from './Item'
import { GlobalTextSearchInstance } from '@/core/global/GlobalTextSearch'
const SidebarSearch = () => {
  const { t } = useTranslation()
  return (
    <>
      <MenuItem onClick={() => GlobalTextSearchInstance.open?.()}>
        <Icon style={{ marginRight: 10 }} size={16} name="park-search" />
        {t('general.search')}
      </MenuItem>
    </>
  )
}

export default SidebarSearch
