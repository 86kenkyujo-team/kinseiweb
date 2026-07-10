import type { Metadata } from 'next'
import Link from 'next/link'
import { StudentDatabaseHeader } from '@/components/StudentDatabaseHeader'
import { createClient } from '@/lib/supabase/server'
import './styles.css'

export const metadata: Metadata = {
  title: '企業一覧',
  description: 'KINSEIに掲載中の企業情報と求人情報を学生向けに確認できます。',
  alternates: {
    canonical: '/companies',
  },
}

export const dynamic = 'force-dynamic'

type Company = {
  company_description: string | null
  company_name: string
  id: string
  industry_category: string | null
  logo_url: string | null
  public_location: string | null
  public_tags: string[] | null
}

type JobPostCount = {
  company_id: string
  id: string
}

export default async function CompaniesPage() {
  const supabase = await createClient()
  const [{ data: companies, error }, { data: jobPosts }] = supabase
    ? await Promise.all([
        supabase
          .from('companies')
          .select('id, company_name, logo_url, industry_category, company_description, public_location, public_tags')
          .eq('public_status', 'published')
          .order('sort_order', { ascending: true })
          .order('company_name', { ascending: true })
          .returns<Company[]>(),
        supabase
          .from('job_posts')
          .select('id, company_id')
          .eq('publication_status', 'published')
          .returns<JobPostCount[]>(),
      ])
    : [{ data: null, error: null }, { data: null }]

  const jobCountByCompany = new Map<string, number>()
  jobPosts?.forEach((jobPost) => {
    jobCountByCompany.set(jobPost.company_id, (jobCountByCompany.get(jobPost.company_id) || 0) + 1)
  })

  return (
    <main className="companies-page">
      <StudentDatabaseHeader active="companies" logoutRedirectTo="/student/login" />

      <section className="companies-hero">
        <div>
          <p>Companies</p>
          <h1>プロフィールを添えて、企業へ一歩進む。</h1>
          <span>公開中の企業情報と求人を確認し、学生ログイン後に登録プロフィール入りのメール本文を作成できます。</span>
        </div>
        <Link href="/student/profile">プロフィールを確認する</Link>
      </section>

      {error ? (
        <div className="companies-notice">
          <h2>企業データを取得できませんでした</h2>
          <p>{error.message}</p>
        </div>
      ) : null}

      <section className="companies-grid">
        {companies?.map((company) => (
          <article className="company-card" key={company.id}>
            <div className="company-card-top">
              <div className="company-logo">
                {company.logo_url ? <img src={company.logo_url} alt="" /> : <span>{company.company_name.slice(0, 1)}</span>}
              </div>
              <div>
                <p>{company.industry_category || 'カテゴリ未設定'}</p>
                <h2>{company.company_name}</h2>
              </div>
            </div>
            <p className="company-description">{company.company_description || '企業説明は準備中です。'}</p>
            <div className="company-meta-row">
              <span>{company.public_location || '勤務地未設定'}</span>
              <span>募集中 {jobCountByCompany.get(company.id) || 0} 件</span>
            </div>
            <div className="company-tag-row">
              {company.public_tags?.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
            <Link href={`/companies/${company.id}`}>詳細と求人を見る</Link>
          </article>
        ))}
        {!companies?.length ? (
          <div className="companies-empty">
            <h2>公開中の企業情報はまだありません</h2>
            <p>管理画面で企業の学生向け公開状態を「公開中」にすると表示されます。</p>
          </div>
        ) : null}
      </section>
    </main>
  )
}
