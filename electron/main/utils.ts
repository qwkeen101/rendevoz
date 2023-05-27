import { createHash } from 'node:crypto'
export const digestBuffer = (buffer: Buffer) => {
  return createHash('md5').update(buffer).digest('hex')
}
