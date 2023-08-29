self.addEventListener('activate', function (event) {
  // console.log('Claiming control')
  return self.clients.claim()
})

self.addEventListener('fetch', e => {
  // console.log(e.request.url)
})
