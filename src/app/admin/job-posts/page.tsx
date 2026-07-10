import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import {
  getJobPostPublicationStatusLabel,
  isPublishedJobPostStatus,
} from '@/lib/admin/jobPostPublicationStatus'

export const dynamic = 'force-dynamic'

type AdminJobPostsPageProps = {
  searchParams?: Promise<{ status?: string }>
}

type JobPost = {
  companies: { company_name: string } | { company_name: string }[] | null
  company_id: string
  created_at: string
  id: string
  publication_status: string
  title: string
  updated_at: string
}

const statusMessages: Record<string, string> = {
  delete_not_found: '削除対象の求人が見つかりませんでした。',
  deleted: '求人を削除しました。',
}

function getCompanyName(company: JobPost['companies']) {
  if (Array.isArray(company)) {
    return company[0]?.company_name || '企業未設定'
  }

  return company?.company_name || '企業未設定'
}

export default async function AdminJobPostsPage({ searchParams }: AdminJobPostsPageProps) {
  const params = await searchParams
  const message = params?.status ? statusMessages[params.status] : null
  const { adminClient } = await requireAdmin()
  const { data: jobPosts, error } = await adminClient
    .from('job_posts')
    .select(
      `
        id,
        company_id,
        title,
        publication_status,
        created_at,
        updated_at,
        companies (
          company_name
        )
      `,
    )
    .order('updated_at', { ascending: false })
    .returns<JobPost[]>()

  return (
    <>
      <section className="admin-page-title">
        <div>
          <p>Job Posts</p>
          <h1>求人管理</h1>
          <span>学生向け企業詳細ページに表示する求人情報を登録・編集します。</span>
        </div>
        <Link className="admin-button" href="/admin/job-posts/new">
          求人を登録
        </Link>
      </section>

      {error ? <div className="admin-notice">{error.message}</div> : null}
      {message ? <div className="admin-notice">{message}</div> : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>求人</th>
              <th>企業</th>
              <th>公開状態</th>
              <th>更新日</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {jobPosts?.map((jobPost) => (
              <tr key={jobPost.id}>
                <td>
                  <strong>{jobPost.title}</strong>
                  <small>{jobPost.id}</small>
                </td>
                <td>{getCompanyName(jobPost.companies)}</td>
                <td>
                  <span className={`status-pill ${!isPublishedJobPostStatus(jobPost.publication_status) ? 'blocked' : ''}`}>
                    {getJobPostPublicationStatusLabel(jobPost.publication_status)}
                  </span>
                </td>
                <td>{new Date(jobPost.updated_at).toLocaleDateString('ja-JP')}</td>
                <td>
                  <Link href={`/admin/job-posts/${jobPost.id}/edit`}>編集</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!jobPosts?.length ? <p className="admin-empty">求人データがありません。</p> : null}
      </div>
    </>
  )
}
