import type { Metadata } from 'next'
import Link from 'next/link'
import { StudentDatabaseHeader } from '@/components/StudentDatabaseHeader'
import { createClient } from '@/lib/supabase/server'
import './styles.css'

export const metadata: Metadata = {
  title: '学生データベース',
  description:
    'KINSEIの学生データベース。学生の動画・属性・志望業界を公開し、企業会員向けに詳細プロフィールや面談リクエスト導線を提供します。',
  alternates: {
    canonical: '/students',
  },
  openGraph: {
    title: '学生データベース | 近世 KINSEI',
    description:
      '学生の動画・属性・志望業界から、企業が会いたい学生を見つけるためのKINSEI学生データベース。',
    url: '/students',
    images: ['/assets/images/student-database-hero-bg.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: '学生データベース | 近世 KINSEI',
    description:
      '学生の動画・属性・志望業界から、企業が会いたい学生を見つけるためのKINSEI学生データベース。',
    images: ['/assets/images/student-database-hero-bg.png'],
  },
}

export const dynamic = 'force-dynamic'

type PublicStudent = {
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
  tiktok_url: string | null
  video_url: string | null
}

const videoThemes = [
  'theme-blue',
  'theme-sky',
  'theme-gold',
  'theme-green',
  'theme-rose',
  'theme-indigo',
  'theme-cyan',
  'theme-slate',
  'theme-orange',
  'theme-teal',
]

const PUBLIC_PREVIEW_COUNT = 3
const MARUBAYASHI_PROFILE_IMAGE_URL = '/assets/students/marubayashi-yuto.png'

function getPrimaryIndustry(student: PublicStudent) {
  return student.desired_industries?.[0] || '志望業界'
}

function getVideoTheme(index: number) {
  return videoThemes[index % videoThemes.length]
}

function getProfileImageStyle(profileImageUrl: string | null) {
  return profileImageUrl === MARUBAYASHI_PROFILE_IMAGE_URL
    ? { objectPosition: '50% 28%' }
    : undefined
}

export default async function StudentsPage() {
  const supabase = await createClient()
  const { data: students, error } = supabase
    ? await supabase
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
            profile_summary
          `,
        )
        .eq('publication_status', 'published')
        .order('id', { ascending: true })
        .returns<PublicStudent[]>()
    : { data: null, error: null }
  const previewStudents = students?.slice(0, PUBLIC_PREVIEW_COUNT) || []

  return (
    <main className="public-students-page">
      <StudentDatabaseHeader active="public" />

      <section className="students-hero">
        <div>
          <p>Student Database</p>
          <h1>
            <span>気になる学生を</span>
            <span>会いたい学生へ</span>
          </h1>
          <span>
            公開情報では、学生ごとのショート動画・出身・属性・志望業界を確認できます。
          </span>
        </div>
        <div className="hero-stat">
          <strong>
            {previewStudents.length}
            <span>名</span>
          </strong>
          <span>先出し公開中</span>
        </div>
      </section>

      <section className="students-intro">
        <div>
          <span className="intro-icon intro-icon-video" aria-hidden="true" />
          <strong>動画で雰囲気を見る</strong>
          <span>縦型のショート動画ブロックで、学生ごとの人柄や熱量を確認できます。</span>
          <i aria-hidden="true" />
        </div>
        <div>
          <span className="intro-icon intro-icon-bars" aria-hidden="true" />
          <strong>属性で比較する</strong>
          <span>学部、学年、出身、志望業界、活動タグから採用接点を探せます。</span>
          <i aria-hidden="true" />
        </div>
        <div>
          <span className="intro-icon intro-icon-lock" aria-hidden="true" />
          <strong>深掘りは会員限定</strong>
          <span>価値観や意思決定の軸、面談リクエストは企業会員DBで確認できます。</span>
          <i aria-hidden="true" />
        </div>
      </section>

      <section className="public-students-section" id="students">
        <div className="section-title">
          <p>Preview</p>
          <h2>公開中の学生プレビュー</h2>
          <span>無料公開ページでは、先出しの3名のみを掲載しています。</span>
        </div>

        {error ? (
          <div className="public-notice">
            <h2>学生データを取得できませんでした</h2>
            <p>{error.message}</p>
          </div>
        ) : null}

        {!error && (!students || students.length === 0) ? (
          <div className="public-notice">
            <h2>公開中の学生データがありません</h2>
            <p>Supabaseに公開ステータスの学生データを登録すると表示されます。</p>
          </div>
        ) : null}

        <div className="public-student-grid">
          {previewStudents.map((student, index) => (
            <article className="public-student-card" id={`student-${student.id}`} key={student.id}>
              <div className="student-public-profile">
                <div className="student-public-face">
                  {student.profile_image_url ? (
                    <img
                      src={student.profile_image_url}
                      alt=""
                      style={getProfileImageStyle(student.profile_image_url)}
                    />
                  ) : (
                    <span>{student.initials}</span>
                  )}
                </div>
                <div>
                  <p>{student.faculty} / {student.grade}</p>
                  <h3>{student.display_name}</h3>
                  <span>出身: {student.location || '未設定'}</span>
                </div>
                <strong>{getPrimaryIndustry(student)}</strong>
              </div>

              <div className={`short-video-frame ${getVideoTheme(index)}`}>
                {student.video_url ? (
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    poster={student.profile_image_url || undefined}
                    preload="metadata"
                    src={student.video_url}
                  />
                ) : student.profile_image_url ? (
                  <img src={student.profile_image_url} alt="" />
                ) : null}
                <div className="video-scrim" />
                <div className="video-label">ショート動画</div>
                <div className="video-play">
                  <span />
                </div>
                <div className="video-copy">
                  <strong>{student.display_name}</strong>
                  <span>{student.catch_copy}</span>
                </div>
              </div>

              <div className="public-student-body">
                <p className="public-catch">{student.catch_copy}</p>
                <div className="public-tag-row">
                  {student.desired_industries?.map((industry) => (
                    <span key={industry}>{industry}</span>
                  ))}
                  {student.attributes?.map((attribute) => (
                    <span key={attribute}>{attribute}</span>
                  ))}
                </div>
                <p className="public-summary">{student.profile_summary || 'プロフィール概要は準備中です。'}</p>
                <div className="public-card-actions">
                  {student.tiktok_url ? (
                    <a href={student.tiktok_url} rel="noreferrer" target="_blank">
                      動画を見る
                    </a>
                  ) : (
                    <span>動画リンク準備中</span>
                  )}
                  <Link href="/login?next=/members/students">詳細は企業会員限定</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
