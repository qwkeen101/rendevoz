import { IconNameItem } from '@/components/layout/sidebar/SidebarCollection'
import FontSize from '@/consts/font'
import { ObjectStore } from '@/stores'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'

const WebpageSourceRenderer = ({ objectId }: { objectId: number }) => {
  const webpage = ObjectStore('webpage').useValue(objectId)

  if (webpage) {
    const { favicon, title, url } = webpage
    if (!url) return null
    const displayUrl = url ? new URL(url).hostname : title

    return (
      <IconNameItem
        className={css([
          // @ts-ignore
          {
            '*': {
              textTransform: 'none !important'
            }
          },
          ClassName.description(FontSize['11px'])
        ])}
        icon={favicon}
        name={displayUrl}
      />
    )
  } else {
    return null
  }
}

export default WebpageSourceRenderer
