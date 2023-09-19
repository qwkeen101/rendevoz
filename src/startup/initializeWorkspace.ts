import { getSetting, SettingAtom } from '@/core'
import { useDb } from '@/hooks'
import { MetaObject } from '~/typings'
import KeyvalueStore from '@/stores/keyvalue.store'
import produce from 'immer'
import { useSetAtom } from 'jotai'

const initializeWorkspace = async (setSetting: ReturnType<typeof useSetAtom<typeof SettingAtom>>) => {
  const keyvalueDb = useDb('keypairs')
  await KeyvalueStore.getAll()
  const currentWorkspace = (await keyvalueDb.get('currentWorkspace')) || 'default'
  const allWorkspace = (await keyvalueDb.get('allWorkspaces')) || [
    {
      createdAt: Date.now(),
      name: 'default'
    }
  ]
  if (!(await keyvalueDb.get('currentWorkspace'))) {
    await keyvalueDb.put(currentWorkspace, 'currentWorkspace')
  }
  if (!(await keyvalueDb.get('allWorkspaces'))) {
    await keyvalueDb.put(allWorkspace, 'allWorkspaces')
  }
  setSetting(s =>
    produce(s, draft => {
      draft.workspace = {
        allSpaces: allWorkspace,
        currentSpace: currentWorkspace
      }
    })
  )
  const metaObjectDb = useDb('metaObjects')
  const all = (await metaObjectDb.filter(i => !i.workspace).toArray()) as MetaObject[]
  const update = all.map(i => ({ ...i, workspace: currentWorkspace }))
  await metaObjectDb.bulkPut(update)
}

export default initializeWorkspace
