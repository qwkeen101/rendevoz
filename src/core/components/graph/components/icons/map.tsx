import {
  ImageIcon,
  LabelIcon,
  LocalFileIcon,
  NotesIcon,
  PdfIcon,
  PinnedIcon,
  TwitterIcon,
  UnknownIcon,
  VideoIcon,
  WebpageIcon,
  WhiteboardIcon
} from './icons'
import { ReactElement } from 'react'

export const NAME_TO_ICON: Record<ReturnType<typeof Global.utils.getIcon> | 'park-pin', ReactElement> = {
  'park-notes': <NotesIcon />,
  'park-pdf': <PdfIcon />,
  'park-web-page': <WebpageIcon />,
  'park-label': <LabelIcon />,
  'park-new-computer': <WhiteboardIcon />,
  'park-image-files': <ImageIcon />,
  'park-log': <LocalFileIcon />,
  'park-file-question': <UnknownIcon />,
  'park-pin': <PinnedIcon />,
  'park-play-two': <VideoIcon />,
  'custom-twitter': <TwitterIcon />
}
