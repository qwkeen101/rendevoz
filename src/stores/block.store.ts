import useDb from '@/hooks/stores/useDb'
import { NoteBlock } from '~/typings/data'

const useBlockStore = () => {
  const db = useDb('blocks')
  const getBlockById = (id: number): Promise<NoteBlock> => {
    return db.get(id)
  }
  const getBlocksByIds = (ids: number[]) => {
    return db.bulkGet(ids)
  }

  return {
    getBlockById,
    getBlocksByIds
  }
}

export default useBlockStore
