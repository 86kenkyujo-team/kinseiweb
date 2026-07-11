import type { Metadata } from 'next'
import Link from 'next/link'
import { SafeImage } from '@/components/SafeImage'
import { createClient } from '@/lib/supabase/server'
import { getStudentContext } from '@/lib/student/auth'
import './styles.css'

export const metadata: Metadata = {
  title: '企業・プロジェクトを探す',
  description: 'KINSEIに掲載中の企業情報と求人・プロジェクト情報を学生向けに確認できます。',
  alternates: {
    canonical: '/companies',
  },
}

export const dynamic = 'force-dynamic'

const studentRegistrationMailHref =
  'mailto:r.katayama@kinsei-inc.com?subject=KINSEI%E5%AD%A6%E7%94%9F%E7%99%BB%E9%8C%B2%E5%B8%8C%E6%9C%9B'

type Company = {
  company_description: string | null
  company_name: string
  id: string
  industry_category: string | null
  logo_url: string | null
  public_location: string | null
  public_tags: string[] | null
}

type JobPost = {
  company_id: string
  id: string
  job_type: string | null
  location: string | null
  summary: string | null
  tags: string[] | null
  title: string
  work_style: string | null
}

type CompaniesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || '' : value || ''
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value?.trim())))).sort((a, b) =>
    a.localeCompare(b, 'ja'),
  )
}

function normalized(value: string | null | undefined) {
  return value?.trim().toLocaleLowerCase('ja') || ''
}

