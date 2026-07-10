export const jobPostPublicationStatusOptions = [
  {
    description: '管理画面だけで確認できます',
    label: '下書き',
    value: 'draft',
  },
  {
    description: '公開企業の詳細ページに表示されます',
    label: '公開中',
    value: 'published',
  },
  {
    description: '掲載終了として非公開にします',
    label: '掲載終了',
    value: 'archived',
  },
]

export function getJobPostPublicationStatusLabel(status: string) {
  return jobPostPublicationStatusOptions.find((option) => option.value === status)?.label || status
}

export function isPublishedJobPostStatus(status: string) {
  return status === 'published'
}
