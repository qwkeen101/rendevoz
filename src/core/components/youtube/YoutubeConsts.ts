export default {
  Routers: {
    Library: '/library',
    Loading: '/loading',
    Search: '/search',
    Dashboard: '/dashboard',
    History: '/history'
  },
  Search: {
    Library: 'YOUTUBE_SEARCH',
    History: 'YOUTUBE_HISTORY',
    Folder: (id: number) => `YOUTUBE_FOLDER_${id}`
  }
}
