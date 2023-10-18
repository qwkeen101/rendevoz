import { IconNameItem } from '@/components/layout/sidebar/SidebarCollection'
import FontSize from '@/consts/font'
import { ObjectStore } from '@/stores'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { Regexp } from '@/utils'

const WebpageSourceRenderer = ({ objectId }: { objectId: number }) => {
  const webpage = ObjectStore('webpage').useValue(objectId)

  if (webpage) {
    const { favicon, title, url } = webpage
    if (!url) return null
    const displayUrl = Regexp.isValidWebUrl(url) ? new URL(url).hostname : title

    return (
      <IconNameItem
        onClick={() => {
          window.open(url)
        }}
        className={ClassName.description(FontSize['11px'])}
        style={{ textTransform: 'uppercase', cursor: 'pointer' }}
        icon={favicon}
        name={displayUrl}
      />
    )
  } else {
    return null
  }
}

export default WebpageSourceRenderer
