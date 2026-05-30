import Link from 'next/link'
import { StudentDatabaseHeader } from '@/components/StudentDatabaseHeader'
import './styles.css'

export const dynamic = 'force-dynamic'

export default function MembershipInactivePage() {
  return (
    <main className="inactive-page">
      <StudentDatabaseHeader active="members" />
      <section className="inactive-card">
        <p>Membership Status</p>
        <h1>会員状態の確認が必要です</h1>
        <span>
          ログインは完了していますが、現在の会員ステータスでは会員限定の学生詳細ページを閲覧できません。
          契約状況の確認、または再開をご希望の場合は運営へお問い合わせください。
        </span>
        <div>
          <Link href="/index.html#contact">お問い合わせへ</Link>
          <Link href="/students">公開中の学生プロフィールを見る</Link>
        </div>
      </section>
    </main>
  )
}
