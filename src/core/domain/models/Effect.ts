/**
 * 効果の種類を定義する列挙型
 * ステート、スキル、コマンドの効果処理で使用
 */
export enum EffectType {
  /** 国力増 */
  POWER_GAIN = 'POWER_GAIN',
  /** 国力減 */
  POWER_LOSS = 'POWER_LOSS',
  /** 内政回数増 */
  ACTION_GAIN = 'ACTION_GAIN',
  /** 内政回数減 */
  ACTION_LOSS = 'ACTION_LOSS',
  /** ユニット最大HP増 */
  UNIT_MAX_HP_GAIN = 'UNIT_MAX_HP_GAIN',
  /** ユニット最大HP減 */
  UNIT_MAX_HP_LOSS = 'UNIT_MAX_HP_LOSS',
  /** ユニットHP増 */
  UNIT_HP_GAIN = 'UNIT_HP_GAIN',
  /** ユニットHP減 */
  UNIT_HP_LOSS = 'UNIT_HP_LOSS',
  /** ユニット攻撃力増 */
  UNIT_ATTACK_GAIN = 'UNIT_ATTACK_GAIN',
  /** ユニット攻撃力減 */
  UNIT_ATTACK_LOSS = 'UNIT_ATTACK_LOSS',
  /** ステート付与 */
  ADD_STATE = 'ADD_STATE',
  /** ステート除去 */
  REMOVE_STATE = 'REMOVE_STATE',
  /** ユニット召喚 */
  SUMMON_UNIT = 'SUMMON_UNIT',
  /** ユニット移動 */
  MOVE_UNIT = 'MOVE_UNIT',
  /** ユニット破壊 */
  DESTROY_UNIT = 'DESTROY_UNIT',
  /** 蘇生 */
  REVIVE_UNIT = 'REVIVE_UNIT',
  /** コマンド追加 */
  ADD_COMMAND = 'ADD_COMMAND',
  /** コマンド除去 */
  REMOVE_COMMAND = 'REMOVE_COMMAND',
}

/**
 * 効果の演出種類を定義する列挙型
 */
export enum VisualType {
  /** 演出なし */
  NONE = 'NONE',
  /** ダメージ演出 */
  DAMAGE = 'DAMAGE',
  /** 回復演出 */
  HEAL = 'HEAL',
  /** バフ演出 */
  BUFF = 'BUFF',
  /** デバフ演出 */
  DEBUFF = 'DEBUFF',
  /** 召喚演出 */
  SUMMON = 'SUMMON',
  /** 消滅演出 */
  DESTROY = 'DESTROY',
}

/**
 * 効果の対象を定義する列挙型
 */
export enum EffectTarget {
    /** 自身（ユニット） */
    SELF_UNIT = 'SELF_UNIT',
    /** 自国の戦線 */
    SELF_BATTLELINE = 'SELF_BATTLELINE',
    /** 自国のベンチ */
    SELF_BENCH = 'SELF_BENCH',
    /** 自国の全ユニット */
    SELF_ALL_UNITS = 'SELF_ALL_UNITS',
    /** 自身（国家） */
    SELF_NATION = 'SELF_NATION',
    /** 対象ユニット */
    TARGET_UNIT = 'TARGET_UNIT',
    /** 対象の戦線 */
    TARGET_BATTLELINE = 'TARGET_BATTLELINE',
    /** 対象のベンチ */
    TARGET_BENCH = 'TARGET_BENCH',
    /** 対象国の全ユニット */
    TARGET_ALL_UNITS = 'TARGET_ALL_UNITS',
    /** 対象国家 */
    TARGET_NATION = 'TARGET_NATION',
    /** 全敵国の前衛 */
    ALL_ENEMY_BATTLELINE = 'ENEMY_BATTLELINE',
    /** 全敵国のベンチ */
    ALL_ENEMY_BENCH = 'ENEMY_BENCH',
    /** 全敵国の全ユニット */
    ALL_ENEMY_UNITS = 'ALL_ENEMY_UNITS',
    /** 全敵国家 */
    ALL_ENEMY_NATION = 'ALL_ENEMY_NATION',
    /** 全国家の前衛 */
    ALL_BATTLELINE = 'ALL_BATTLELINE',
    /** 全国家のベンチ */
    ALL_BENCH = 'ALL_BENCH',
    /** 全国家の全ユニット */
    ALL_UNITS = 'ALL_UNITS',
    /** 全国家 */
    ALL_NATIONS = 'ALL_NATIONS',
}

/**
 * 効果値の種類を定義する列挙型
 */
export enum ValueType {
  /** 固定値 */
  FIXED = 'FIXED',
  /** 割合（%） */
  PERCENTAGE = 'PERCENTAGE',
  /** 攻撃力依存 */
  ATTACK_BASED = 'ATTACK_BASED',
  /** HP依存 */
  HP_BASED = 'HP_BASED',
  /** 国力依存 */
  POWER_BASED = 'POWER_BASED',
}

/**
 * 効果データ構造
 * スキル、ステート、コマンドの効果を表現
 */
export interface Effect {
  /** 効果種類 */
  effectType: EffectType;
  /** 効果演出種類 */
  visualType: VisualType;
  /** 対象種類 */
  target: EffectTarget;
  /** 効果値種類 */
  valueType: ValueType;
  /** 効果値 */
  value: number;
}
