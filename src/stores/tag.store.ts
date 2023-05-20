import { atom } from 'jotai/vanilla'
import { ITag } from '~/typings/data'
import { ObjectStore } from '.'

export const TagsAtom = atom<Map<number, ITag>>(new Map())

export const TagToTagAtom = atom<Map<string, ITag>>(get => {
  const map = new Map<string, ITag>()
  get(ObjectStore('tag').objectMapAtom).forEach(i => {
    i.name && map.set(i.name, i)
  })
  return map
})
