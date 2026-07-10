import type { StudentAccount } from './auth'
import { normalizeStudentProfile } from './auth'

export type ContactCompany = {
  company_name: string
  public_contact_email: string | null
}

export type ContactJobPost = {
  contact_email: string | null
  title: string
} | null

export type StudentProfileSnapshot = {
  attributes: string[]
  career_axis: string[]
  desired_industries: string[]
  display_name: string
  faculty: string
  grade: string
  location: string | null
  login_email: string | null
  profile_summary: string | null
  real_name: string | null
}

function compactText(value: string | null | undefined, fallback = '未設定') {
  const compacted = value?.replace(/\s+/g, ' ').trim()
  return compacted || fallback
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength - 1)}…`
}

export function buildStudentProfileSnapshot(student: StudentAccount): StudentProfileSnapshot {
  const profile = normalizeStudentProfile(student.student_member_profiles)

  return {
    attributes: student.attributes || [],
    career_axis: profile?.career_axis || [],
    desired_industries: student.desired_industries || [],
    display_name: student.display_name,
    faculty: student.faculty,
    grade: student.grade,
    location: student.location,
    login_email: student.login_email,
    profile_summary: student.profile_summary,
    real_name: profile?.real_name || null,
  }
}

export function getContactEmail(company: ContactCompany, jobPost?: ContactJobPost) {
  return jobPost?.contact_email || company.public_contact_email || null
}

export function buildMailSubject(company: ContactCompany, student: StudentAccount, jobPost?: ContactJobPost) {
  const profile = normalizeStudentProfile(student.student_member_profiles)
  const studentName = profile?.real_name || student.display_name

  if (jobPost) {
    return `【KINSEI】${jobPost.title}への応募について / ${studentName}`
  }

  return `【KINSEI】企業掲載情報を拝見してのご連絡 / ${studentName}`
}

export function buildMailBody(company: ContactCompany, student: StudentAccount, jobPost?: ContactJobPost) {
  const profile = normalizeStudentProfile(student.student_member_profiles)
  const studentName = profile?.real_name || student.display_name
  const careerAxis = profile?.career_axis?.join(', ') || '未設定'
  const desiredIndustries = student.desired_industries?.join(', ') || '未設定'
  const body = `${company.company_name}
ご担当者様

KINSEIの掲載情報を拝見し、ご連絡いたしました。

■ 学生情報
氏名: ${studentName}
大学・学部: ${student.faculty}
学年: ${student.grade}
活動エリア: ${compactText(student.location)}
志望業界: ${desiredIndustries}

■ 自己紹介
${compactText(student.profile_summary, 'プロフィール概要は登録準備中です。')}

■ キャリア軸
${careerAxis}

■ 興味を持った求人
${jobPost?.title || '企業掲載情報全般'}

■ 連絡先
メール: ${compactText(student.login_email, '学生本人のメールアドレス')}

ご確認のほど、よろしくお願いいたします。`

  return truncate(body, 1800)
}

export function buildMailtoUrl(email: string, subject: string, body: string) {
  const params = new URLSearchParams({
    body,
    subject,
  })

  return `mailto:${encodeURIComponent(email)}?${params.toString()}`
}
