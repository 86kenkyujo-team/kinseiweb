export const studentLoginStatusOptions = [
  {
    description: 'ログイン設定リンクをまだ送っていません',
    label: '未招待',
    value: 'not_invited',
  },
  {
    description: 'ログイン設定リンクを発行済みです',
    label: '招待済み',
    value: 'invited',
  },
  {
    description: '学生本人のログイン利用を想定しています',
    label: '有効',
    value: 'active',
  },
  {
    description: '学生ログインを停止します',
    label: '停止中',
    value: 'suspended',
  },
]

export const studentProfileShareStatusOptions = [
  {
    description: 'プロフィール付き連絡を使えません',
    label: '共有停止',
    value: 'disabled',
  },
  {
    description: 'プロフィール付き連絡を使えます',
    label: '共有可',
    value: 'enabled',
  },
]

export function getStudentLoginStatusLabel(status: string) {
  return studentLoginStatusOptions.find((option) => option.value === status)?.label || status
}

export function getStudentProfileShareStatusLabel(status: string) {
  return studentProfileShareStatusOptions.find((option) => option.value === status)?.label || status
}
