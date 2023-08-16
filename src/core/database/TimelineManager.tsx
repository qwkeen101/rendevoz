import { MetaStore } from '@/stores'
import { memo, useMemo, useState } from 'react'
import { DateFormat } from '@/utils'
import HeatMap from '@uiw/react-heat-map'
import { Content, Icon, Tooltip as ToolTip } from '@/components'
import { ObjectTimeline, useRenderObject } from '@/core'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Sector } from 'recharts'
import { Colors } from '@/consts'
import FontSize from '@/consts/font'
import { ClassName } from 'rendevoz'
import _ from 'lodash'
import { Rendevoz } from '@/core/rendevoz'
import { css } from '@emotion/css'
import { useTranslation } from 'react-i18next'
import { useMeasure } from 'react-use'
const TimelineManager = () => {
  const [ref, { width }] = useMeasure()
  const { t } = useTranslation()
  return (
    <Content
      ref={ref}
      fullWidth
      flex
      gap={24}
      style={{ padding: 30, height: 'auto', alignItems: 'stretch', justifyContent: 'center', margin: 'auto' }}
    >
      <Content flex column gap={24} style={{ flex: '1 1 800px', maxWidth: 'min(100%, 900px)', justifyContent: 'space-between' }}>
        <MostObjectsRank />
        <div className={ClassName.title(FontSize['16px'])} style={{ position: 'absolute', left: 0, top: -60 }}>
          {t('general.Overview')}
        </div>
        <Content flex fullWidth gap={24} style={{ flexWrap: width > 900 ? undefined : 'wrap' }}>
          <RecentObjectsChart />
          <RecentLinksChart />
        </Content>
        <CreateHeatMap />
      </Content>
      {width >= 1200 && <RecentlyVisitedObjects />}
    </Content>
  )
}
const monthTime = 30 * 24 * 60 * 60 * 1000
const RecentObjectsChart = memo(() => {
  const allObjects = MetaStore.useMetaObjectsMap()
  const { t } = useTranslation()
  const dateMap = useMemo(() => {
    const now = Date.now()
    const recentOneMonthObjects = Array.from(allObjects.values()).filter(i => Math.abs(now - i.createdAt) < monthTime)
    // y-m-d -> metaId array
    const dateMap = new Map<string, number[]>()
    recentOneMonthObjects.forEach(i => {
      const formattedCreate = DateFormat.format(i.createdAt, DateFormat.Formats.default)
      const arr = dateMap.get(formattedCreate) || []
      arr.push(i.id)
      dateMap.set(formattedCreate, arr)
    })
    return dateMap
  }, [allObjects])
  const data = useMemo(() => {
    return Array.from(dateMap.entries()).map(i => ({
      name: i[0],
      count: i[1].length
    }))
  }, [dateMap])

  return (
    <Content
      flex
      column
      gap={20}
      style={{
        padding: 20,
        flex: '1 1 400px',
        width: 0,
        maxWidth: '100%',
        border: `1px solid ${Colors.Background.Border}`,
        borderRadius: 20
      }}
    >
      <div className={ClassName.title(FontSize['14px'])}>{t('general.objects created in the last month')}</div>
      <ResponsiveContainer width={'100%'} aspect={21 / 9}>
        <LineChart
          width={300}
          height={200}
          data={data}
          margin={{
            left: 0,
            top: 0,
            bottom: 0,
            right: 20
          }}
        >
          <XAxis axisLine={false} tickLine={false} dataKey="name" fontSize="0.8rem" height={25} />
          <YAxis tickLine={false} width={25} axisLine={{ stroke: Colors.Background.Border }} fontSize="0.8rem" />
          <CartesianGrid horizontal={true} vertical={false} stroke={Colors.Background.Border} />
          <Line strokeWidth={2} dot={false} type={'linear'} dataKey="count" stroke={Colors.Font.Primary} />
        </LineChart>
      </ResponsiveContainer>
    </Content>
  )
})

