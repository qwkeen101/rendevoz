import { atom, PrimitiveAtom, useAtomValue, useStore } from 'jotai'
import { Draft } from 'immer'

const HistoryAtom = atom({
  redos: [],
  undos: []
})

export const useUpdateWithHistory = <T>(targetAtom: PrimitiveAtom<T>) => {
  const store = useStore()
  const history = useAtomValue(HistoryAtom)
  const update = (update: (draft: Draft<T>) => void, withUndo?: boolean) => {
    const currentState = store.get(targetAtom)
    if (currentState) {

    }
  }
}

export const useHistory = () => {

}
