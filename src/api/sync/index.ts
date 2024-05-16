import DatabaseSync from './db'
import FileSync from './file'
import NoteSync from './note'
import commitSyncOp, { commitManually } from './commitSyncOp'
import pull from './pull'
import cloudClient from './cloudClient'
import { atom } from 'jotai/index'
import restoreFromDB from './restoreFromDB'
import resolveConflict from './cloudClient/resolveConflict'
const Colors = {
  green: 'rgb(117,195,58)',
  red: 'rgb(255, 86, 86)',
  yellow: 'rgb(255,189,86)',
  grey: 'var(--font-s-transparent)'
}
type Connection = 'connected' | 'unconnected' | 'wrong config' | 'syncing'
const SyncAPI = {
  database: DatabaseSync,
  file: FileSync,
  note: NoteSync,
  resolveConflict,
  restoreFromDB,
  commitSyncOp,
  cloudClient,
  commitLocalTransactions: commitManually,
  pull,
  colors: Colors,
  connectionToText: {
    connected: 'Connected',
    syncing: 'Syncing',
    unconnected: 'Unconnected',
    'wrong config': 'Invalid config'
  } as Record<Connection, string>,
  connectionToColors: {
    connected: Colors['green'],
    syncing: Colors['yellow'],
    unconnected: Colors['red'],
    'wrong config': Colors['grey']
  } as Record<Connection, string>,
  stateAtom: atom<{
    uploading: Record<string, { name: string; size: number; progress: number; skiped?: boolean }>
    downloading: Record<string, { name: string; size: number; progress: number }>
    connection: Connection
    lastSynced?: number
  }>({
    uploading: {},
    downloading: {},
    connection: 'unconnected'
  })
}
export default SyncAPI
