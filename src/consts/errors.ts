// error code - message
export const Errors = {
  BAIDU_AUTH_ERROR: '',
  BAIDU_WRONG_FILE_PATH_ERROR: '',
  WEB_REQUEST_ERROR: ''
}

export const createError = (key: keyof typeof Errors) => {
  return ''
}

export const ErrorMaker = {
  ...Errors,
  createError
}
