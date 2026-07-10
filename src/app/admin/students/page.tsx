import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import {
  getStudentLoginStatusLabel,
  getStudentProfileShareStatusLabel,
} from '@/lib/admin/studentLoginStatus'
import { getStudentPublicationStatusLabel, isPublishedStudentStatus } from '@/lib/admin/studentPublicationStatus'
import { allStudentQuestionFields, countDeepDiveAnswers } from '@/lib/studentProfileQuestions'

export const dynamic = 'force-dynamic'

type Student = {
  desired_industries: string[] | null
  display_name: string
  faculty: string
  grade: string
  id: string
  login_email: string | null
  login_status: string
  publication_status: string
  profile_share_status: string
  student_member_profiles: { deep_dive_answers: unknown } | { deep_dive_answers: unknown }[] | null
  updated_at: string
}

type AdminStudentsPageProps = {
  searchParams?: Promise<{ status?: string }>
}

const statusMessages: Record<string, string> = {
  deleted: '学生を削除しました。',
  delete_not_found: '削除対象の学生が見つかりませんでした。',
}

function normalizeProfile(profile: Student['student_member_profiles']) {
  if (Array.isArray(profile)) {
    return profile[0] || null
  }

  return profile
}

export default async function AdminStudentsPage({ searchParams }: AdminStudentsPageProps) {
  const query = await searchParams
  const { adminClient } = await requireAdmin()
  const { data: students, error } = await adminClient
    .from('students')
    .select(
      `
        id,
        display_name,
        faculty,
        grade,
        desired_industries,
        publication_status,
        login_email,
        login_status,
        profile_share_status,
        updated_at,
        student_member_profiles (
          deep_dive_answers
        )
      `,
    )
    .order('updated_at', { ascending: false })
    .returns<Student[]>()
  const message = query?.status ? statusMessages[query.status] : null

  return (
    <>
      <section className="admin-page-title">
        <div>
          <p>Students</p>
          <h1>学生管理</h1>
          <span>公開プロフィールと企業会員限定プロフィールを登録・編集します。</span>
        </div>
        <Link className="admin-button" href="/admin/students/new">
          学生を登録
        </Link>
      </section>

      {error ? <div className="admin-notice">{error.message}</div> : null}
      {message ? <div className="admin-notice">{message}</div> : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>学生</th>
              <th>所属</th>
              <th>志望業界</th>
              <th>学生ログイン</th>
              <th>質問項目</th>
              <th>公開状態</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {students?.map((student) => {
              const profile = normalizeProfile(student.student_member_profiles)
              const answeredCount = countDeepDiveAnswers(profile?.deep_dive_answers)
              const totalCount = allStudentQuestionFields.length

              return (
                <tr key={student.id}>
                  <td>
                    <strong>{student.display_name}</strong>
                    <small>{student.id}</small>
                  </td>
                  <td>
                    {student.faculty}
                    <small>{student.grade}</small>
                  </td>
                  <td>{student.desired_industries?.join(', ') || '未設定'}</td>
                  <td>
                    <span className={`status-pill ${student.login_status === 'suspended' ? 'blocked' : ''}`}>
                      {getStudentLoginStatusLabel(student.login_status)}
                    </span>
                    <small>{student.login_email || 'メール未設定'}</small>
                    <small>{getStudentProfileShareStatusLabel(student.profile_share_status)}</small>
                  </td>
                  <td>
                    <span className={`status-pill ${answeredCount === 0 ? 'blocked' : ''}`}>
                      {answeredCount}/{totalCount}
                    </span>
                    <small>第1層〜第3層の回答数</small>
                  </td>
                  <td>
                    <span className={`status-pill ${!isPublishedStudentStatus(student.publication_status) ? 'blocked' : ''}`}>
                      {getStudentPublicationStatusLabel(student.publication_status)}
                    </span>
                  </td>
                  <td>
                    <Link href={`/admin/students/${student.id}/edit`}>編集</Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!students?.length ? <p className="admin-empty">学生データがありません。</p> : null}
      </div>
    </>
  )
}
