import { useNavigate, useLocation } from 'react-router-dom'

export default () => {
  const navigate = useNavigate()
  const location = useLocation()

  const customNavigate = (to, options = {}) => {
    if (location.pathname !== to) {
      navigate(to, options)
    }
  }

  return customNavigate
}
