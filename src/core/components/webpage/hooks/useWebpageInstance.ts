import { IWebpageInstance } from '~/typings'
import { atom, useAtomValue } from 'jotai'

export const WebpageInstanceAtom = atom<IWebpageInstance>({})

const useWebpageInstance = () => useAtomValue(WebpageInstanceAtom)

export default useWebpageInstance