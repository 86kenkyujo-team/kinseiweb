import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { StudentDatabaseHeader } from '@/components/StudentDatabaseHeader'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getStudentContext } from '@/lib/student/auth'
import { buildMailBody, buildMailSubject, getContactEmail } from '@/lib/student/contactMail'
import { ContactCompanyForm } from './ContactCompanyForm'
import '../styles.css'

export const dynamic = 'force-dynamic'

type CompanyDetailPageProps = {
  params: Promise<{ companyId: string }>
}

type Company = {
  company_description: string | null
  company_name: string
  id: string
  industry_category: string | null
  logo_url: string | null
  public_location: string | null
  public_tags: string[] | null
  public_website_url: string | null
}

type JobPost = {
  description: string | null
  id: string
  job_type: string | null
  location: string | null
  requirements: string | null
  reward: string | null
  summary: string | null
  tags: string[] | null
  target_grade: string | null
  title: string
  welcome_points: string | null
  work_style: string | null
}

export async function generateMetadata({ params }: CompanyDetailPageProps): Promise<Metadata> {
  const { companyId } = await params
  const supabase = await createClient()
  const { data: company } = supabase
    ? await supabase
        .from('companies')
        .select('company_name, company_description')
        .eq('id', companyId)
        .eq('public_status', 'published')
        .maybeSingle<Pick<Company, 'company_description' | 'company_name'>>()
    : { data: null }

  return {
    title: company?.company_name || '企業詳細',
    description: company?.company_description || 'KINSEIに掲載中の企業詳細と求人情報。',
  }
}

function disabledReasonForStudent(studentContext: Awaited<ReturnType<typeof getStudentContext>>) {
  if (!studentContext.user || !studentContext.student) {
    return undefined
  }

  if (studentContext.student.profile_share_status !== 'enabled') {
    return 'プロフィール共有が有効になっていません。KINSEI運営へ確認してください。'
  }

  if (studentContext.student.login_status === 'suspended') {
    return '学生ログインが停止中です。KINSEI運営へ確認してください。'
  }

  if (!['invited', 'active'].includes(studentContext.student.login_status)) {
    return '学生ログイン設定が有効化されていません。KINSEI運営へ確認してください。'
  }

  return undefined
}

