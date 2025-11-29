import { ObjectStore } from '@/api/stores'
import { INote, INoteLabel } from '~/typings'

const useLabel = (note?: INote) => {
  const labels = note?.labels || []
  const addLabel = async (label: Partial<INoteLabel>) => {
    if (!note) return
    const newLabel = await ObjectStore('noteLabel').addOne({
      ...label,
      parentObjectId: note.id
    })
    const newLabels = [...labels, newLabel.id]
    await ObjectStore('note').updateOne({ id: note.id, labels: newLabels })
    return newLabel
  }

  const deleteLabel = async (id: number | number[]) => {
    if (!note) return
    const ids = Array.isArray(id) ? id : [id]
    await Promise.allSettled(ids.map(async id => await ObjectStore('noteLabel').deleteOneById(id, { force: true })))
    const newLabels = labels.filter(i => !ids.includes(i))
    await ObjectStore('note').updateOne({ id: note.id, labels: newLabels })
  }

  return {
    addLabel,
    deleteLabel
  }
}

export default useLabel
