export interface IUser {
  username?: string
  uid?: string
  password?: string
  email?: string
  emailVerified?: boolean
  displayName?: string
  photoURL?: string
  disabled?: boolean
  metadata?: {
    lastSignInTime?: Date
    creationTime?: Date
    lastRefreshTime?: Date
  }
  isPremium?: boolean
  premiumStartDate?: number
  premiumEndDate?: number
  jwtToken?: any
}
