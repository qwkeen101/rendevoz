import { getIcon } from '@/components/layout/sidebar/items/SidebarObjectItem'
import { ImageIcon, LabelIcon, LocalFileIcon, NotesIcon, PdfIcon, PinnedIcon, UnknownIcon, WebpageIcon, WhiteboardIcon } from './icons'
import { ReactElement } from 'react'

export const NAME_TO_ICON: Record<ReturnType<typeof getIcon> | 'park-pin', ReactElement> = {
  'park-notes': <NotesIcon />,
  'park-pdf': <PdfIcon />,
  'park-web-page': <WebpageIcon />,
  'park-label': <LabelIcon />,
  'park-new-computer': <WhiteboardIcon />,
  'park-image-files': <ImageIcon />,
  'park-log': <LocalFileIcon />,
  'park-file-question': <UnknownIcon />,
  'park-pin': <PinnedIcon />
}
