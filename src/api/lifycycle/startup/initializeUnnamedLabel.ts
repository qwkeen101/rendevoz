import { useDb } from '@/hooks'
import semver from 'semver'
import { ILabel, MetaObject } from '~/typings'
import { normalizeSecondsToTime } from '@/core/components/media/utils'

export default async () => {
  const appVersion = APP_VERSION
  if (semver.lt(appVersion, '0.6.1')) {
    return
  }
  if (localStorage.getItem('LABEL_UPDATED')) return
  // initialize unnamed label with empty name and placeholder name
  const metaDb = useDb('metaObjects')
  const objectDb = useDb('objects')
  const allUnnamedLabelObjects = (await metaDb.filter(obj => obj.name === 'Unnamed Label').toArray()) as MetaObject[]
  await Promise.all(
    allUnnamedLabelObjects.map(async meta => {
      const objectId = meta.objectId
      if (objectId) {
        const labelObject = (await objectDb.get(objectId)) as ILabel
        if ('selectedText' in labelObject) {
          await metaDb.put({ ...meta, placeholderName: labelObject.selectedText, name: '' }, meta.id)
        }
        if ('time' in labelObject) {
          if (labelObject.time) {
            const normed = normalizeSecondsToTime(labelObject.time)
            await metaDb.put({ ...meta, placeholderName: normed, name: '' }, meta.id)
          }
        }
      }
    })
  )
  localStorage.setItem('LABEL_UPDATED', 'true')
}
