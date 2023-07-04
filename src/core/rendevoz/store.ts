import { NoteStore } from '@/stores'
import { SearchStore } from '@/stores/search.store'

const Store = {
  NoteStore: () => NoteStore,
  SearchStore: () => SearchStore
}

export default Store