export default async function CompaniesPage({ searchParams }: CompaniesPageProps) {
  const params = await searchParams
  const query = firstParam(params.q).trim()
  const industry = firstParam(params.industry)
  const workStyle = firstParam(params.work_style)
  const location = firstParam(params.location)
  const hasFilters = Boolean(query || industry || workStyle || location)
  const supabase = await createClient()
  const [{ data: companies, error }, { data: jobPosts }, studentContext] = await Promise.all([
    supabase
      ? supabase
          .from('companies')
          .select('id, company_name, logo_url, industry_category, company_description, public_location, public_tags')
          .eq('public_status', 'published')
          .order('sort_order', { ascending: true })
          .order('company_name', { ascending: true })
          .returns<Company[]>()
      : Promise.resolve({ data: null, error: null }),
    supabase
      ? supabase
          .from('job_posts')
          .select('id, company_id, title, summary, job_type, location, work_style, tags')
          .eq('publication_status', 'published')
          .order('published_at', { ascending: false })
          .returns<JobPost[]>()
      : Promise.resolve({ data: null }),
    getStudentContext(),
  ])

  const allCompanies = companies || []
  const allJobPosts = jobPosts || []
  const jobsByCompany = new Map<string, JobPost[]>()

  allJobPosts.forEach((jobPost) => {
    const companyJobs = jobsByCompany.get(jobPost.company_id) || []
    companyJobs.push(jobPost)
    jobsByCompany.set(jobPost.company_id, companyJobs)
  })

  const keyword = normalized(query)
  const filteredCompanies = allCompanies.filter((company) => {
    const companyJobs = jobsByCompany.get(company.id) || []
    const searchableText = normalized(
      [
        company.company_name,
        company.industry_category,
        company.company_description,
        company.public_location,
        ...(company.public_tags || []),
        ...companyJobs.flatMap((job) => [job.title, job.summary, job.job_type, job.location, job.work_style, ...(job.tags || [])]),
      ].join(' '),
    )

    return (
      (!keyword || searchableText.includes(keyword)) &&
      (!industry || company.industry_category === industry) &&
      (!workStyle || companyJobs.some((job) => job.work_style === workStyle)) &&
      (!location || company.public_location === location || companyJobs.some((job) => job.location === location))
    )
  })

  const industries = uniqueValues(allCompanies.map((company) => company.industry_category))
  const workStyles = uniqueValues(allJobPosts.map((jobPost) => jobPost.work_style))
  const locations = uniqueValues([
    ...allCompanies.map((company) => company.public_location),
    ...allJobPosts.map((jobPost) => jobPost.location),
  ])
  const isStudentLoggedIn = Boolean(studentContext.student)
  const studentAccountHref = isStudentLoggedIn ? '/student/profile' : '/student/login'

  return (
    <main className="companies-page companies-index-page">
      <header className="companies-header">
        <Link className="companies-brand" href="/index.html">
          <span>K</span>
          <strong>近世 KINSEI</strong>
        </Link>
        <nav className="companies-desktop-nav" aria-label="企業・求人検索">
          <Link aria-current="page" href="/companies">企業を探す</Link>
          <Link href="#featured">プロジェクト</Link>
          <Link href="/index.html#cases">実績・事例</Link>
          <Link href="/index.html#about">KINSEIについて</Link>
          <Link className="companies-nav-login" href={studentAccountHref}>
            {isStudentLoggedIn ? 'マイページ' : '学生ログイン'}
          </Link>
          <a className="companies-nav-register" href={studentRegistrationMailHref}>無料で登録</a>
        </nav>
        <details className="companies-mobile-menu">
          <summary className="companies-menu-button" aria-label="メニューを開く">
            <span />
            <span />
            <span />
          </summary>
          <nav aria-label="企業・求人検索">
            <Link aria-current="page" href="/companies">企業を探す</Link>
            <Link href="#featured">プロジェクト</Link>
            <Link href="/index.html#cases">実績・事例</Link>
            <Link href="/index.html#about">KINSEIについて</Link>
            <Link className="companies-nav-login" href={studentAccountHref}>
              {isStudentLoggedIn ? 'マイページ' : '学生ログイン'}
            </Link>
            <a className="companies-nav-register" href={studentRegistrationMailHref}>無料で登録</a>
          </nav>
        </details>
      </header>

      <section className="companies-search-hero">
        <div className="companies-search-hero-inner">
          <div className="companies-hero-copy">
            <p>Company &amp; Job Search</p>
            <h1>実績でつながる、<br />次のキャリア。</h1>
            <span>企業のリアルな課題に挑戦し、経験を自分の強みに。</span>
            <div className="companies-hero-actions">
              <a className="primary" href="#featured">募集中のプロジェクトを見る <span aria-hidden="true">→</span></a>
              {isStudentLoggedIn ? (
                <Link className="secondary" href="/student/profile">プロフィールを確認 <span aria-hidden="true">→</span></Link>
              ) : (
                <a className="secondary" href={studentRegistrationMailHref}>プロフィールを作成 <span aria-hidden="true">→</span></a>
              )}
            </div>
          </div>

          <form action="/companies" className="companies-search-panel" method="get">
            <label className="companies-keyword-field">
              <span className="companies-search-symbol" aria-hidden="true" />
              <span className="sr-only">キーワード</span>
              <input defaultValue={query} name="q" placeholder="企業名・職種・スキルで検索" type="search" />
            </label>
            <div className="companies-filter-row">
              <label>
                <span>分野</span>
                <select defaultValue={industry} name="industry">
                  <option value="">すべて</option>
                  {industries.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label>
                <span>働き方</span>
                <select defaultValue={workStyle} name="work_style">
                  <option value="">すべて</option>
                  {workStyles.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label>
                <span>エリア</span>
                <select defaultValue={location} name="location">
                  <option value="">すべて</option>
                  {locations.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            </div>
            <button type="submit">検索する</button>
            <div className="companies-search-stats" aria-label="公開状況">
              <span><strong>{allCompanies.length}</strong> 公開企業</span>
              <span><strong>{allJobPosts.length}</strong> 公開求人</span>
            </div>
          </form>
        </div>
      </section>

      {error ? (
        <div className="companies-notice companies-index-notice">
          <h2>企業データを取得できませんでした</h2>
          <p>{error.message}</p>
        </div>
      ) : null}

      <section className="companies-featured" id="featured">
        <div className="companies-featured-heading">
          <div>
            <span className="companies-featured-icon" aria-hidden="true">★</span>
            <h2>{hasFilters ? '検索結果' : '注目の企業・プロジェクト'}</h2>
          </div>
          {hasFilters ? <Link href="/companies#featured">条件をクリア <span aria-hidden="true">→</span></Link> : <span>{filteredCompanies.length}件を表示</span>}
        </div>

        <div className="companies-grid">
          {filteredCompanies.map((company, index) => {
            const companyJobs = jobsByCompany.get(company.id) || []
            const featuredJob = companyJobs[0]
            const detailHref = isStudentLoggedIn
              ? `/companies/${company.id}`
              : `/student/login?next=${encodeURIComponent(`/companies/${company.id}`)}`
            const tags = (featuredJob?.tags?.length ? featuredJob.tags : company.public_tags || []).slice(0, 3)

            return (
              <article className="company-card" key={company.id}>
                <div className="company-card-main">
                  <div className="company-logo">
                    {company.logo_url ? (
                      <SafeImage
                        alt={`${company.company_name}のロゴ`}
                        fallbackText={company.company_name.slice(0, 1)}
                        src={company.logo_url}
                      />
                    ) : (
                      <span>{company.company_name.slice(0, 1)}</span>
                    )}
                  </div>
                  <div className="company-card-content">
                    <p className={`company-card-category tone-${(index % 3) + 1}`}>
                      {featuredJob?.job_type || company.industry_category || '企業プロジェクト'}
                    </p>
                    <h3>{featuredJob?.title || company.company_description || company.company_name}</h3>
                    <p className="company-card-company">{company.company_name}</p>
                    <div className="company-tag-row">
                      {tags.length ? tags.map((tag) => <span key={tag}>{tag}</span>) : <span>詳細準備中</span>}
                    </div>
                  </div>
                </div>
                <div className="company-card-footer">
                  <div className="company-card-meta">
                    <span>{featuredJob?.work_style || '働き方未設定'}</span>
                    <span>{companyJobs.length}件の募集</span>
                  </div>
                  <Link href={detailHref}>{isStudentLoggedIn ? '詳細を見る' : 'ログインして見る'} <span aria-hidden="true">→</span></Link>
                </div>
              </article>
            )
          })}

          {!filteredCompanies.length ? (
            <div className="companies-empty">
              <span className="companies-empty-mark" aria-hidden="true">K</span>
              <div>
                <h2>{hasFilters ? '条件に一致する企業・プロジェクトはありません' : '公開中の企業・プロジェクトはまだありません'}</h2>
                <p>{hasFilters ? '条件を変更して、もう一度検索してください。' : '新しい募集が公開されると、ここに企業とプロジェクトが表示されます。'}</p>
              </div>
              {hasFilters ? <Link href="/companies">条件をクリア</Link> : null}
            </div>
          ) : null}
        </div>

        <div className="companies-update-banner">
          <span className="companies-update-icon" aria-hidden="true">!</span>
          <div>
            <h2>現在、新しいプロジェクトを順次公開しています</h2>
            <p>公開開始をいち早くお知らせします。</p>
          </div>
          <a href={studentRegistrationMailHref}>公開情報を受け取る <span aria-hidden="true">→</span></a>
        </div>
      </section>
    </main>
  )
}
