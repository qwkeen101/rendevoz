// one english letter = 0.2 token, one chinese letter = 0.5token
export default (
  input: string,
  options?: {
    maxReturnLength?: number
    agent?: string
  }
) => {
  const normalized = input.replace(/\s*|\t|\r|\n/gm, '')
  let count = 0
  for (let i = 0, len = normalized.length; i < len; i++) {
    count += normalized.charCodeAt(i) < 256 ? 0.2 : 0.5
  }

}
