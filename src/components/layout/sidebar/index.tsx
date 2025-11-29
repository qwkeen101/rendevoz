import { RegisteredSidebarItem } from '~/typings/registered'
import { t } from 'i18next'
import { GlobalSetting } from '@/core'
import { Icons } from '@/consts'

export const BuiltInSidebarItems = {
  home: {
    key: 'home',
    icon: 'park-home',
    onClick: () => {
      Global.layoutOps?.closeFloatSidebar()
      Global.layoutOps?.openPage('home')
    },
    text: () => t('general.home')
  },
  database: {
    key: 'database',
    text: () => t('general.Library'),
    icon: 'custom-card-library',
    onClick: () => {
      Global.layoutOps?.closeFloatSidebar()
      Global.layoutOps?.openPage('library')
    }
  },
  search: {
    key: 'search',
    icon: Icons.Search,
    onClick: () => {
      Global.searchOps?.openSearchPanel()
      Global.layoutOps?.closeFloatSidebar()
    },
    text: () => t('general.search')
  },
  graph: {
    key: 'graph',
    icon: 'park-share-one',
    text: () => t('general.graph'),
    onClick: () => {
      Global.layoutOps?.closeFloatSidebar()
      Global.layoutOps?.openPage('graph')
    }
  },
  feeds: {
    key: 'feeds',
    text: () => t('general.Feeds'),
    icon: 'park-broadcast',
    onClick: () => {
      Global.layoutOps?.closeFloatSidebar()
      Global.layoutOps?.openPage('feed')
    }
  },
  youtube: {
    key: 'youtube',
    text: () => 'Youtube',
    icon: 'park-youtube',
    onClick: () => {
      Global.layoutOps?.closeFloatSidebar()
      Global.layoutOps?.openPage('youtube')
    }
  },
  podcast: {
    key: 'podcast',
    text: () => t('general.Podcast'),
    icon: 'park-fm',
    onClick: () => {
      Global.layoutOps?.closeFloatSidebar()
      Global.layoutOps?.openPage('podcast')
    }
  },
  recycleBin: {
    key: 'recycleBin',
    icon: 'park-delete-one',
    text: () => t('general.Trash'),
    onClick: () => {
      Global.layoutOps?.closeFloatSidebar()
      Global.layoutOps?.openPage('trash')
    }
  },
  settings: {
    key: 'settings',
    text: () => t('general.settings'),
    onClick: () => {
      GlobalSetting.openSetting()
      Global.layoutOps?.closeFloatSidebar()
    },
    icon: 'park-setting-two'
  }
}

export type ISidebarVisibleItems = 'database' | 'collections' | 'category' | 'chat' | 'application'

export type ISidebarState = {
  leftOpen?: boolean
  leftWidth: number
  leftVisible: ISidebarVisibleItems
}
