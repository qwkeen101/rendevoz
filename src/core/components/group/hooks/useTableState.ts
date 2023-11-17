import { atom, PrimitiveAtom } from 'jotai'
import { MetaGroup, MetaGroupProperty } from '~/typings'
import { t } from 'i18next'
import { Atom } from 'jotai/vanilla'

const DEFAULT_HEADERS = [
  {
    width: 100,
    name: 'type',
    display: 'general.type',
    icon: 'park-edit',
    visible: true
  },
  {
    width: 200,
    name: 'parentItems',
    display: 'general.parent Items',
    icon: 'park-edit',
    visible: true
  },
  {
    width: 300,
    name: 'name',
    display: 'general.name',
    icon: 'park-edit',
    visible: true
  },
  {
    width: 300,
    name: 'description',
    icon: 'park-info',
    display: 'general.description',
    visible: true
  },
  {
    width: 300,
    name: 'tags',
    icon: 'park-tag-one',
    display: 'general.tags',
    visible: true
  },
  {
    width: 300,
    name: 'coverImgSrc',
    icon: 'park-picture',
    display: 'general.image',
    visible: true
  },
  {
    width: 300,
    name: 'fromObject',
    icon: 'park-share-one',
    display: 'general.from',
    visible: false
  },
  {
    width: 150,
    name: 'related',
    display: 'general.related',
    visible: false
  },
  {
    width: 150,
    name: 'inLinks',
    display: 'general.inbound links',
    visible: false
  },
  {
    width: 150,
    name: 'outLinks',
    display: 'general.outbound links',
    visible: false
  },
  {
    width: 150,
    name: 'createdAt',
    icon: 'park-time',
    display: 'general.createdAt',
    visible: false
  },
  {
    width: 150,
    name: 'viewAt',
    icon: 'park-preview-open',
    display: 'general.viewAt',
    visible: false
  },
  {
    width: 150,
    name: 'updatedAt',
    icon: 'park-redo',
    display: 'general.updatedAt',
    visible: false
  }
]

// plus one for border

export const GroupAtomAtom = atom<Atom<MetaGroup | undefined>>(atom(undefined))

export const TableStateAtom = atom<{
  headers: MetaGroupProperty[]
  headerColumn: string
  wrap: boolean
}>({
  wrap: true,
  headers: DEFAULT_HEADERS,
  headerColumn: DEFAULT_HEADERS.map(i => `${i.width + 1}px`).join(' ')
})
