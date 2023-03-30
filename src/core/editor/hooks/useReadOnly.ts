import { atom, useAtomValue } from 'jotai'

export const ReadOnlyEditorAtom = atom(false)

const useReadOnlyEditor = () => useAtomValue(ReadOnlyEditorAtom)

export default useReadOnlyEditor
