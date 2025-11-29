import { useLocation } from 'react-router-dom'
import { useLayoutEffect, useState } from 'react'
import { IMenuLayoutItem } from '@/components/base/menu'
import useYoutubeData from '@/core/components/youtube/hooks/useYoutubeData'
import { ObjectStore } from '@/api/stores'
import { compareStrings } from '@/utils'
import { Icons } from '@/consts'
import useYoutubeInstance from '@/core/components/youtube/hooks/useYoutubeInstance'
import useYoutubeState from '@/core/components/youtube/hooks/useYoutubeState'
import fuzzysort from 'fuzzysort'
import { groupBy } from 'lodash'
import { LibrarySearchAtom } from '@/core/components/common/useLibrarySearchAll'
import { useGlobalAtom } from '@/hooks'
import YoutubeConsts from '@/core/components/youtube/YoutubeConsts'

const WEB_SEARCH_KEY = 'WEB_SEARCH'
const LIBRARY_SEARCH_KEY = 'LIBRARY_SEARCH'

export default () => {
  const [{ globalSearch }, setState] = useYoutubeState()
  const [librarySearch, setLibrarySearch] = useGlobalAtom(LibrarySearchAtom)
  const [options, setSearchOptions] = useState<IMenuLayoutItem[]>([])
  const currentLocation = useLocation()
  const instance = useYoutubeInstance()
  const getSearchOptions = async () => {
    const opts: IMenuLayoutItem[] = []
    const data = useYoutubeData.getData()
    const channels = await ObjectStore('youtubeChannel').getMultipleByIds(data.followedChannels || [])
    const playlists = await ObjectStore('youtubePlaylist').getMultipleByIds(data.followedPlaylists || [])
    const folders = await ObjectStore('youtubeFolder').fetchAll()
    if (globalSearch) {
      opts.push({
        type: 'item',
        key: WEB_SEARCH_KEY,
        icon: Icons.Search,
        text: globalSearch,
        suffix: 'Search all of Youtube'
      })
      opts.push({
        type: 'item',
        key: LIBRARY_SEARCH_KEY,
        icon: Icons.DocumentLibrary,
        text: globalSearch,
        suffix: 'Search all of library'
      })
      const searched = Array.from(
        fuzzysort
          .go(globalSearch, [...channels, ...playlists, ...folders], {
            key: 'name',
            threshold: -100000
          })
          .values()
      ).map(i => i.obj)

      const record = groupBy(searched, i => i.specType)
      if (record['youtubeFolder']?.length) {
        opts.push(
          ...([
            {
              type: 'title',
              name: 'Folders'
            },
            ...record['youtubeFolder']
              .map(i => ({
                type: 'item',
                key: `folder_${i.id}`,
                text: i.name,
                icon: Icons.Folder
              }))
              .toSorted((a, b) => compareStrings(a.text, b.text))
          ] as IMenuLayoutItem[])
        )
      }
      if (record['youtubeChannel']?.length) {
        opts.push(
          ...([
            {
              type: 'title',
              name: 'Channels'
            },
            ...record['youtubeChannel']
              .map(i => ({
                type: 'item',
                key: `channel_${i.id}`,
                text: i.name,
                image: i.thumbnail
              }))
              .toSorted((a, b) => compareStrings(a.text, b.text))
          ] as IMenuLayoutItem[])
        )
      }
      if (record['youtubePlaylist']?.length) {
        opts.push(
          ...([
            {
              type: 'title',
              name: 'Playlists'
            },
            ...record['youtubePlaylist']
              .map(i => ({
                type: 'item',
                key: `playlist_${i.id}`,
                text: i.name,
                image: i.thumbnail
              }))
              .toSorted((a, b) => compareStrings(a.text, b.text))
          ] as IMenuLayoutItem[])
        )
      }
    } else {
      if (folders.length) {
        opts.push(
          ...([
            {
              type: 'title',
              name: 'Folders'
            },
            ...folders
              .map(i => ({
                type: 'item',
                key: `folder_${i.id}`,
                text: i.name,
                icon: Icons.Folder
              }))
              .toSorted((a, b) => compareStrings(a.text, b.text))
          ] as IMenuLayoutItem[])
        )
      }
      if (channels.length) {
        opts.push(
          ...([
            {
              type: 'title',
              name: 'Channels'
            },
            ...channels
              .map(i => ({
                type: 'item',
                key: `channel_${i.id}`,
                text: i.name,
                image: i.thumbnail
              }))
              .toSorted((a, b) => compareStrings(a.text, b.text))
          ] as IMenuLayoutItem[])
        )
      }
      if (playlists.length) {
        opts.push(
          ...([
            {
              type: 'title',
              name: 'Playlists'
            },
            ...playlists
              .map(i => ({
                type: 'item',
                key: `playlist_${i.id}`,
                text: i.name,
                image: i.thumbnail
              }))
              .toSorted((a, b) => compareStrings(a.text, b.text))
          ] as IMenuLayoutItem[])
        )
      }
    }
    setSearchOptions(opts)
  }

  useLayoutEffect(() => {
    getSearchOptions()
  }, [currentLocation.key, globalSearch])

  const handleChange = (query: string) => {
    setState(s => ({ ...s, globalSearch: query }))
  }

  const onOptionChange = async (key: string) => {
    if (key === WEB_SEARCH_KEY) {
      setState(s => ({ ...s, search: { query: globalSearch } }))
      instance.navigate?.(YoutubeConsts.Routers.Search)
      instance.search?.()
    }
    if (key === LIBRARY_SEARCH_KEY && globalSearch) {
      setLibrarySearch(s => ({
        ...s,
        [YoutubeConsts.Search.Library]: {
          query: globalSearch
        }
      }))
      instance.navigate?.(YoutubeConsts.Routers.Library)
    }
  }

  return {
    options,
    onOptionChange,
    globalSearch,
    handleChange
  }
}
