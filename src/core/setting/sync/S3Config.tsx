import { Content } from '@/components'
import SettingItem, { ISettingItem } from '@/core/setting/SettingItem'
import SettingGroup from '@/core/setting/SettingGroup'
import { useSetting } from '@/core'

export default () => {
  const [setting, setSetting] = useSetting()
  const items: ISettingItem[] = [
    {
      title: 'Access key',
      type: 'input',
      value: setting.sync.S3Config?.ak,
      onChange: v => setSetting(s => ({ ...s, sync: { ...s.sync, S3Config: { ...s.sync.S3Config, ak: v } } }))
    },
    {
      title: 'Secert key',
      type: 'input',
      value: setting.sync.S3Config?.sk,
      onChange: v => setSetting(s => ({ ...s, sync: { ...s.sync, S3Config: { ...s.sync.S3Config, sk: v } } }))
    },
    {
      title: 'Endpoint',
      type: 'input',
      value: setting.sync.S3Config?.endpoint,
      onChange: v => setSetting(s => ({ ...s, sync: { ...s.sync, S3Config: { ...s.sync.S3Config, endpoint: v } } }))
    },
    {
      title: 'Region',
      type: 'input',
      value: setting.sync.S3Config?.region,
      onChange: v => setSetting(s => ({ ...s, sync: { ...s.sync, S3Config: { ...s.sync.S3Config, region: v } } }))
    },
    {
      title: 'Bucket',
      type: 'input',
      value: setting.sync.S3Config?.bucket,
      onChange: v => setSetting(s => ({ ...s, sync: { ...s.sync, S3Config: { ...s.sync.S3Config, bucket: v } } }))
    }
  ]
  const syncItems: (ISettingItem | undefined)[] = [
    {
      type: 'switch',
      title: 'Enable cloud sync',
      value: !!setting.sync.enableSync,
      onChange: v => {
        setSetting(s => ({ ...s, sync: { ...s.sync, enableSync: v } }))
      }
    },
    ...(setting.sync.enableSync
      ? [
          {
            type: 'switch',
            title: 'Auto sync',
            value: setting.sync.enableAutoSync ?? true,
            onChange: v => {
              setSetting(s => ({ ...s, sync: { ...s.sync, enableAutoSync: v } }))
            }
          },
          setting.sync.enableAutoSync
            ? {
                type: 'select',
                title: 'Sync interval',
                value: setting.sync.syncInterval || '5m',
                options: [
                  { value: '30s', children: '30 seconds' },
                  { value: '1m', children: '1 minute' },
                  { value: '5m', children: '5 minutes' },
                  { value: '30m', children: '30 minutes' },
                  { value: '1h', children: '1 hour' }
                ],
                onChange: v => {
                  setSetting(s => ({ ...s, sync: { ...s.sync, syncInterval: v } }))
                }
              }
            : undefined,
          {
            type: 'select',
            title: 'Sync direction',
            value: setting.sync.syncDirection || 'from local to remote',
            options: [
              { value: 'from local to remote', children: 'Local to remote' },
              { value: 'from remote to local', children: 'Remote to local' }
            ],
            onChange: v => {
              setSetting(s => ({ ...s, sync: { ...s.sync, syncDirection: v } }))
            }
          },
          setting.sync.syncDirection === 'from remote to local'
            ? {
                type: 'switch',
                title: 'Local file protection',
                description: "Local files won't be deleted if cloud files don't exist.",
                value: setting.sync.localProtection,
                onChange: v => {
                  setSetting(s => ({ ...s, sync: { ...s.sync, localProtection: v } }))
                }
              }
            : undefined,
          {
            type: 'input',
            title: 'Max sync file size (MB)',
            value: setting.sync.maxSyncSize,
            onChange: v => {
              setSetting(s => ({ ...s, sync: { ...s.sync, maxSyncSize: v } }))
            }
          }
        ]
      : [])
  ].filter(i => i)
  return (
    <>
      <SettingGroup title={'Cloud sync'} layout={syncItems} />
      {setting.sync.enableSync && <SettingGroup title={'S3 Config'} layout={items} />}
    </>
  )
}
