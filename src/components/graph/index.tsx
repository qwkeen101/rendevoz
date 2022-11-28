import * as echarts from 'echarts/core'
import { GraphChart } from 'echarts/charts'
import { GraphicComponent, GridComponent, DataZoomComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import GraphContainer from './components/GraphContainer'

echarts.use([GraphChart, CanvasRenderer, GraphicComponent, GridComponent, DataZoomComponent])
const data = [
  {
    id: '1',
    name: 'Node 1',
    value: [100, 200]
  },
  {
    id: '2',
    name: 'Node 2',
    value: [800, 300]
  },
  {
    id: '3',
    name: 'Node 3',
    value: [550, 100]
  },
  {
    id: '4',
    name: 'Node 4',
    value: [550, 400]
  }
]
const option = {
  animationDurationUpdate: 400,
  animationEasingUpdate: 'cubicOut',
  animation: true,
  xAxis: {
    min: 0,
    max: 1000,
    show: false,
    axisLine: { onZero: false }
  },
  yAxis: {
    min: 0,
    max: 1000,
    show: false,
    axisLine: { onZero: false }
  },
  dataZoom: [
    {
      type: 'inside',
      xAxisIndex: 0,
      filterMode: 'empty'
    },
    {
      type: 'inside',
      yAxisIndex: 0,
      filterMode: 'empty'
    }
  ],
  series: [
    {
      id: 'a',
      type: 'graph',
      layout: 'none',
      symbolSize: 30,
      coordinateSystem: 'cartesian2d',
      center: [0, 0],
      roam: false,
      silent: true,
      emphasis: {
        scale: 1.3,
        focus: 'adjacency'
      },
      edgeSymbol: ['circle', 'arrow'],
      edgeSymbolSize: [4, 10],
      edgeLabel: {
        fontSize: 20
      },
      data: data,
      links: [
        {
          source: 0,
          target: 1,
          symbolSize: [5, 5]
        }
      ],
      label: {
        show: true,
        position: 'bottom'
      },
      lineStyle: {
        opacity: 0.9,
        width: 2,
        curveness: 0.2
      }
    }
  ]
}

const d3Nodes = [
  {
    id: 1
  },
  {
    id: 2
  },
  {
    id: 3
  },
  {
    id: 4
  },
  {
    id: 5
  },
   {
    id: 6
  },
  {
    id: 7
  },
  {
    id: 8
  },
  {
    id: 9
  },
  {
    id: 10
  }
]

const d3Edges = [
  {
    id: 1,
    sourceId: 1,
    targetId: 2
  },
  {
    id: 2,
    sourceId: 1,
    targetId: 3
  }
]
export const GraphTest = () => {
  return (
    <>
      <GraphContainer edges={d3Edges} nodes={d3Nodes} />
    </>
  )
}
