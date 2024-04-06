import KeyvalueStore from '@/api/stores/keyvalue.store'

export default () => {
  return (
    KeyvalueStore.useValue('sidebarState') || {
      leftOpen: false,
      leftWidth: 240,
      leftVisible: 'database'
    }
  )
}
