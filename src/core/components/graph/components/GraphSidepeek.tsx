import { memo } from 'react'
import SidebarObjectViewer from '@/core/components/SidebarObjectViewer'

export default memo(({ visible }: { visible: number }) => {
  return (
    <div className={'w-full h-full flex flex-col relative'}>
      <SidebarObjectViewer
        pageConfig={{
          editorHeader: false,
          pdfHeader: false,
          editorAdd: false,
          messageTitle: false,
          whiteboardHeader: false,
          defaultOpenSidebar: false
        }}
        id={visible}
      />
    </div>
  )
})
