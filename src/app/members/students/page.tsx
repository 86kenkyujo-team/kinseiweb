import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LogoutButton } from '@/components/LogoutButton'
import { createClient } from '@/lib/supabase/server'
import { StudentList } from './StudentList'
import './styles.css'

export const dynamic = 'force-dynamic'

type Company = {
  company_name: string
  membership_status: string
}

export type MemberProfile = {
  career_axis: string[] | null
  decision_axis: string | null
  future_vision: string | null
  meeting_preference: string | null
  motivation_detail: string | null
  real_name: string | null
  values_text: string | null
}

export type Student = {
  attributes: string[] | null
  catch_copy: string
  desired_industries: string[] | null
  display_name: string
  faculty: string
  grade: string
  id: string
  initials: string
  location: string | null
  profile_image_url: string | null
  profile_summary: string | null
  student_member_profiles: MemberProfile | MemberProfile[] | null
  tiktok_url: string | null
  video_url: string | null
}

type MembersStudentsPageProps = {
  searchParams?: Promise<{
    request?: string
  }>
}

function getRequestMessage(requestStatus?: string) {
  if (requestStatus === 'sent') {
    return {
      tone: 'success',
      title: '面談リクエストを送信しました',
      body: '運営が内容を確認し、学生本人への接続可否を確認します。',
    }
  }

  if (requestStatus === 'missing') {
    return {
      tone: 'error',
      title: '入力内容を確認してください',
      body: 'リクエスト理由と希望形式は必須です。',
    }
  }

  if (requestStatus === 'error') {
    return {
      tone: 'error',
      title: '面談リクエストを送信できませんでした',
      body: '時間を置いて再度お試しください。解決しない場合は運営へお問い合わせください。',
    }
  }

  if (requestStatus === 'setup') {
    return {
      tone: 'error',
      title: 'Supabase設定が未完了です',
      body: '環境変数を設定してから送信してください。',
    }
  }

  return null
}

export default async function MembersStudentsPage({ searchParams }: MembersStudentsPageProps) {
  const params = await searchParams
  const requestMessage = getRequestMessage(params?.request)
  const supabase = await createClient()

  if (!supabase) {
    return (
      <main className="members-page">
        <section className="setup-card">
          <p>Setup Required</p>
          <h1>Supabase設定待ち</h1>
          <span>
            `.env.local` に Supabase のURLとPublishable Keyを設定すると、企業会員ログインと会員判定が動作します。
          </span>
          <Link href="/login">ログイン画面へ</Link>
        </section>
      </main>
    )
  }

  const { data: claimsData } = await supabase.auth.getClaims()

  if (!claimsData?.claims) {
    redirect('/login?next=/members/students')
  }

  const { data: company } = await supabase
    .from('companies')
    .select('company_name, membership_status')
    .single<Company>()

  if (!company || !['active', 'trial'].includes(company.membership_status)) {
    redirect('/membership-inactive')
  }

  const { data: students, error } = await supabase
    .from('students')
    .select(
      `
        id,
        display_name,
        initials,
        faculty,
        grade,
        location,
        profile_image_url,
        tiktok_url,
        video_url,
        attributes,
        desired_industries,
        catch_copy,
        profile_summary,
        student_member_profiles (
          real_name,
          values_text,
          career_axis,
          motivation_detail,
          decision_axis,
          future_vision,
          meeting_preference
        )
      `,
    )
    .eq('publication_status', 'published')
    .order('id', { ascending: true })
    .returns<Student[]>()

  return (
    <main className="members-page">
      <header className="members-header">
        <Link className="members-brand" href="/index.html">
          <span>K</span>
          近世 KINSEI
        </Link>
        <nav>
          <Link href="/students.html">公開DB</Link>
          <Link href="/members/students">企業会員DB</Link>
          <LogoutButton />
        </nav>
      </header>

      <section className="members-hero">
        <div>
          <p>Company Member Database</p>
          <h1>学生の詳細を確認し、会いたい理由を言語化する。</h1>
          <span>
            {company.company_name} の会員ステータス:
            <strong>{company.membership_status}</strong>
          </span>
        </div>
        <div className="metric-grid">
          <div>
            <strong>{students?.length || 0}</strong>
            <span>閲覧可能学生</span>
          </div>
          <div>
            <strong>RLS</strong>
            <span>会員判定有効</span>
          </div>
        </div>
      </section>

      <section className="students-section">
        {requestMessage ? (
          <div className={`request-message ${requestMessage.tone}`}>
            <h2>{requestMessage.title}</h2>
            <p>{requestMessage.body}</p>
          </div>
        ) : null}

        {error ? (
          <div className="notice-card">
            <h2>学生データを取得できませんでした</h2>
            <p>{error.message}</p>
          </div>
        ) : null}

        {!error && (!students || students.length === 0) ? (
          <div className="notice-card">
            <h2>公開中の学生データがありません</h2>
            <p>Supabase に `published` の学生データを登録するとここに表示されます。</p>
          </div>
        ) : null}

        <StudentList students={students || []} />
      </section>
    </main>
  )
}
