import { memo } from 'react'
import { IPodcastInstance } from '@/core/components/podcast/hooks/usePodcastInstance'
import { IFeedInstance, IYoutubeInstance } from '~/typings'
import Feed from '@/core/components/feed'
import Youtube from '@/core/components/youtube'
import Podcast from '@/core/components/podcast'
import { assignProperties, waitFor } from '@/utils'
import { atom } from 'jotai'
import { useGlobalAtom, useGlobalAtomValue } from '@/hooks'
import { globalStore } from '@/api/stores'

const ExtraPageAtom = atom<
  | {
      page: 'podcast'
      instance?: IPodcastInstance
    }
  | {
      page: 'feed'
      instance?: IFeedInstance
    }
  | {
      page: 'youtube'
      instance?: IYoutubeInstance
    }
>()
export default memo(() => {
  const [currentPage, setCurrentPage] = useGlobalAtom(ExtraPageAtom)
  assignProperties(Global, {
    layoutOps: {
      ...Global.layoutOps,
      useExtraPage: () => useGlobalAtomValue(ExtraPageAtom) !== undefined,
      closeExtraPage: () => setCurrentPage(undefined),
      openExtraPage: (page, onInstanceInitialized) => {
        if (currentPage?.page !== page) {
          setCurrentPage({ page })
        }
        waitFor(
          () => !!globalStore.get(ExtraPageAtom)?.instance,
          () => {
            onInstanceInitialized?.(globalStore.get(ExtraPageAtom)!.instance!)
          }
        )
      }
    }
  })
  if (currentPage?.page) {
    const renderInner = () => {
      switch (currentPage?.page) {
        case 'feed':
          return <Feed onInstanceInitialized={i => setCurrentPage({ page: 'feed', instance: i })} />
        case 'youtube':
          return <Youtube onInstanceInitialized={i => setCurrentPage({ page: 'youtube', instance: i })} />
        case 'podcast':
          return <Podcast onInstanceInitializd={i => setCurrentPage({ page: 'podcast', instance: i })} />
      }
    }
    return <div className={'fixed w-full bg-global h-full'}>{renderInner()}</div>
  }
  return null
})
