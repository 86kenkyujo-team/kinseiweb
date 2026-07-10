import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { JobPostForm } from '../JobPostForm'

export const dynamic = 'force-dynamic'

type NewJobPostPageProps = {
  searchParams?: Promise<{ status?: string }>
}

type CompanyOption = {
  company_name: string
  id: string
}

export default async function NewJobPostPage({ searchParams }: NewJobPostPageProps) {
  const params = await searchParams
  const { adminClient } = await requireAdmin()
  const { data: companies } = await adminClient
    .from('companies')
    .select('id, company_name')
    .order('company_name', { ascending: true })
    .returns<CompanyOption[]>()

  return (
    <>
      <section className="admin-page-title">
        <div>
          <p>New Job Post</p>
          <h1>求人を登録</h1>
          <span>公開前に下書き保存し、企業詳細ページ内に表示する求人情報を整えます。</span>
        </div>
        <Link className="admin-button secondary" href="/admin/job-posts">
          一覧へ戻る
        </Link>
      </section>

      {params?.status === 'error' ? <div className="admin-notice">求人を登録できませんでした。</div> : null}

      <JobPostForm companies={companies || []} />
    </>
  )
}
