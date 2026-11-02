import { IUser } from '~/typings/data'

/**
 * Local accounts, used while there is no account server
 * (OFFICIAL_BACKEND_ENABLED is off). Accounts live in this computer's
 * localStorage only and are never uploaded or synced. Passwords are stored as
 * PBKDF2-SHA256 hashes with a random salt, never in plain text. A forgotten
 * password cannot be recovered. Notes and other data are shared by all local
 * accounts, the same as with the old online accounts.
 */

type LocalAccount = {
  uid: string
  username: string
  displayName: string
  photoURL?: string
  salt: string
  hash: string
  iterations: number
  createdAt: number
}

const ACCOUNTS_KEY = 'rd_local_accounts'
const SESSION_KEY = 'rd_local_session'
const ITERATIONS = 210000
export const LOCAL_PASSWORD_MIN_LENGTH = 6

export class LocalAuthError extends Error {
  constructor(public code: 'usernameInvalid' | 'usernameTaken' | 'passwordTooShort' | 'wrongCredentials' | 'wrongPassword' | 'noAccount') {
    super(code)
  }
}

const toBase64 = (buf: ArrayBuffer | Uint8Array) => {
  let s = ''
  new Uint8Array(buf).forEach(b => (s += String.fromCharCode(b)))
  return btoa(s)
}
const fromBase64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0))

const hashPassword = async (password: string, salt: Uint8Array, iterations: number) => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256)
  return toBase64(bits)
}

const readAccounts = (): LocalAccount[] => {
  try {
    const list = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]')
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}
const writeAccounts = (list: LocalAccount[]) => localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list))
const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

const findByUid = (uid?: string) => readAccounts().find(i => i.uid === uid)

const checkPassword = async (account: LocalAccount, password: string) =>
  (await hashPassword(password, fromBase64(account.salt), account.iterations)) === account.hash

const newPasswordFields = async (password: string) => {
  if (password.length < LOCAL_PASSWORD_MIN_LENGTH) throw new LocalAuthError('passwordTooShort')
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return { salt: toBase64(salt), hash: await hashPassword(password, salt, ITERATIONS), iterations: ITERATIONS }
}

const toUser = (a: LocalAccount): IUser => ({
  uid: a.uid,
  username: a.username,
  displayName: a.displayName || a.username,
  photoURL: a.photoURL,
  metadata: { creationTime: new Date(a.createdAt) }
})

const LocalAuth = {
  hasAccounts: () => readAccounts().length > 0,

  register: async (username: string, password: string, displayName?: string): Promise<IUser> => {
    const name = username.trim()
    if (name.length < 2 || name.length > 32) throw new LocalAuthError('usernameInvalid')
    const list = readAccounts()
    if (list.some(i => sameName(i.username, name))) throw new LocalAuthError('usernameTaken')
    const account: LocalAccount = {
      uid: crypto.randomUUID(),
      username: name,
      displayName: displayName?.trim() || name,
      createdAt: Date.now(),
      ...(await newPasswordFields(password))
    }
    writeAccounts([...list, account])
    localStorage.setItem(SESSION_KEY, account.uid)
    return toUser(account)
  },

  login: async (username: string, password: string): Promise<IUser> => {
    const account = readAccounts().find(i => sameName(i.username, username))
    if (!account || !(await checkPassword(account, password))) throw new LocalAuthError('wrongCredentials')
    localStorage.setItem(SESSION_KEY, account.uid)
    return toUser(account)
  },

  /** The account that stayed signed in last time, if it still exists. */
  restoreSession: (): IUser | undefined => {
    const account = findByUid(localStorage.getItem(SESSION_KEY) ?? undefined)
    if (account) return toUser(account)
    localStorage.removeItem(SESSION_KEY)
  },

  logout: () => localStorage.removeItem(SESSION_KEY),

  updateProfile: (uid: string | undefined, patch: Pick<IUser, 'displayName' | 'photoURL'>) => {
    const list = readAccounts()
    const account = list.find(i => i.uid === uid)
    if (!account) throw new LocalAuthError('noAccount')
    if (patch.displayName !== undefined) account.displayName = patch.displayName.trim() || account.username
    if (patch.photoURL !== undefined) account.photoURL = patch.photoURL
    writeAccounts(list)
    return toUser(account)
  },

  changePassword: async (uid: string | undefined, current: string, next: string) => {
    const list = readAccounts()
    const account = list.find(i => i.uid === uid)
    if (!account) throw new LocalAuthError('noAccount')
    if (!(await checkPassword(account, current))) throw new LocalAuthError('wrongPassword')
    Object.assign(account, await newPasswordFields(next))
    writeAccounts(list)
  },

  deleteAccount: (uid: string | undefined) => {
    writeAccounts(readAccounts().filter(i => i.uid !== uid))
    if (localStorage.getItem(SESSION_KEY) === uid) localStorage.removeItem(SESSION_KEY)
  }
}

export default LocalAuth
