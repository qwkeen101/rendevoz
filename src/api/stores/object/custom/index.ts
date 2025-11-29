import WhiteboardStore from './WhiteboardStore'
import CodeStore from './CodeStore'
import NoteStore from './NoteStore'
import QuestionStore from './QuestionStore'
import { IStore, ObjectFamily } from '~/typings'
import WebpageStore from './WebpageStore'
import MessageStore from './MessageStore'
import ChatStore from './ChatStore'
import CollectionStore from './CollectionStore'
import GroupStore from './GroupStore'
import TagStore from './TagStore'
import ExamQuestionStore from './ExamQuestionStore'
import ReviewCardStore from './ReviewCardStore'
import OptionStore from './OptionStore'
import FeedCollectionStore from './FeedCollectionStore'
type K = keyof ObjectFamily
const CustomStores: Partial<Record<K, () => IStore<K>>> = {
  whiteboard: WhiteboardStore,
  code: CodeStore,
  note: NoteStore,
  collection: CollectionStore,
  feedCollection: FeedCollectionStore,
  chat: ChatStore,
  webpage: WebpageStore,
  question: QuestionStore,
  message: MessageStore,
  group: GroupStore,
  tag: TagStore,
  examQuestion: ExamQuestionStore,
  reviewCard: ReviewCardStore,
  metaPropSelectOption: OptionStore
}

export default CustomStores
