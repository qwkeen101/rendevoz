import { atom, useAtom } from 'jotai'

const isSelectingAtom = atom(false)

const useIsSelecting = () => useAtom(isSelectingAtom)

export default useIsSelecting
