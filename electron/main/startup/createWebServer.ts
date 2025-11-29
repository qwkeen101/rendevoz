import { createServer } from 'http'
export default () => {
  const server = createServer((req, res) => {
    if (req.url === '/hello') {
      res.end('123')
    }
  })
  server.listen(7071)
}
