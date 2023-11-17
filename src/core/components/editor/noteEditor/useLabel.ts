import { ObjectStore } from '@/api/stores'
import { INote, INoteLabel } from '~/typings'

const useLabel = (note?: INote) => {
  const labels = note?.labels || []
  const handleAddLabel = async (label: Partial<INoteLabel>) => {
    if (!note) return
    const newLabel = await ObjectStore('noteLabel').addOne({
      ...label,
      parentObjectId: note.id
    })
    const newLabels = [...labels, newLabel.id]
    await ObjectStore('note').updateOne({ id: note.id, labels: newLabels })
    return newLabel
  }

  const handleDeleteLable = async (id: number) => {
    if (!note) return
    console.log(id, labels)
    const newLabels = labels.filter(i => i !== id)
    await ObjectStore('note').updateOne({ id: note.id, labels: newLabels })
  }

  return {
    handleAddLabel,
    handleDeleteLable
  }
}

export default useLabel
