import {
  IAudio,
  IImage,
  ILabel,
  ILocalFile,
  INote,
  INoteBlock,
  INoteLabel,
  IPdfDocument,
  ITag,
  IVideo,
  IVideoLabel,
  IWebpage,
  IWebpageLabel,
  IWhiteboard,
  IReviewRecord,
  MetaLink,
  MetaObject,
  ISyncedBlock,
  MetaGroup,
  IFeed,
  IQuestion,
  ICode,
  IMetaSelectOption,
  IMetaProp, IPdfLabel, IPDFLabel
} from '.'
import { PartialWithId } from './common'
import { CustomTypes } from './custom'
import { FeedItem, IFeedCollection, IFeedFolder } from '~/typings/components'

export type BuiltInObjectTypes = {
  webpage: IWebpage
  audio: IAudio
  note: { specType: 'note' } & INote
  noteLabel: INoteLabel
  noteBlock: INoteBlock
  webpageLabel: IWebpageLabel
  pdf: { specType: 'pdf' } & IPdfDocument
  whiteboard: { specType: 'whiteboard' } & IWhiteboard
  pdfLabel: IPDFLabel
  tag: ITag & { specType: 'tag' }
  image: IImage
  localFile: ILocalFile
  video: IVideo
  videoLabel: IVideoLabel
  feed: FeedItem
  review: IReviewRecord
  syncedBlock: ISyncedBlock
  group: MetaGroup
  feedCollection: IFeedCollection
  feedFolder: IFeedFolder
  question: IQuestion
  code: ICode
  metaPropSelectOption: IMetaSelectOption
  metaProp: IMetaProp
}

export type ObjectFamily = CustomTypes['Object']

export type IStoreOptions<T extends keyof ObjectFamily, V extends ObjectFamily[T], S extends IStore<V>> = {
  toastEnabled?: boolean
  beforeAddProcess?: (o: Partial<V>, opts: Parameters<S['addOne']>[1]) => Promise<boolean | void>
  beforeUpdateProcess?: (o: Partial<V>, opts: Parameters<S['updateOne']>[1]) => void
  beforeDeleteProcess?: (id: number, opts: Parameters<S['deleteOneById']>[1]) => Promise<boolean | void>
  beforeGetOneProcess?: () => void
  afterAddProcess?: {
    onSuccess?: (obj: V, opts: Parameters<S['addOne']>[1]) => void
    onFail?: (opts: Parameters<S['addOne']>[1]) => void
  }
  afterUpdateProcess?: {
    onSuccess?: (obj: V, silent: boolean) => void
    onFail?: (silent: boolean) => void
  }
  afterDeleteProcess?: (obj: V) => void
  afterGetOneProcess?: {
    onSuccess?: (obj: V, silent: boolean) => void
    onFail?: (silent: boolean) => void
  }
}

export interface IStore<T> {
  fetchOneById: (id: number) => Promise<T | undefined>
  getAll: () => Promise<T[]>
  getOneById: (id: number) => Promise<T | undefined>
  deleteOneById: (
    id: number,
    options?: {
      silent?: boolean
      force?: boolean
      deleteMeta?: boolean
      clearCache?: boolean
    }
  ) => Promise<boolean>
  addOne: (
    one: Partial<T>,
    options?: {
      silent?: boolean
      preventAddMeta?: boolean
    }
  ) => Promise<T>
  addOneWithMeta: (
    one: Parameters<IStore<T>['addOne']>['0'],
    options?: Parameters<IStore<T>['addOne']>['1'] & { showMetaModal?: boolean; currentMeta?: Partial<MetaObject> }
  ) => Promise<{
    one: T
    meta: MetaObject
  }>
  updateOne: (
    one: PartialWithId<T>,
    options?: {
      silent?: boolean
    }
  ) => Promise<T | undefined>
}

export declare const createObjectStore: <T extends keyof ObjectFamily, V extends ObjectFamily[T], S extends IStore<V>>(
  type: T,
  options: IStoreOptions<T, V, S>
) => {
  localStore: IStore<V>
  objectMapAtom: PrimitiveAtom<Map<number, V>>
  adaptStore: () => IStore<V>
  createAtom: (id?: number) => Atom<V | undefined>
  useValue: (id?: number) => Awaited<V> | undefined
  useAll: () => Map<number, V>
} & IStore<V>

export type IIndexedMetaObjects = {
  undeletedMetaObjectsSet: Set<MetaObject>
  pinnedMetaObjectsSet: Set<MetaObject>
  deletedMetaObjectsSet: Set<MetaObject>
  objectIdToMetaObjectMap: Map<number, number>
  tagToMetaObjectIdsMap: Map<number, Set<number>>
  typeToMetaObjectIdsMap: Map<string, Set<number>>
  metaAttachmentIdToMetaIdsMap: Map<number, Set<number>>
  oldMetaObjects: Map<number, MetaObject>
}

