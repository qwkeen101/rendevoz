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
import { useLatest } from 'react-use'

const WEB_SEARCH_KEY = 'WEB_SEARCH'
const LIBRARY_SEARCH_KEY = 'LIBRARY_SEARCH'

const getSuggestions = async (query: string) => {
  try {
    const url = `https://suggestqueries-clients6.youtube.com/complete/search?ds=yt&client=youtube&gs_ri=youtube&ytvs=1&gs_id=2&q=${query}&cp=2`
    const res = await fetch(url).then(i => i.text())
    const argsStr = res.slice(res.indexOf('(') + 1, res.lastIndexOf(')'))
    const parsed = JSON.parse(argsStr)
    const arr = parsed[1] as string[][]
    return arr.map(i => i[0])
  } catch {
    return []
  }
}

export default () => {
  const [{ globalSearch }, setState] = useYoutubeState()
  const [librarySearch, setLibrarySearch] = useGlobalAtom(LibrarySearchAtom)
  const [options, setSearchOptions] = useState<IMenuLayoutItem[]>([])
  const currentLocation = useLocation()
  const instance = useYoutubeInstance()
  const latestSearch = useLatest(globalSearch)
  const getSearchOptions = async () => {
    const opts: IMenuLayoutItem[] = []
    const data = useYoutubeData.getData()
    const channels = await ObjectStore('youtubeChannel').getMultipleByIds(data.followedChannels || [])
    const playlists = await ObjectStore('youtubePlaylist').getMultipleByIds(data.followedPlaylists || [])
    const folders = await ObjectStore('youtubeFolder').fetchAll()
    if (globalSearch) {
      const suggestions = await getSuggestions(globalSearch)
      if (suggestions.length) {
        opts.push({
          type: 'title',
          name: 'Search all of Youtube'
        })
        suggestions.slice(0, 6).forEach(s => {
          opts.push({
            type: 'item',
            key: `${WEB_SEARCH_KEY}_${s}`,
            icon: Icons.Search,
            text: s
          })
        })
      }
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
    if (latestSearch.current !== globalSearch) return
    setSearchOptions(opts)
  }

  useLayoutEffect(() => {
    getSearchOptions()
  }, [currentLocation.key, globalSearch])

  const handleChange = (query: string) => {
    setState(s => ({ ...s, globalSearch: query }))
  }

  const onOptionChange = async (key: string | undefined) => {
    if (key === undefined) {
      setState(s => ({ ...s, search: { query: globalSearch } }))
      instance.navigate?.(YoutubeConsts.Routers.Search)
      instance.search?.()
      return
    }
    if (key.startsWith(WEB_SEARCH_KEY)) {
      const query = key.replace(`${WEB_SEARCH_KEY}_`, '')
      setState(s => ({ ...s, globalSearch: query, search: { query } }))
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
