import { globalStore, MetaStore, ObjectStore } from '@/api/stores'
import { atom } from 'jotai/vanilla'
import produce from 'immer'
import { IMetaProp, IReviewStateType } from '~/typings'
import { AGAIN_OPTION_ID, EASY_OPTION_ID, GOOD_OPTION_ID, HARD_OPTION_ID } from '@/api/stores/object/custom/ReviewCardStore'
import { REVIEW_STATE_PROP_ID } from '@/api/stores/meta/meta.store'
import { useSelectGlobalAtomValue } from '@/hooks'
import { useMemo } from 'react'
import ReviewStore from '@/api/stores/review.store'

const MetaPropertyStore = {
  propNameToOptionsAtom: atom<Record<string, Set<number>>>({}),
  deletedPropertyToMetaId: {} as Record<number, number>,
  changePropertyName: async (propId: number, newName: string) => {
    await ObjectStore('metaProp').updateOne({ id: propId, name: newName })
  },
  updateProperty: async (id: number | number[], propId: number | string, newValue: any | null, keepOriginalIfUndefined?: boolean) => {
    const idArr = Array.isArray(id) ? id : [id]
    const map = MetaStore.getMetaObjectsMap()
    await Promise.all(
      idArr.map(async id => {
        const meta = map.get(id)
        if (meta) {
          if (newValue === null) {
            await MetaStore.updateMetaObject({
              id,
              properties: produce(meta.properties || {}, draft => {
                delete draft[propId]
              })
            })
            return
          }
          const newProp = produce(meta.properties || {}, draft => {
            if (keepOriginalIfUndefined && newValue.value === undefined && draft[propId]?.value !== undefined) {
            } else {
              draft[propId] = {
                ...draft[propId],
                ...newValue
              }
            }
          })
          if (propId === REVIEW_STATE_PROP_ID) {
            let type: IReviewStateType | undefined = undefined
            if (newValue.value) {
              switch (newValue.value) {
                case GOOD_OPTION_ID:
                  type = 'good'
                  break
                case EASY_OPTION_ID:
                  type = 'easy'
                  break
                case HARD_OPTION_ID:
                  type = 'hard'
                  break
                case AGAIN_OPTION_ID:
                  type = 'again'
                  break
              }
            }
            if (type) {
              let card = meta.review && (await ObjectStore('reviewCard').getOneById(meta.review))
              if (!card || card.last_rate !== type) {
                ReviewStore.reviewCard(meta.id, type)
                return
              }
            }
          }
          await MetaStore.updateMetaObject({ id, properties: newProp }, { silent: true })
        }
      })
    )
  },
  // property name to option id set cache
  calculatePropertyOptionCache: (): Record<string, Set<number>> => {
    const optionCacheObj: Record<string, Set<number>> = {}
    const allOptions = Array.from(globalStore.get(ObjectStore('metaPropSelectOption').objectMapAtom).values())
    allOptions.forEach(option => {
      const cache = optionCacheObj[option.parentPropName] || new Set<number>()
      cache.add(option.id)
      optionCacheObj[option.parentPropName] = cache
    })
    globalStore.set(MetaPropertyStore.propNameToOptionsAtom, optionCacheObj)
    return optionCacheObj
  },
  deleteProperty: async (propId: number) => {
    await ObjectStore('metaProp').deleteOneById(propId)
    const options = globalStore.get(MetaPropertyStore.propNameToOptionsAtom)[propId]
    if (options) {
      options.forEach(id => {
        ObjectStore('metaPropSelectOption').deleteOneById(id)
      })
    }
  },
  getPropDetails: (id: number | string) => {
    return globalStore.get(ObjectStore('metaProp').objectMapAtom).get(Number(id)) as IMetaProp | undefined
  },
  addNewProp: async (prop: Partial<IMetaProp>) => {
    return await ObjectStore('metaProp').addOne(prop)
  },
  getNewPropName: (currName?: string) => {
    return currName || 'Unnamed property'
  },
  usePropOptions: (propId: number | string): number[] => {
    const optionMap = globalStore.get(ObjectStore('metaPropSelectOption').objectMapAtom)
    const obj = useSelectGlobalAtomValue(MetaPropertyStore.propNameToOptionsAtom, s => s[propId])
    const arr = useMemo(() => {
      const arr = Array.from(obj || [])
      arr.sort((b, a) => (optionMap.get(b)?.order ?? 0) - (optionMap.get(a)?.order ?? 0))
      return arr
    }, [obj])
    return arr
  },
  getPropOptions: (): Record<string, Set<number>> => {
    const obj = globalStore.get(MetaPropertyStore.propNameToOptionsAtom)
    return obj
  }
}

export default MetaPropertyStore
