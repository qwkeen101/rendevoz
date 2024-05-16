import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Content, Icon } from '@/components'
import BetterFilter from '@/core/object/filter/BetterFilter'
import produce from 'immer'
import Id from '@/utils/id'
import { Colors } from '@/consts'
import { css } from '@emotion/css'
import FontSize from '@/consts/font'
import { MetaObject } from '~/typings'
import _ from 'lodash'
import { ClassName } from 'rendevoz'
const FilterSelect = BetterFilter.FilterSelect
export type SorterGroup = {
  sorters: MetaSorter[]
}

export type MetaSorter = {
  field: 'name' | 'description' | 'createdAt' | 'viewAt' | 'updatedAt' | 'deletedAt'
  type: 'ascending' | 'descending'
  id: number
}

const BetterSorter = ({ root, onChange }: { root?: SorterGroup; onChange?: (sorter: SorterGroup) => void }) => {
  const [rootSorter, setRootSorterer] = useState(
    root || {
      sorters: []
    }
  )

  useEffect(() => {
    if (rootSorter) {
      onChange?.(rootSorter)
    }
  }, [rootSorter])
  const { t } = useTranslation()
  const handleChange = sorter => {
    const idx = rootSorter.sorters.findIndex(i => i.id === sorter.id)
    if (idx > -1) {
      setRootSorterer(s =>
        produce(s, draft => {
          draft.sorters[idx] = sorter
        })
      )
    }
  }
  const handleDelete = id => {
    const idx = rootSorter.sorters.findIndex(i => i.id === id)
    if (idx > -1) {
      setRootSorterer(s =>
        produce(s, draft => {
          draft.sorters.splice(idx, 1)
        })
      )
    }
  }
  return (
    <Content
      flex
      column
      gap={6}
      className={css({
        minWidth: 180,
        '*': {
          fontSize: FontSize['12px']
        }
      })}
    >
      {rootSorter?.sorters.map(i => <SorterItem sorter={i} onChange={handleChange} onDelete={handleDelete} key={i.id} />)}
      <Button.IconButton
        size={11}
        gap={6}
        style={{
          fontSize: '12px',
          border: `1px solid ${Colors.Background.Border}`,
          padding: '2px 6px 2px 4px',
          width: 'fit-content',
          borderRadius: 8
        }}
        onClick={() => {
          setRootSorterer(s =>
            produce(s, draft => {
              draft.sorters.push({
                field: 'name',
                type: 'ascending',
                id: Id.getId()
              })
            })
          )
        }}
        text={t('filter.Sort')}
        icon={'park-plus'}
      />
    </Content>
  )
}

const SorterItem = ({
  sorter,
  onChange,
  onDelete
}: {
  sorter: MetaSorter
  onDelete: (id: number) => void
  onChange: (sorter: MetaSorter) => void
}) => {
  const { t } = useTranslation()
  const availableSorters = [
    {
      value: 'name',
      children: t('filter.Name'),
      icon: 'park-edit'
    },
    {
      value: 'description',
      children: t('filter.Description'),
      icon: 'park-info'
    },
    {
      value: 'createdAt',
      children: t('filter.Created at'),
      icon: 'park-time'
    },
    {
      value: 'viewAt',
      icon: 'park-preview-open',
      children: t('filter.Last viewed')
    },
    {
      value: 'updatedAt',
      children: t('filter.Last updated'),
      icon: 'park-redo'
    }
  ]

  return (
    <Content flex gap={8}>
      <FilterSelect value={sorter.field} options={availableSorters} onSelect={v => onChange({ ...sorter, field: v })} />
      <FilterSelect
        value={sorter.type}
        options={[
          {
            value: 'ascending',
            children: t('filter.ascending')
          },
          {
            value: 'descending',
            children: t('filter.descending')
          }
        ]}
        onSelect={v => onChange({ ...sorter, type: v })}
      />
      <Icon name="park-close" onClick={() => onDelete(sorter.id)} className={ClassName.circleButton()} />
    </Content>
  )
}

export function calculateSortObjects(objects: MetaObject[], group: SorterGroup) {
  const result = _.orderBy(
    objects,
    [...group.sorters.map(i => o => o[i.field] ?? '')],
    [...group.sorters.map(i => (i.type === 'ascending' ? 'asc' : 'desc'))]
  )
  return result
}

export default BetterSorter
