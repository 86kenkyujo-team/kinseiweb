import { requireAdmin } from '@/lib/admin/auth'
import { StudentForm } from '../StudentForm'

export const dynamic = 'force-dynamic'

type NewStudentPageProps = {
  searchParams?: Promise<{ status?: string }>
}

export default async function NewStudentPage({ searchParams }: NewStudentPageProps) {
  const params = await searchParams
  await requireAdmin()

  return (
    <>
      <section className="admin-page-title">
        <div>
          <p>New Student</p>
          <h1>学生を登録</h1>
          <span>まずは下書きで登録し、必須情報を確認してから公開できます。</span>
        </div>
      </section>

      {params?.status === 'error' ? <div className="admin-notice">学生を登録できませんでした。</div> : null}

      <StudentForm />
    </>
  )
}
