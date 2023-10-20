import { Content, Icon } from '@/components'
import FontSize from '@/consts/font'
import SidebarObjectItem from '@/components/layout/sidebar/items/SidebarObjectItem'
import SidebarCollectionItem from '@/components/layout/sidebar/items/SidebarCollectionItem'
import { useTranslation } from 'react-i18next'
import { useToggle } from '@/hooks'
import { MetaStore, ObjectStore } from '@/stores'
import { useState } from 'react'
import { ClassName } from 'rendevoz'
import { css } from '@emotion/css'
import HoverObjectDetails from '@/core/object/HoverObjectDetails'

export default () => {
  const [collapsed, toggleCollapsed] = useToggle(false)
  const tagToItems = MetaStore.useIndexedMetaObjects()?.tagToMetaObjectIdsMap
  const { t } = useTranslation()
  return (
    <Content flex column style={{ marginBottom: 10 }}>
      <div style={{ cursor: 'pointer', fontSize: FontSize['13px'] }} onClick={toggleCollapsed}>
        {t('sidebar.tags')}
      </div>
      {Array.from(tagToItems?.entries() || []).map(entry => (
        <TagItem key={entry[0]} items={Array.from(entry[1].values())} tagId={entry[0]} />
      ))}
    </Content>
  )
}

const TagItem = ({ items, tagId }: { items: number[]; tagId: number }) => {
  const [toggled, setToggled] = useState(true)
  const tag = ObjectStore('tag').useValue(tagId)
  if (!tag) return null
  return (
    <Content>
      <Content className={ClassName.flatButton(4, '3px 8px 3px 2px')} flex gap={4} onClick={() => setToggled(!toggled)}>
        <Icon size={14} theme="filled" name="park-right-one" style={{ transform: toggled ? undefined : 'rotate(90deg)' }} />
        {tag.name}
      </Content>
      {!toggled && (
        <Content style={{ fontSize: 13, paddingLeft: 10 }}>
          {items.map(i => (
            <Item key={i} metaId={i}></Item>
          ))}
        </Content>
      )}
    </Content>
  )
}

const Item = ({ metaId }: { metaId: number }) => {
  const meta = MetaStore.useValue(metaId)
  if (!meta) return null
  return (
    <HoverObjectDetails metaObjectId={metaId} positions={['right']}>
      <div className={css([ClassName.ellipsisFont(1), ClassName.flatButton(4, '3px 6px')])}>{meta?.name}</div>
    </HoverObjectDetails>
  )
}
