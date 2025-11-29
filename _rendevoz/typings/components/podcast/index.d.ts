import { IBase } from '../..'

export type IItunesGenre = {
  name: string
  id: string
}
export type IPodcast = {
  episodes: number[]
  artist: string
  name: string
  thumbnail: string
  itunesId: number
  itunesURL: string
  description?: string
  starred?: boolean
  followedAt?: number
  country?: string
  followed?: boolean
  lastUpdated?: number
  lastPlayedEpisode?: number
} & IBase
export type IEpisode = {
  audioMetaId?: number
  originalURL: string
  enclosureURL: string
  description?: string
  itunesURL: string
  name: string
  followed?: boolean
  releaseDate: number
  starred?: boolean
  podcastId?: number
  followedAt?: number
  thumbnail?: string
  // already played time
  currentTime?: number
  // seconds
  duration?: number
  genres?: IItunesGenre[]
} & IBase

export type IPodcastFolder = {
  name: string
  episodes: number[]
  podcasts: number[]
  thumbnail?: string
} & IBase