export type IIndexedMetaLinks = {
  sourceIdToLinkIdsMap: Map<number, Set<number>>
  targetIdToLinkIdMap: Map<number, Set<number>>
  relatedIdsMap: Map<number, Set<number>>
  oldLinks: Map<number, MetaLink>
  undeletedLinksSet: Set<MetaLink>
  sourceIdToTargetIdsMap: Map<number, Set<number>>
  targetIdToSourceIdsMap: Map<number, Set<number>>
}

export declare const MetaStore: {
  getMetaObjectById: (id: number) => Promise<MetaObject | undefined>
  getMetaObjectByObjectId: (objectId: number) => MetaObject | undefined
  useObjectToMetaValue: (objectId: number) => MetaObject | undefined
  useValue: (id?: number) => MetaObject | undefined
  addObjectAsMeta: (opts: { objectId: number; type: MetaObject['type']; name?: string }) => Promise<void>
  getAllMetaLinks: () => Promise<boolean>
  getAllMetaObjects: () => Promise<boolean>
  getMetaObjectsMap: () => Map<number, MetaObject>
  getMetaLinksMap: () => Map<number, MetaLink>
  useMetaObjectsMap: () => Map<number, MetaObject>
  useMetaLinksMap: () => Map<number, MetaLink>
  addMetaObject: (one: Partial<MetaObject>, silent?: boolean | undefined, overPremium?: boolean | undefined) => Promise<MetaObject>
  updateMetaObject: (one: PartialWithId<MetaObject>, silent?: boolean | undefined) => Promise<MetaObject | undefined>
  deleteMetaObject: (id: number, silent?: boolean | undefined, force?: boolean | undefined) => Promise<boolean>
  addMetaLink: (one: Partial<MetaLink>, silent?: boolean | undefined, overPremium?: boolean | undefined) => Promise<MetaLink>
  deleteMetaLink: (id: number, silent?: boolean | undefined, force?: boolean | undefined) => Promise<boolean>
  updateMetaLink: (one: PartialWithId<MetaLink>, silent?: boolean | undefined) => Promise<MetaLink | undefined>
  useIndexedMetaObjects: () => IIndexedMetaObjects | undefined
  getIndexedMetaObjects: () => IIndexedMetaObjects | undefined
  useIndexedMetaLinks: () => IIndexedMetaLinks | undefined
  getIndexedMetaLinks: () => IIndexedMetaLinks | undefined
}

export type IMetaStore = {
  getMetaObjectById: (id: number) => Promise<MetaObject | undefined>
  getMetaObjectByObjectId: (objectId: number) => MetaObject | undefined
  useObjectToMetaValue: (objectId: number) => MetaObject | undefined
  useValue: (id?: number) => MetaObject | undefined
  addObjectAsMeta: (opts: { objectId: number; type: MetaObject['type']; name?: string }) => Promise<void>
  getAllMetaLinks: () => Promise<boolean>
  getAllMetaObjects: () => Promise<boolean>
  getMetaObjectsMap: () => Map<number, MetaObject>
  getMetaLinksMap: () => Map<number, MetaLink>
  useMetaObjectsMap: () => Map<number, MetaObject>
  useMetaLinksMap: () => Map<number, MetaLink>
  addMetaObject: (one: Partial<MetaObject>, silent?: boolean | undefined, overPremium?: boolean | undefined) => Promise<MetaObject>
  updateMetaObject: (one: PartialWithId<MetaObject>, silent?: boolean | undefined) => Promise<MetaObject | undefined>
  deleteMetaObject: (id: number, silent?: boolean | undefined, force?: boolean | undefined) => Promise<boolean>
  addMetaLink: (one: Partial<MetaLink>, silent?: boolean | undefined, overPremium?: boolean | undefined) => Promise<MetaLink>
  deleteMetaLink: (id: number, silent?: boolean | undefined, force?: boolean | undefined) => Promise<boolean>
  updateMetaLink: (one: PartialWithId<MetaLink>, silent?: boolean | undefined) => Promise<MetaLink | undefined>
  useIndexedMetaObjects: () => IIndexedMetaObjects | undefined
  getIndexedMetaObjects: () => IIndexedMetaObjects | undefined
  useIndexedMetaLinks: () => IIndexedMetaLinks | undefined
  getIndexedMetaLinks: () => IIndexedMetaLinks | undefined
}
