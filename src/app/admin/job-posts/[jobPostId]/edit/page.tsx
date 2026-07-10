import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { deleteJobPost } from '../../actions'
import { JobPostForm } from '../../JobPostForm'

export const dynamic = 'force-dynamic'

type EditJobPostPageProps = {
  params: Promise<{ jobPostId: string }>
  searchParams?: Promise<{ status?: string }>
}

type CompanyOption = {
  company_name: string
  id: string
}

const statusMessages: Record<string, string> = {
  created: '求人を登録しました。',
  delete_confirm_required: '削除する場合は確認チェックを入れてください。',
  delete_error: '求人を削除できませんでした。関連データを確認して、時間をおいて再度お試しください。',
  delete_title_mismatch: '入力した求人タイトルが一致しません。削除する求人タイトルを正確に入力してください。',
  error: '求人情報を更新できませんでした。',
  updated: '求人情報を更新しました。',
}

export default async function EditJobPostPage({ params, searchParams }: EditJobPostPageProps) {
  const { jobPostId } = await params
  const query = await searchParams
  const { adminClient } = await requireAdmin()
  const [{ data: jobPost }, { data: companies }] = await Promise.all([
    adminClient.from('job_posts').select('*').eq('id', jobPostId).maybeSingle(),
    adminClient
      .from('companies')
      .select('id, company_name')
      .order('company_name', { ascending: true })
      .returns<CompanyOption[]>(),
  ])

  if (!jobPost) {
    notFound()
  }

  const message = query?.status ? statusMessages[query.status] : null

  return (
    <>
      <section className="admin-page-title">
        <div>
          <p>Edit Job Post</p>
          <h1>{jobPost.title}</h1>
          <span>学生向け企業詳細に掲載する求人情報を編集します。</span>
        </div>
      </section>

      {message ? <div className="admin-notice">{message}</div> : null}

      <JobPostForm companies={companies || []} jobPost={jobPost} />

      <section className="admin-panel danger">
        <h2>求人を削除</h2>
        <p>この求人を削除します。既存の連絡導線利用履歴では求人名が参照できなくなる場合があります。</p>
        <form action={deleteJobPost} className="admin-delete-form">
          <input name="jobPostId" type="hidden" value={jobPost.id} />
          <input name="jobPostTitle" type="hidden" value={jobPost.title} />
          <label>
            <span className="admin-label-text">削除する求人タイトル</span>
            <span className="admin-field-hint">確認のため「{jobPost.title}」と入力してください。</span>
            <input name="jobPostTitleConfirmation" required />
          </label>
          <label className="admin-check-row">
            <input name="confirmDelete" type="checkbox" />
            <span>この求人を削除することを確認しました。</span>
          </label>
          <button className="admin-danger-button" type="submit">
            求人を削除
          </button>
        </form>
      </section>
    </>
  )
}
