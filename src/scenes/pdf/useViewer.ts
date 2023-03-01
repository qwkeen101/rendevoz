import { createContext, createRef, useContext } from 'react'

export const ViewerContext = createContext(createRef())

const useViewer = () => useContext(ViewerContext)

export default useViewer
