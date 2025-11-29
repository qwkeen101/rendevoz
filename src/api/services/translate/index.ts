import google from './google'
import microsoft from './microsoft'

export default async (query: string, target: string, engine: 'microsoft' | 'google' = 'microsoft') => {
  if (engine === 'google') {
    return await google(query, target)
  }
  if (engine === 'microsoft') {
    return await microsoft(query, target)
  }
}
