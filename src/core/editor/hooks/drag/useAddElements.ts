import { CustomEditor, CustomElement, IEditorInstance } from '~/typings'

const useAddElements = (instance: IEditorInstance, editor: CustomEditor) => {
  const handleAddElements = (elements: CustomElement) => {
    const indicator = instance.values.indicator
    if (!indicator) return
    const { direction, isNested, element, path } = indicator
  }
  return handleAddElements
}

export default useAddElements
