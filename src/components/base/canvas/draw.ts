type Point = {
  x: number;
  y: number;
};

export const drawQuadraticBezierCurve = (
  points: Point[],
  beginPoint: Point,
  ctx?: CanvasRenderingContext2D
) => {
  const currList = points.slice(0, 4);
  const [p0, p1, p2, p3] = currList.reverse();
  const c1 = {
    x: (p0.x + p1.x) / 2,
    y: (p0.y + p1.y) / 2,
  };
  const c2 = {
    x: (c1.x + p2.x) / 2,
    y: (c1.y + p2.y) / 2,
  };
  const controlPoint = {
    x: (beginPoint.x + c1.x) / 2,
    y: (beginPoint.y + c1.y) / 2,
  };
  const endPoint = {
    x: (controlPoint.x + c2.x) / 2,
    y: (controlPoint.y + c2.y) / 2,
  };
  //   ctx.beginPath()
  //   ctx.moveTo(beginPoint.x, beginPoint.y)
  //   ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, endPoint.x, endPoint.y)
  //   ctx.stroke()
  //   ctx.closePath()
  return {
    currList,
    controlPoint,
    endPoint,
    beginPoint,
  };
};
