import { PdfScope } from '@/jotai/jotaiScope'
import { LayoutFunctions } from '@/pdfViewer/core/layouts/Layout'
import { atom, useAtomValue, useSetAtom } from 'jotai'
import { createContext, createRef, MutableRefObject, useContext } from 'react'

type Viewer = LayoutFunctions

const ViewerAtom = atom<MutableRefObject<Viewer | null>>(createRef<null>())

export const ViewerContext = createContext(createRef())

const useViewer = () => useContext(ViewerContext)

export const useSetViewer = () => useSetAtom(ViewerAtom, PdfScope)
export default useViewer
