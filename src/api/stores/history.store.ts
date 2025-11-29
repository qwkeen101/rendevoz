import { applyPatches, Patch } from 'immer'
import { PrimitiveAtom } from 'jotai'
import { globalStore } from '@/api/stores/index'
import { immerWithDatabase } from '@/api/stores/immerWithDatabase'

export const finishProcess = (patches: Patch[], inversePatches: Patch[], atom: PrimitiveAtom<any>, databaseName: string) => {
  Global.emitEvent('databaseChange', {
    patches,
    inversePatches,
    atom,
    databaseName
  })
}

export const applyPatchesOnAtom = (atom: PrimitiveAtom<any>, patches: Patch[], databaseName: string) => {
  const currentValue = globalStore.get(atom)
  if (currentValue) {
    globalStore.set(atom, applyPatches(currentValue, patches))
  }
  immerWithDatabase(patches, databaseName)
}
