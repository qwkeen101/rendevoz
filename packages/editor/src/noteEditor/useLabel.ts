import { INote, INoteLabel } from '~/typings'

const useLabel = (note?: INote) => {
  const labels = note?.labels || []
  const addLabel = async (label: Partial<INoteLabel>) => {
    return { ...label, id: label.id ?? Date.now() }
  }

  const deleteLabel = async (id: number | number[]) => {
    return
  }

  return {
    addLabel,
    deleteLabel
  }
}

export default useLabel
