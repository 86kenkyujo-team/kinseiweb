import Link from 'next/link'
import { StudentDatabaseHeader } from '@/components/StudentDatabaseHeader'
import { normalizeStudentProfile, requireStudent } from '@/lib/student/auth'
import '../styles.css'

export const dynamic = 'force-dynamic'

function valueList(values?: string[] | null) {
  return values?.length ? values.join(' / ') : '未設定'
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString('ja-JP') : '未確認'
}

export default async function StudentProfilePage() {
  const context = await requireStudent('/student/profile')

  if (!context.isConfigured) {
    return (
      <main className="student-page">
        <StudentDatabaseHeader active="student" logoutRedirectTo="/student/login" />
        <section className="student-setup">
          <p>Setup Required</p>
          <h1>Supabase設定待ち</h1>
          <span>環境変数を設定すると学生プロフィール確認画面が動作します。</span>
        </section>
      </main>
    )
  }

  if (!context.student) {
    return (
      <main className="student-page">
        <StudentDatabaseHeader active="student" logoutRedirectTo="/student/login" />
        <section className="student-setup">
          <p>Account Setup</p>
          <h1>学生プロフィールがまだ紐づいていません</h1>
          <span>ログイン中のアカウントに学生プロフィールが紐づいていません。KINSEI運営へ確認してください。</span>
          <a href="mailto:info@kinsei-career.jp?subject=学生プロフィール紐づけ確認">運営へ確認する</a>
        </section>
      </main>
    )
  }

  const student = context.student
  const profile = normalizeStudentProfile(student.student_member_profiles)
  const studentName = profile?.real_name || student.display_name

  return (
    <main className="student-page">
      <StudentDatabaseHeader active="student" logoutRedirectTo="/student/login" />

      <section className="student-hero">
        <div>
          <p>Student Profile</p>
          <h1>{studentName}</h1>
          <span>{student.catch_copy}</span>
        </div>
        <div className="student-hero-actions">
          <Link href="/companies">企業を探す</Link>
          <Link href="/student/contacts">連絡履歴を見る</Link>
        </div>
      </section>

      <section className="student-profile-layout">
        <aside className="student-profile-side">
          <div className="student-avatar">
            {student.profile_image_url ? <img src={student.profile_image_url} alt="" /> : <span>{student.initials}</span>}
          </div>
          <h2>{student.display_name}</h2>
          <p>{student.faculty} / {student.grade}</p>
          <div className="student-status-list">
            <span>ログイン状態: {student.login_status}</span>
            <span>プロフィール共有: {student.profile_share_status === 'enabled' ? '共有可' : '共有停止'}</span>
            <span>プロフィール確認: {formatDate(student.profile_confirmed_at)}</span>
          </div>
        </aside>

        <section className="student-profile-main">
          <div className="student-section-heading">
            <p>共有前に確認</p>
            <h2>登録プロフィール</h2>
            <span>初期リリースでは学生本人による編集はできません。誤りがある場合は修正依頼を送ってください。</span>
          </div>

          <div className="student-data-grid">
            <div>
              <span>氏名</span>
              <strong>{studentName}</strong>
            </div>
            <div>
              <span>大学・学部</span>
              <strong>{student.faculty}</strong>
            </div>
            <div>
              <span>学年</span>
              <strong>{student.grade}</strong>
            </div>
            <div>
              <span>活動エリア</span>
              <strong>{student.location || '未設定'}</strong>
            </div>
            <div>
              <span>志望業界</span>
              <strong>{valueList(student.desired_industries)}</strong>
            </div>
            <div>
              <span>属性タグ</span>
              <strong>{valueList(student.attributes)}</strong>
            </div>
          </div>

          <div className="student-text-stack">
            <article>
              <h3>プロフィール概要</h3>
              <p>{student.profile_summary || 'プロフィール概要は準備中です。'}</p>
            </article>
            <article>
              <h3>キャリア軸</h3>
              <p>{valueList(profile?.career_axis)}</p>
            </article>
            <article>
              <h3>価値観</h3>
              <p>{profile?.values_text || '未設定'}</p>
            </article>
            <article>
              <h3>意思決定の軸</h3>
              <p>{profile?.decision_axis || '未設定'}</p>
            </article>
            <article>
              <h3>将来像</h3>
              <p>{profile?.future_vision || '未設定'}</p>
            </article>
          </div>

          <div className="student-action-band">
            <div>
              <h2>内容に誤りがありますか？</h2>
              <p>プロフィール修正はKINSEI運営が確認して反映します。</p>
            </div>
            <a href={`mailto:info@kinsei-career.jp?subject=${encodeURIComponent('学生プロフィール修正依頼')}`}>
              修正を依頼する
            </a>
          </div>
        </section>
      </section>
    </main>
  )
}
