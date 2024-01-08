import KeyvalueStore from '@/api/stores/keyvalue.store'

export default () => {
  const askAIHistory = KeyvalueStore.useValue('AIChatHistory') ?? {}
}