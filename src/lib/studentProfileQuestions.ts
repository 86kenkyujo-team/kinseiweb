export type StudentQuestionField = {
  id: string
  label: string
  choices?: string[]
  maxLength?: number
  multiline?: boolean
}

export type StudentQuestionGroup = {
  title: string
  fields: StudentQuestionField[]
}

export type StudentQuestionLayer = {
  title: string
  groups: StudentQuestionGroup[]
}

export const studentQuestionLayers: StudentQuestionLayer[] = [
  {
    title: '第1層',
    groups: [
      {
        title: '基本情報',
        fields: [
          { id: 'age', label: '年齢' },
          { id: 'mbti', label: 'MBTI（任意）' },
        ],
      },
      {
        title: '3秒で見える性格タグ',
        fields: [
          {
            id: 'personality_tags',
            label: '性格タグ',
            choices: [
              '巻き込み型',
              '内省型',
              '継続型',
              '負けず嫌い',
              'ロジカル',
              '感覚派',
              '安定志向',
              '挑戦志向',
              '体育会系',
              '職人気質',
              '愛されキャラ',
              'リーダー型',
              'サポート型',
            ],
          },
        ],
      },
      {
        title: '企業が最も見る項目',
        fields: [
          { id: 'current_focus', label: '今何を頑張ってる？', maxLength: 140, multiline: true },
          { id: 'future_goal_short', label: '将来やりたいこと', maxLength: 140, multiline: true },
          {
            id: 'company_fit',
            label: 'どんな会社が合う？',
            choices: ['裁量大きい', 'チーム重視', '成果主義', '安定', '成長環境', '体育会系', '論理的', 'フラット'],
          },
        ],
      },
    ],
  },
  {
    title: '第2層 人間性',
    groups: [
      {
        title: 'モチベーション把握',
        fields: [
          { id: 'happiest_experience', label: '人生で一番嬉しかった経験', multiline: true },
          { id: 'most_frustrating_experience', label: '人生で一番悔しかった経験', multiline: true },
          { id: 'when_can_work_hard', label: '頑張れる時ってどんな時？', multiline: true },
          { id: 'demotivating_moment', label: '逆にやる気なくなる瞬間は？', multiline: true },
          { id: 'what_makes_happy', label: '何されると嬉しい？', multiline: true },
        ],
      },
      {
        title: 'ストレス耐性',
        fields: [
          { id: 'when_depressed', label: '落ち込んだ時どうする？', multiline: true },
          { id: 'pressure_tolerance', label: 'プレッシャーには強い？', multiline: true },
          { id: 'mental_down_causes', label: 'メンタルが落ちる原因', multiline: true },
          { id: 'escape_experience', label: '逃げた経験ある？', multiline: true },
        ],
      },
      {
        title: '人間関係',
        fields: [
          { id: 'difficult_people', label: '苦手な人の特徴', multiline: true },
          { id: 'easy_to_get_close_type', label: '仲良くなるタイプ', multiline: true },
          { id: 'friends_say', label: '友達から何て言われる？', multiline: true },
          {
            id: 'team_role',
            label: 'チームでの役割',
            choices: ['リーダー', '裏方', '調整役', '盛り上げ役', '参謀'],
          },
        ],
      },
      {
        title: 'コミュニケーション',
        fields: [
          { id: 'first_meeting', label: '初対面得意？', multiline: true },
          { id: 'line_reply_speed', label: 'LINE返信速度' },
          { id: 'speaking_or_listening', label: '話すのと聞くのどっち得意？' },
          { id: 'group_or_one_on_one', label: '大人数 or 1対1' },
        ],
      },
      {
        title: '意思決定',
        fields: [
          { id: 'intuition_or_logic', label: '直感派 or 論理派' },
          { id: 'biggest_decision', label: '人生で一番大きな決断', multiline: true },
          {
            id: 'decision_priorities',
            label: '決断で重視すること',
            choices: ['ワクワク', '安定', '成長', '人', '給与', '社会性'],
          },
        ],
      },
    ],
  },
  {
    title: '第3層',
    groups: [
      {
        title: '私生活',
        fields: [
          { id: 'favorite_food', label: '好きな食べ物' },
          { id: 'holiday_activity', label: '休日何してる？', multiline: true },
          { id: 'current_obsession', label: '最近ハマってること' },
          { id: 'youtube_content', label: 'YouTube何見る？' },
          { id: 'favorite_artist', label: '好きなアーティスト' },
          { id: 'frequent_apps', label: 'よく使うアプリ' },
          { id: 'recent_laugh', label: '最近笑ったこと', multiline: true },
          { id: 'midnight_thoughts', label: '深夜に考えること', multiline: true },
          { id: 'desert_island_item', label: '無人島に1つ持っていくなら？', multiline: true },
        ],
      },
      {
        title: '価値観',
        fields: [
          { id: 'money_growth_stability', label: 'お金・成長・安定ならどれ重視？' },
          { id: 'ten_billion_yen', label: '10億あったら何する？', multiline: true },
          { id: 'respected_person', label: '尊敬する人' },
          { id: 'disliked_values', label: '嫌いな価値観', multiline: true },
          { id: 'life_values', label: '人生で大切にしたいこと', multiline: true },
        ],
      },
      {
        title: '将来',
        fields: [
          { id: 'five_years_later', label: '5年後どうなってたい？', multiline: true },
          { id: 'ideal_life', label: '最終的にどんな人生にしたい？', multiline: true },
          { id: 'message_to_children', label: '子供にどんな背中見せたい？', multiline: true },
        ],
      },
    ],
  },
]

const allQuestionFields = studentQuestionLayers.flatMap((layer) =>
  layer.groups.flatMap((group) => group.fields),
)

export function normalizeDeepDiveAnswers(value: unknown): Record<string, string | string[]> {
  if (!value) {
    return {}
  }

  if (!Array.isArray(value) && typeof value === 'object') {
    return value as Record<string, string | string[]>
  }

  return {}
}

export function getDeepDiveText(answers: Record<string, string | string[]>, id: string) {
  const value = answers[id]

  if (Array.isArray(value)) {
    return value.join(', ')
  }

  return value || ''
}

export function getDeepDiveList(answers: Record<string, string | string[]>, id: string) {
  const value = answers[id]

  if (Array.isArray(value)) {
    return value
  }

  return value ? [value] : []
}

export function buildDeepDiveAnswersFromForm(formData: FormData) {
  return allQuestionFields.reduce<Record<string, string | string[]>>((answers, field) => {
    if (field.choices) {
      const values = formData
        .getAll(field.id)
        .map((value) => String(value).trim())
        .filter(Boolean)

      if (values.length > 0) {
        answers[field.id] = values
      }

      return answers
    }

    const value = String(formData.get(field.id) || '').trim()

    if (value) {
      answers[field.id] = value
    }

    return answers
  }, {})
}
