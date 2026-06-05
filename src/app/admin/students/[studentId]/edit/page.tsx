import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { deleteStudent } from '../../actions'
import { StudentForm } from '../../StudentForm'

export const dynamic = 'force-dynamic'

type EditStudentPageProps = {
  params: Promise<{ studentId: string }>
  searchParams?: Promise<{ status?: string }>
}

const statusMessages: Record<string, string> = {
  created: '学生を登録しました。',
  delete_confirm_required: '削除する場合は確認チェックを入れてください。',
  delete_error: '学生を削除できませんでした。関連データを確認して、時間をおいて再度お試しください。',
  delete_name_mismatch: '入力した学生名が一致しません。削除する学生名を正確に入力してください。',
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

      <section className="admin-panel danger">
        <h2>学生を削除</h2>
        <p>
          この学生、会員限定プロフィール、面談依頼、公開状態の履歴を削除します。
          KINSEI の Storage にある画像・動画も削除対象です。
        </p>
        <form action={deleteStudent} className="admin-delete-form">
          <input name="studentId" type="hidden" value={student.id} />
          <input name="studentName" type="hidden" value={student.display_name} />
          <label>
            <span className="admin-label-text">削除する学生名</span>
            <span className="admin-field-hint">確認のため「{student.display_name}」と入力してください。</span>
            <input name="studentNameConfirmation" required />
          </label>
          <label className="admin-check-row">
            <input name="confirmDelete" type="checkbox" />
            <span>この学生を削除することを確認しました。</span>
          </label>
          <button className="admin-danger-button" type="submit">
            学生を削除
          </button>
        </form>
      </section>
    </>
  )
}
