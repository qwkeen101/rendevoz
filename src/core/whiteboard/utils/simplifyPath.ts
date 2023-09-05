import { Path, default as Paper, Size } from 'paper'

Paper.setup(new Size(1, 1))
Paper.view.autoUpdate = false

const simplifyPath = (points: number[][]) => {
  const xyToPressuremap = new Map<string, number>()
  const path = new Path({
    strokeColor: 'black',
    closed: false
  })
  points.forEach(p => {
    const [x, y, pressure] = p
    xyToPressuremap.set(`${x}_${y}`, pressure)
    path.add([x, y])
  })
  path.simplify()
  return path.segments.map(i => {
    const { x, y } = i.point
    // default pressure
    const pressure = xyToPressuremap.get(`${x}_${y}`) || 0.5
    return [x, y, pressure]
  })
}

export default simplifyPath
