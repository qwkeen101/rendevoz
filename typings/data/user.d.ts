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
  idToken?: string
  refreshToken?: string
  // 本月翻译使用次数
  monthlyTranslateUsed?: number
  // 全部翻译使用次数
  totalTranslateUsed?: number
  // 本月翻译字数
  monthlyTranslateNum?: number
  // 全部翻译字数
  totalTranslateNum?: number
  // 本月ocr次数
  monthlyOcrUsed?: number
  // 全部ocr次数
  totalOcrUsed?: number
}
