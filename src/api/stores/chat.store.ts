import { ObjectStore } from '@/api/stores/index'

export default {
  clearHistory: async (id: number) => {
    const chat = await ObjectStore('chat').getOneById(id)
    if (chat) {
      await ObjectStore('chat').updateOne({ id, messages: [] })
    }
  }
}
