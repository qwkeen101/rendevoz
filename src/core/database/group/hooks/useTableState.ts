import { atom, PrimitiveAtom } from 'jotai'
import { MetaGroup, MetaTableHeader } from '~/typings'
import { t } from 'i18next'
import { Atom } from 'jotai/vanilla'

const DEFAULT_HEADERS = [
  {
    width: 300,
    name: 'name',
    display: () => t('general.name'),
    icon: 'park-edit'
  },
  {
    width: 300,
    name: 'description',
    icon: 'park-info',
    display: () => t('general.description')
  },
  {
    width: 300,
    name: 'tags',
    icon: 'park-tag-one',
    display: () => t('general.tags')
  },
  {
    width: 300,
    name: 'fromObject',
    icon: 'park-share-one',
    display: () => t('general.from')
  },
  {
    width: 150,
    name: 'related',
    display: () => t('general.related')
  },
  {
    width: 150,
    name: 'inLinks',
    display: () => t('general.inbound links')
  },
  {
    width: 150,
    name: 'outLinks',
    display: () => t('general.outbound links')
  }
  // {
  //   width: 150,
  //   name: 'createdAt',
  //   icon: 'park-time',
  //   display: () => t('general.createdAt')
  // },
  // {
  //   width: 150,
  //   name: 'viewAt',
  //   icon: 'park-preview-open',
  //   display: () => t('general.viewAt')
  // },
  // {
  //   width: 150,
  //   name: 'updatedAt',
  //   icon: 'park-redo',
  //   display: () => t('general.updatedAt')
  // }
]

// plus one for border

export const GroupAtomAtom = atom<Atom<MetaGroup | undefined>>(atom(undefined))

export const TableStateAtom = atom<{
  headers: MetaTableHeader[]
  headerColumn: string
  wrap: boolean
}>({
  wrap: true,
  headers: DEFAULT_HEADERS,
  headerColumn: DEFAULT_HEADERS.map(i => `${i.width + 1}px`).join(' ')
})