export default async function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const { companyId } = await params
  const supabase = await createClient()
  const [companyResult, jobsResult, studentContext] = await Promise.all([
    supabase
      ? supabase
          .from('companies')
          .select(
            'id, company_name, logo_url, industry_category, company_description, public_website_url, public_location, public_tags',
          )
          .eq('id', companyId)
          .eq('public_status', 'published')
          .maybeSingle<Company>()
      : { data: null, error: null },
    supabase
      ? supabase
          .from('job_posts')
          .select(
            'id, title, summary, description, job_type, target_grade, location, work_style, reward, requirements, welcome_points, tags',
          )
          .eq('company_id', companyId)
          .eq('publication_status', 'published')
          .order('published_at', { ascending: false })
          .returns<JobPost[]>()
      : { data: null, error: null },
    getStudentContext(),
  ])

  const company = companyResult.data

  if (!company) {
    notFound()
  }

  const jobs = jobsResult.data || []
  const student = studentContext.student
  const contactLookupClient = student ? createAdminClient() || supabase : null
  let companyPublicContactEmail: string | null = null
  const jobContactEmailById = new Map<string, string | null>()

  if (student && contactLookupClient) {
    const [companyContactResult, jobContactResult] = await Promise.all([
      contactLookupClient
        .from('companies')
        .select('public_contact_email')
        .eq('id', company.id)
        .eq('public_status', 'published')
        .maybeSingle<{ public_contact_email: string | null }>(),
      contactLookupClient
        .from('job_posts')
        .select('id, contact_email')
        .eq('company_id', company.id)
        .eq('publication_status', 'published')
        .returns<Array<{ contact_email: string | null; id: string }>>(),
    ])

    companyPublicContactEmail = companyContactResult.data?.public_contact_email || null
    jobContactResult.data?.forEach((jobContact) => {
      jobContactEmailById.set(jobContact.id, jobContact.contact_email)
    })
  }

  const contactCompany = {
    company_name: company.company_name,
    public_contact_email: companyPublicContactEmail,
  }
  const loginHref = `/student/login?next=${encodeURIComponent(`/companies/${company.id}`)}`
  const disabledReason = disabledReasonForStudent(studentContext)
  const canPreview = Boolean(student)
  const companySubject = student ? buildMailSubject(contactCompany, student) : ''
  const companyBody = student ? buildMailBody(contactCompany, student) : ''
  const companyContactEmail = student ? getContactEmail(contactCompany) : null

  return (
    <main className="companies-page">
      <StudentDatabaseHeader active="companies" logoutRedirectTo="/student/login" />

      <section className="company-detail-hero">
        <Link className="company-back-link" href="/companies">企業一覧へ戻る</Link>
        <div className="company-detail-heading">
          <div className="company-logo large">
            {company.logo_url ? <img src={company.logo_url} alt="" /> : <span>{company.company_name.slice(0, 1)}</span>}
          </div>
          <div>
            <p>{company.industry_category || 'カテゴリ未設定'}</p>
            <h1>{company.company_name}</h1>
            <span>{company.public_location || '所在地・勤務地は準備中です。'}</span>
          </div>
        </div>
        <p className="company-detail-description">{company.company_description || '企業説明は準備中です。'}</p>
        <div className="company-detail-actions">
          {company.public_website_url ? (
            <a href={company.public_website_url} rel="noreferrer" target="_blank">
              公式サイトを見る
            </a>
          ) : null}
          <a href="#contact">プロフィール情報を添えて連絡する</a>
        </div>
      </section>

      <section className="company-detail-layout">
        <div className="company-detail-main">
          <section className="company-section">
            <div className="company-section-heading">
              <p>Job Posts</p>
              <h2>求人情報</h2>
            </div>
            <div className="job-list">
              {jobs.map((job) => {
                const contactJobPost = {
                  contact_email: jobContactEmailById.get(job.id) || null,
                  title: job.title,
                }
                const subject = student ? buildMailSubject(contactCompany, student, contactJobPost) : ''
                const body = student ? buildMailBody(contactCompany, student, contactJobPost) : ''
                const contactEmail = student ? getContactEmail(contactCompany, contactJobPost) : null

                return (
                  <article className="job-card" key={job.id}>
                    <div className="job-card-heading">
                      <div>
                        <p>{job.job_type || '職種未設定'}</p>
                        <h3>{job.title}</h3>
                      </div>
                      <span>{job.target_grade || '対象学年未設定'}</span>
                    </div>
                    <p>{job.summary || '募集概要は準備中です。'}</p>
                    <dl className="job-detail-list">
                      <div>
                        <dt>業務内容</dt>
                        <dd>{job.description || '未設定'}</dd>
                      </div>
                      <div>
                        <dt>勤務地</dt>
                        <dd>{job.location || '未設定'}</dd>
                      </div>
                      <div>
                        <dt>勤務形態</dt>
                        <dd>{job.work_style || '未設定'}</dd>
                      </div>
                      <div>
                        <dt>報酬・条件</dt>
                        <dd>{job.reward || '未設定'}</dd>
                      </div>
                      <div>
                        <dt>必須条件</dt>
                        <dd>{job.requirements || '未設定'}</dd>
                      </div>
                      <div>
                        <dt>歓迎条件</dt>
                        <dd>{job.welcome_points || '未設定'}</dd>
                      </div>
                    </dl>
                    <div className="company-tag-row">
                      {job.tags?.map((tag) => <span key={tag}>{tag}</span>)}
                    </div>
                    <div className="job-contact-block">
                      {canPreview ? (
                        <ContactCompanyForm
                          body={body}
                          companyId={company.id}
                          contactEmail={contactEmail}
                          disabledReason={disabledReason}
                          jobPostId={job.id}
                          subject={subject}
                        />
                      ) : (
                        <Link className="company-login-cta" href={loginHref}>
                          ログインしてプロフィール情報を添えて連絡する
                        </Link>
                      )}
                    </div>
                  </article>
                )
              })}
              {!jobs.length ? <p className="companies-empty">公開中の求人はまだありません。</p> : null}
            </div>
          </section>
        </div>

        <aside className="company-detail-side" id="contact">
          <div className="company-section-heading">
            <p>Contact</p>
            <h2>企業へ連絡</h2>
          </div>
          <p>企業単位で連絡する場合はこちらからメール本文を確認できます。</p>
          {canPreview ? (
            <ContactCompanyForm
              body={companyBody}
              companyId={company.id}
              contactEmail={companyContactEmail}
              disabledReason={disabledReason}
              subject={companySubject}
            />
          ) : (
            <Link className="company-login-cta" href={loginHref}>
              ログインしてプロフィール情報を添えて連絡する
            </Link>
          )}
          <div className="company-tag-row">
            {company.public_tags?.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </aside>
      </section>
    </main>
  )
}
