import { IMediaState } from '~/typings'
import { IMediaSidebarState } from '@/core/components/media/hooks/useMediaSidebarState'

export type IMediaLayout = {
  subtitleUnderMain: boolean
  sidebarOpened: boolean
}
export default (
  sidebarState: IMediaSidebarState,
  column: boolean,
  opts?: {
    subtitleInSidebar?: boolean
  }
) => {
  const subtitleInSidebar = opts?.subtitleInSidebar ?? false
  const { rightBarActive, subtitleOpen } = sidebarState
  const layout: IMediaLayout = {
    subtitleUnderMain: false,
    sidebarOpened: false
  }
  if (subtitleInSidebar === false) {
    if (subtitleOpen) {
      if (column || (rightBarActive !== 'hide' && rightBarActive !== 'subtitle')) {
        layout.subtitleUnderMain = true
      }
    }
  }
  if (
    (rightBarActive !== 'hide' && (subtitleInSidebar === false ? rightBarActive !== 'subtitle' : true)) ||
    (subtitleInSidebar === false && subtitleOpen && !column)
  ) {
    layout.sidebarOpened = true
  }
  return layout
}
