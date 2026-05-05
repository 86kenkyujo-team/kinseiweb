import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { StudentForm } from '../../StudentForm'

export const dynamic = 'force-dynamic'

type EditStudentPageProps = {
  params: Promise<{ studentId: string }>
  searchParams?: Promise<{ status?: string }>
}

const statusMessages: Record<string, string> = {
  created: '学生を登録しました。',
  error: '学生情報を更新できませんでした。',
  updated: '学生情報を更新しました。',
}

export default async function EditStudentPage({ params, searchParams }: EditStudentPageProps) {
  const { studentId } = await params
  const query = await searchParams
  const { adminClient } = await requireAdmin()
  const { data: student } = await adminClient
    .from('students')
    .select(
      `
        *,
        student_member_profiles (*)
      `,
    )
    .eq('id', studentId)
    .maybeSingle()

  if (!student) {
    notFound()
  }

  const message = query?.status ? statusMessages[query.status] : null

  return (
    <>
      <section className="admin-page-title">
        <div>
          <p>Edit Student</p>
          <h1>{student.display_name}</h1>
          <span>公開情報と会員限定情報を編集します。</span>
        </div>
      </section>

      {message ? <div className="admin-notice">{message}</div> : null}

      <StudentForm student={student} />
    </>
  )
}
