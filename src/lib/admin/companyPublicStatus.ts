export const companyPublicStatusOptions = [
  {
    description: '学生向けページには表示しません',
    label: '下書き',
    value: 'draft',
  },
  {
    description: '学生向け企業一覧と詳細ページに表示します',
    label: '公開中',
    value: 'published',
  },
  {
    description: '掲載終了として非公開にします',
    label: '掲載終了',
    value: 'archived',
  },
]

export function getCompanyPublicStatusLabel(status: string) {
  return companyPublicStatusOptions.find((option) => option.value === status)?.label || status
}

export function isPublishedCompanyPublicStatus(status: string) {
  return status === 'published'
}
