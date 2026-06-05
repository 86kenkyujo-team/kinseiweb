export const companyMembershipStatusOptions = [
  {
    description: 'お試し利用中。企業会員DBを閲覧できます',
    isAccessible: true,
    label: 'トライアル中',
    value: 'trial',
  },
  {
    description: '契約中。企業会員DBを閲覧できます',
    isAccessible: true,
    label: '閲覧可能',
    value: 'active',
  },
  {
    description: '支払い・契約確認が必要です。閲覧は止まります',
    isAccessible: false,
    label: '支払い確認待ち',
    value: 'past_due',
  },
  {
    description: '一時停止中。閲覧は止まります',
    isAccessible: false,
    label: '一時停止',
    value: 'suspended',
  },
  {
    description: '解約済み。閲覧は止まります',
    isAccessible: false,
    label: '解約済み',
    value: 'cancelled',
  },
] as const

export function getCompanyMembershipStatusLabel(status?: string | null) {
  return companyMembershipStatusOptions.find((option) => option.value === status)?.label || status || '未設定'
}

export function getCompanyMembershipStatusDescription(status?: string | null) {
  return companyMembershipStatusOptions.find((option) => option.value === status)?.description || ''
}

export function isAccessibleCompanyStatus(status?: string | null) {
  return Boolean(companyMembershipStatusOptions.find((option) => option.value === status)?.isAccessible)
}
