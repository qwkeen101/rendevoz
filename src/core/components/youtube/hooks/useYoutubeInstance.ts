import { atom, useAtomValue } from 'jotai'
import { IYoutubeInstance } from '~/typings'

const YoutubeInstanceAtom = atom<IYoutubeInstance>({})

const useYoutubeInstance = () => useAtomValue(YoutubeInstanceAtom)

export default useYoutubeInstance