const RecentLinksChart = memo(() => {
  const allLinks = MetaStore.useMetaLinksMap()
  const dateMap = useMemo(() => {
    const now = Date.now()
    const recentOneMonthObjects = Array.from(allLinks.values()).filter(i => Math.abs(now - i.createdAt) < monthTime)
    // y-m-d -> metaId array
    const dateMap = new Map<string, number[]>()
    recentOneMonthObjects.forEach(i => {
      const formattedCreate = DateFormat.format(i.createdAt, DateFormat.Formats.default)
      const arr = dateMap.get(formattedCreate) || []
      arr.push(i.id)
      dateMap.set(formattedCreate, arr)
    })
    return dateMap
  }, [allLinks])
  const { t } = useTranslation()
  const data = useMemo(() => {
    return Array.from(dateMap.entries()).map(i => ({
      name: i[0],
      count: i[1].length
    }))
  }, [dateMap])
  return (
    <Content
      flex
      column
      gap={20}
      style={{
        padding: 20,
        maxWidth: '100%',
        flex: '1 1 400px',
        width: 0,
        border: `1px solid ${Colors.Background.Border}`,
        borderRadius: 20
      }}
    >
      <div className={ClassName.title(FontSize['14px'])}>{t('general.links created in the last month')}</div>
      <ResponsiveContainer width={'100%'} aspect={21 / 9}>
        <LineChart
          width={300}
          height={200}
          data={data}
          margin={{
            left: 0,
            top: 0,
            bottom: 0,
            right: 20
          }}
        >
          <XAxis axisLine={false} tickLine={false} dataKey="name" fontSize="0.8rem" height={25} />
          <YAxis tickLine={false} width={25} axisLine={{ stroke: Colors.Background.Border }} fontSize="0.8rem" />
          <CartesianGrid horizontal={true} vertical={false} stroke={Colors.Background.Border} />
          <Line strokeWidth={2} dot={false} type={'linear'} dataKey="count" stroke={Colors.Font.Primary} />
        </LineChart>
      </ResponsiveContainer>
    </Content>
  )
})

const MostObjectsRank = memo(() => {
  const index = MetaStore.useIndexedMetaObjects()
  const [activeIndex, setActiveIndex] = useState(0)
  const objectsRankedByType = useMemo(() => {
    if (index?.typeToMetaObjectIdsMap) {
      const rank = Array.from(index.typeToMetaObjectIdsMap.entries()).map(i => ({ type: i[0], count: i[1].size }))
      const sorted = _.sortBy(rank, rank => rank.count).reverse()
      return sorted
    }
  }, [index?.typeToMetaObjectIdsMap])
  const { t } = useTranslation()
  const renderActiveShape = props => {
    const RADIAN = Math.PI / 180
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props
    const sin = Math.sin(-RADIAN * midAngle)
    const cos = Math.cos(-RADIAN * midAngle)
    const sx = cx + (outerRadius + 10) * cos
    const sy = cy + (outerRadius + 10) * sin
    const mx = cx + (outerRadius + 30) * cos
    const my = cy + (outerRadius + 30) * sin
    const ex = mx + (cos >= 0 ? 1 : -1) * 22
    const ey = my
    const textAnchor = cos >= 0 ? 'start' : 'end'

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={Colors.Font.Primary}>
          {Rendevoz.Utils.Meta.getTypeName(payload.type)}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill={Colors.Font.Primary}>
          {Rendevoz.Utils.Meta.getTypeName(payload.type)}
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
          {payload.count}
        </text>
      </g>
    )
  }

  return (
    <Content
      style={{
        border: `1px solid ${Colors.Background.Border}`,
        borderRadius: 20,
        gridColumn: '1/-1',
        padding: 20,
        width: '100%',
        height: 'fit-content'
      }}
    >
      <div className={ClassName.title(FontSize['14px'])}>{t('general.overview')}</div>
      <Content flex gap={60} alignItems="center" style={{ padding: '24px 0px', flexWrap: 'wrap' }}>
        <PieChart
          style={{ overflow: 'visible', margin: 'auto' }}
          className={css({
            svg: {
              overflow: 'visible'
            }
          })}
          width={250}
          height={180}
        >
          <Pie
            data={objectsRankedByType}
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
            paddingAngle={3}
            stroke={'transparent'}
            onMouseEnter={(e, idx) => {
              setActiveIndex(idx)
            }}
          />
        </PieChart>

        <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', flex: '1 1 400px', height: 'fit-content' }}>
          {objectsRankedByType?.map(r => (
            <Content flex alignItems={'center'} justifyContent="space-between" style={{ padding: '0px 16px 8px 0px' }}>
              <Content flex gap={10}>
                <Icon name={Rendevoz.Utils.Object.getMetaObjectIcon(r.type)} />
                <span style={{ textTransform: 'capitalize' }}>{Rendevoz.Utils.Meta.getTypeName(r.type)}</span>
              </Content>
              <span style={{ color: Colors.Font.Description }}>{r.count}</span>
            </Content>
          ))}
        </div>
      </Content>
    </Content>
  )

  return null
})

