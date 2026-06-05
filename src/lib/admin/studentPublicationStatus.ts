export const studentPublicationStatusOptions = [
  {
    description: 'まだ学生DBには表示されません',
    label: '下書き',
    value: 'draft',
  },
  {
    description: '学生DBに表示されます',
    label: '公開中',
    value: 'published',
  },
  {
    description: '掲載を終了して非公開にします',
    label: '非公開・掲載終了',
    value: 'archived',
  },
] as const

export function getStudentPublicationStatusLabel(status?: string | null) {
  return studentPublicationStatusOptions.find((option) => option.value === status)?.label || status || '未設定'
}

export function isPublishedStudentStatus(status?: string | null) {
  return status === 'published'
}
