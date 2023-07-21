import {snowflakeIdv1Option} from './snowflakeIdv1Option';

/**
 *
 */
export declare class SnowflakeIdv1 {
    /**
     * 雪花计算方法，（1-漂移算法|2-传统算法），默认 1
     */
    private readonly Method;
    /**
     * 基础时间（ms 单位），不能超过当前系统时间
     */
    private readonly BaseTime;
    /**
     * 机器码，必须由外部设定，最大值 2^WorkerIdBitLength-1
     */
    private readonly WorkerId;
    /**
     * 机器码位长，默认值 6，取值范围 [1, 15](要求：序列数位长+机器码位长不超过 22)
     */
    private readonly WorkerIdBitLength;
    /**
     * 序列数位长，默认值 6，取值范围 [3, 21](要求：序列数位长+机器码位长不超过 22)
     */
    private readonly SeqBitLength;
    /**
     * 最大序列数（含），设置范围 [MinSeqNumber, 2^SeqBitLength-1]，默认值 0，表示最大序列数取最大值（2^SeqBitLength-1]）
     */
    private readonly MaxSeqNumber;
    /**
     * 最小序列数（含），默认值 5，取值范围 [5, MaxSeqNumber]，每毫秒的前 5 个序列数对应编号 0-4 是保留位，其中 1-4 是时间回拨相应预留位，0 是手工新值预留位
     */
    private readonly MinSeqNumber;
    /**
     * 最大漂移次数（含），默认 2000，推荐范围 500-10000（与计算能力有关）
     */
    private readonly TopOverCostCount;
    /**
     *
     */
    private readonly _TimestampShift;
    /**
     *
     */
    private _CurrentSeqNumber;
    /**
     *
     */
    private _LastTimeTick;
    /**
     * 回拨次序, 支持 4 次回拨次序（避免回拨重叠导致 ID 重复）
     */
    private _TurnBackTimeTick;
    /**
     *
     */
    private _TurnBackIndex;
    /**
     *
     */
    private _IsOverCost;
    /**
     *
     */
    private _OverCostCountInOneTerm;
    /**
     *Creates an instance of Genid.
     * @author zhupengfeivip
     * @param {{
     *     BaseTime: 1577836800000,  // 基础时间（ms 单位），默认2020年1月1日，不能超过当前系统时间，一旦投入使用就不能再更改，更改后产生的ID可能会和以前的重复
     *     WorkerId: Number, // 机器码，必须由外部设定，最大值 2^WorkerIdBitLength-1
     *     WorkerIdBitLength: 6,   // 机器码位长，默认值 6，取值范围 [1, 15](要求：序列数位长+机器码位长不超过 22)
     *     SeqBitLength: 6,   // 序列数位长，默认值 6，取值范围 [3, 21](要求：序列数位长+机器码位长不超过 22)
     *     MaxSeqNumber: 5, // 最大序列数（含），设置范围 [MinSeqNumber, 2^SeqBitLength-1]，默认值 0，表示最大序列数取最大值（2^SeqBitLength-1]）
     *     MinSeqNumber: 5, // 最小序列数（含），默认值 5，取值范围 [5, MaxSeqNumber]，每毫秒的前 5 个序列数对应编号 0-4 是保留位，其中 1-4 是时间回拨相应预留位，0 是手工新值预留位
     *     TopOverCostCount: 2000// 最大漂移次数（含），默认 2000，推荐范围 500-10000（与计算能力有关）
     * }} options
     * @memberof Genid
     */
    constructor(options: snowflakeIdv1Option);
    /**
     * 当前序列号超过最大范围，开始透支使用序号号的通知事件，，本项暂未实现
     * @returns
     */
    private BeginOverCostAction;
    /**
     * 当前序列号超过最大范围，结束透支使用序号号的通知事件，，本项暂未实现
     * @returns
     */
    private EndOverCostAction;
    /**
     * 开始时间回拨通知，本项暂未实现
     * @returns
     */
    private BeginTurnBackAction;
    /**
     * 结束时间回拨通知，本项暂未实现
     * @returns
     */
    private EndTurnBackAction;
    /**
     * 雪花漂移算法
     * @returns
     */
    private NextOverCostId;
    /**
     * 常规雪花算法
     * @returns
     */
    private NextNormalId;
    /**
     * 生成ID
     * @param useTimeTick 时间戳
     * @returns
     */
    private CalcId;
    /**
     * 生成时间回拨ID
     * @returns
     */
    private CalcTurnBackId;
    /**
     *
     * @returns
     */
    private GetCurrentTimeTick;
    /**
     *
     * @returns
     */
    private GetNextTimeTick;
    /**
     * 生成ID
     * @returns 始终输出number类型，超过时throw error
     */
    NextNumber(): number;
    /**
     * 生成ID
     * @returns 根据输出数值判断，小于number最大值时输出number类型，大于时输出bigint
     */
    NextId(): number | bigint;
    /**
     * 生成ID
     * @returns 始终输出bigint类型
     */
    NextBigId(): bigint;
}
