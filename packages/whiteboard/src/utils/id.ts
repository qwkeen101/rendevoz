let seed = Date.now()

export const nextId = () => {
  seed += 1
  return seed
}