const MetaRenderer = ({ metaId }: { metaId: number }) => {
  const { renderWhole, metaObject } = useRenderObject({
    metaObjectId: metaId
  })
  const [mouseIn, setMouseIn] = useState(false)
  return (
    <Content
      onPointerMove={() => {
        setMouseIn(true)
      }}
      onPointerLeave={() => {
        setMouseIn(false)
      }}
      flex
      style={{
        flexWrap: 'wrap-reverse',
        width: '100%',
        borderRadius: 6,
        flexShrink: 0,
        alignItems: 'stretch',
        overflow: 'hidden',
        border: `1px solid ${Colors.Background.Border}`,
        minHeight: 80
      }}
    >
      <div
        style={{
          flex: '4 1 180px',
          overflow: 'hidden',
          padding: '12px 14px 12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        {renderWhole({
          columnGap: 3,
          optionOptions: {
            style: {
              top: -5,
              right: 0
            }
          },
          titleOptions: {
            ellipsisLine: 1,
            renderWebpageFrom: false,
            style: {
              fontSize: FontSize['13px']
            }
          },
          descriptionOptions: {
            ellipsisLine: 2,
            style: {
              fontSize: FontSize['11px']
            }
          },
          renderOptions: {
            renderFrom: false,
            renderImage: false,
            renderOption: mouseIn ? true : false
          }
        })}
      </div>
      {metaObject?.coverImgSrc && (
        <div
          style={{
            flex: '1 1 180px',
            position: 'relative'
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0
            }}
          >
            <img
              style={{
                objectFit: 'cover',
                borderRadius: 1,
                width: '100%',
                height: '100%'
              }}
              src={metaObject.coverImgSrc}
            />
          </div>
        </div>
      )}
    </Content>
  )
}
const RecentlyVisitedObjects = memo(() => {
  const allObjects = MetaStore.useMetaObjectsMap()
  const { t } = useTranslation()
  const recentlyVisited = useMemo(() => {
    const sorted = _.sortBy(
      Array.from(allObjects.values()).filter(i => i.viewAt),
      i => i.viewAt
    )
      .reverse()
      .slice(0, 10)
    return sorted
  }, [allObjects])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: 24,
        border: `1px solid ${Colors.Background.Border}`,
        borderRadius: 20,
        minWidth: 400,
        flex: '0 1 740px',
        maxHeight: '900px',
        overflowY: 'auto'
      }}
    >
      <div className={ClassName.title(FontSize['14px'])}>{t('general.Recently viewed objects')}</div>
      {recentlyVisited.map(i => (
        <MetaRenderer metaId={i.id} key={i.id} />
      ))}
    </div>
  )
})
const CreateHeatMap = memo(() => {
  const allObjects = MetaStore.useMetaObjectsMap()
  const allLinks = MetaStore.useMetaLinksMap()
  const { t } = useTranslation()
  const { grouped, normalized } = useMemo(() => {
    const normalizedToDayCreate: Record<
      string,
      {
        object: number
        link: number
      }
    > = {}
    Array.from(allObjects.values()).forEach(i => {
      const create = i.createdAt
      const res = DateFormat.format(create, 'y/M/d')
      const current = (normalizedToDayCreate[res]?.object || 0) + 1
      normalizedToDayCreate[res] = {
        ...normalizedToDayCreate[res],
        object: current
      }
    })
    Array.from(allLinks.values()).forEach(i => {
      const create = i.createdAt
      const res = DateFormat.format(create, 'y/M/d')
      const current = (normalizedToDayCreate[res]?.link || 0) + 1
      normalizedToDayCreate[res] = {
        ...normalizedToDayCreate[res],
        link: current
      }
    })
    const value = []
    Object.keys(normalizedToDayCreate).forEach(k => {
      value.push({
        date: k,
        count: (normalizedToDayCreate[k].link || 0) + (normalizedToDayCreate[k].object || 0)
      })
    })
    return {
      grouped: value,
      normalized: normalizedToDayCreate
    }
  }, [allObjects, allLinks])
  const lastYear = useMemo(() => {
    const date = new Date(Date.now())
    date.setFullYear(date.getFullYear() - 1)
    return date.getTime()
  }, [])
  const { linkCount, objectCount } = useMemo(() => {
    let linkCount = 0
    let objectCount = 0
    allObjects.forEach(i => i.createdAt > lastYear && (objectCount += 1))
    allLinks.forEach(i => i.createdAt > lastYear && (linkCount += 1))
    return { linkCount, objectCount }
  }, [allLinks, allObjects, lastYear])
  return (
    <Content
      flex
      column
      gap={16}
      style={{
        gridColumn: '1/-1',
        padding: 20,
        width: '100%',
        border: `1px solid ${Colors.Background.Border}`,
        borderRadius: 20,
        height: 'fit-content'
      }}
    >
      <div className={ClassName.title(FontSize['14px'])}>
        {t('general.objects and links created in last year', { object: objectCount, link: linkCount })}
      </div>
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <HeatMap
          rectSize={10}
          startDate={new Date(lastYear)}
          style={{
            height: 120,
            overflow: 'visible',
            color: Colors.Font.Primary,
            '--rhm-rect-active': '#BEADFA',
            '--rhm-rect': Colors.Background.ButtonHover,
            minWidth: '100%'
          }}
          width={700}
          value={grouped}
          rectRender={(props, data) => {
            const value = normalized[data.date]
            return (
              <ToolTip
                delay={200}
                content={
                  <div>
                    {value ? (
                      <span>
                        {value.object && `${value.object} objects `}
                        {value.link && `${value.link} links`} are created in {data.date}
                      </span>
                    ) : (
                      <span>No objects created in {data.date}</span>
                    )}
                  </div>
                }
              >
                <rect {...props} rx={2} />
              </ToolTip>
            )
          }}
          panelColors={{
            0: Colors.Background.ButtonHover,
            1: '#DFCCFB',
            15: '#D0BFFF',
            30: '#BEADFA',
            45: '#BA90C6'
          }}
        />
      </div>

      <a
        onClick={() => {
          Rendevoz.Actions.Layout.openNewTab({ data: { type: 'timeline' } })
        }}
        style={{
          marginLeft: 'auto',
          color: Colors.Font.Link,
          fontSize: FontSize['12px'],
          cursor: 'pointer',
          width: 'fit-content',
          display: 'block'
        }}
      >
        See more info in timeline.
      </a>
    </Content>
  )
})
export default TimelineManager
