import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { allStudentQuestionFields, countDeepDiveAnswers } from '@/lib/studentProfileQuestions'

export const dynamic = 'force-dynamic'

type Student = {
  desired_industries: string[] | null
  display_name: string
  faculty: string
  grade: string
  id: string
  publication_status: string
  student_member_profiles: { deep_dive_answers: unknown } | { deep_dive_answers: unknown }[] | null
  updated_at: string
}

function normalizeProfile(profile: Student['student_member_profiles']) {
  if (Array.isArray(profile)) {
    return profile[0] || null
  }

  return profile
}

export default async function AdminStudentsPage() {
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
        updated_at,
        student_member_profiles (
          deep_dive_answers
        )
      `,
    )
    .order('updated_at', { ascending: false })
    .returns<Student[]>()

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

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>学生</th>
              <th>所属</th>
              <th>志望業界</th>
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
                    <span className={`status-pill ${answeredCount === 0 ? 'blocked' : ''}`}>
                      {answeredCount}/{totalCount}
                    </span>
                    <small>第1層〜第3層の回答数</small>
                  </td>
                  <td>
                    <span className={`status-pill ${student.publication_status !== 'published' ? 'blocked' : ''}`}>
                      {student.publication_status}
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
