import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { getStudentAccessLinkFlash } from '@/lib/admin/studentAccessLinkFlash'
import { deleteStudent, generateStudentAccessLinkForStudent } from '../../actions'
import { StudentAccessLinkPanel } from '../../StudentAccessLinkPanel'
import { StudentForm } from '../../StudentForm'

export const dynamic = 'force-dynamic'

type EditStudentPageProps = {
  params: Promise<{ studentId: string }>
  searchParams?: Promise<{ status?: string }>
}

const statusMessages: Record<string, string> = {
  auth_user_duplicate_student: 'このログインアカウントは、すでに別の学生に紐づいています。',
  auth_user_lookup_error: '既存のログインアカウントを確認できませんでした。時間をおいて再度お試しください。',
  created: '学生を登録しました。',
  delete_confirm_required: '削除する場合は確認チェックを入れてください。',
  delete_error: '学生を削除できませんでした。関連データを確認して、時間をおいて再度お試しください。',
  delete_name_mismatch: '入力した学生名が一致しません。削除する学生名を正確に入力してください。',
  error: '学生情報を更新できませんでした。',
  invite_email_invalid: 'メールアドレスが無効と判定されました。実在する学生メールアドレスを入力してください。',
  invite_error: 'ログイン設定リンクを発行できませんでした。',
  password_reset_error: '既存アカウント用のログイン設定リンクを発行できませんでした。',
  service_key_missing: 'ログイン設定リンクの発行には Vercel の SUPABASE_SECRET_KEY 設定が必要です。',
  student_invite_link_generated: '学生ログイン設定リンクを発行しました。コピーして学生本人へ送ってください。',
  student_password_reset_link_generated: '既存アカウント用のログイン設定リンクを発行しました。',
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
  const accessLinkFlash = await getStudentAccessLinkFlash()
  const accessLink = accessLinkFlash?.studentId === student.id ? accessLinkFlash : null

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
      {accessLink ? <StudentAccessLinkPanel link={accessLink} /> : null}

      <StudentForm student={student} />

      <section className="admin-panel">
        <h2>学生ログイン設定リンク</h2>
        <p>
          学生本人がパスワードを設定するためのリンクを発行します。
          先に学生ログイン用メールアドレスを保存してから発行してください。
        </p>
        {student.login_email ? (
          <form action={generateStudentAccessLinkForStudent} className="admin-inline-form">
            <input name="studentId" type="hidden" value={student.id} />
            <input name="studentDisplayName" type="hidden" value={student.display_name} />
            <input name="loginEmail" type="hidden" value={student.login_email} />
            <button type="submit">学生ログイン設定リンクを発行</button>
          </form>
        ) : (
          <p className="admin-empty">学生ログイン用メールアドレスを保存すると発行できます。</p>
        )}
      </section>

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
