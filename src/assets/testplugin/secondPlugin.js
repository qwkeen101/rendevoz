export default api => {
  api.register.registerInSidebarMenu('new type', {
    icon: 'park-notes',
    text: 'hello',
    onClick: () => console.log('hello')
  })
}
