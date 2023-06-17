import { ReactElement } from 'react'
import { toast } from 'react-hot-toast'

const error = ({ message }: { message: string | ReactElement }) => {
  toast.error(message)
}

const info = ({ message }: { message: string | ReactElement }) => {
  toast.success(message)
}

const success = ({ message }: { message: string | ReactElement }) => {
  toast.success(message)
}

const Notification = {
  success,
  info,
  error
}

export default Notification
