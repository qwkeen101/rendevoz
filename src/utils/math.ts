/**
 * get k and b of a binary equation
 */

export const binaryEquationGetKB = (x1: number, y1: number, x2: number, y2: number) => {
  const k = (y1 - y2) / (x1 - x2)
  const b = (x1 * y2 - x2 * y1) / (x1 - x2)
  return { k, b }
}

/**
 * ax^2 + bx + c = 0
 */
export const quadEquationGetX = (a: number, b: number, c: number) => {
  const xArr = []
  const result = Math.pow(b, 2) - 4 * a * c
  if (result > 0) {
    xArr.push((-b + Math.sqrt(result)) / (2 * a))
    xArr.push((-b - Math.sqrt(result)) / (2 * a))
  } else if (result == 0) {
    xArr.push(-b / (2 * a))
  }
  return xArr
}
