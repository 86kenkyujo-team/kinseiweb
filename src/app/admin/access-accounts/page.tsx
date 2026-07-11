import type { User } from '@supabase/supabase-js'
import { getCompanyMembershipStatusLabel } from '@/lib/admin/companyMembershipStatus'
import { getStudentLoginStatusLabel } from '@/lib/admin/studentLoginStatus'
import { requireAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { AccountAccessTable, type AccessAccountRow } from './AccountAccessTable'

export const dynamic = 'force-dynamic'

type StudentAccount = {
  auth_user_id: string | null
  display_name: string
  id: string
  login_status: string
}

type CompanyAccount = {
  auth_user_id: string | null
  company_name: string
  id: string
  membership_status: string
}

type AdminAccount = {
  auth_user_id: string
  display_name: string | null
  role: string
}

function getLoginMethod(user: User) {
  const providers = user.app_metadata.providers as string[] | undefined
  const providerLabels: Record<string, string> = {
    email: 'メール＋パスワード',
    phone: '電話番号',
    google: 'Google',
    github: 'GitHub',
  }

  if (!providers?.length) {
    return providerLabels[user.app_metadata.provider as string] || '不明'
  }

  return providers.map((provider) => providerLabels[provider] || provider).join('／')
}

function buildAccountRows(
  users: User[],
  students: StudentAccount[],
  companies: CompanyAccount[],
  admins: AdminAccount[],
) {
  const studentsByAuthId = new Map(
    students.filter((student) => student.auth_user_id).map((student) => [student.auth_user_id, student]),
  )
  const companiesByAuthId = new Map(
    companies.filter((company) => company.auth_user_id).map((company) => [company.auth_user_id, company]),
  )
  const adminsByAuthId = new Map(admins.map((admin) => [admin.auth_user_id, admin]))

  return users
    .map<AccessAccountRow>((user) => {
      const student = studentsByAuthId.get(user.id)
      const company = companiesByAuthId.get(user.id)
      const admin = adminsByAuthId.get(user.id)

      if (admin) {
        return {
          authUserId: user.id,
          createdAt: user.created_at,
          detailHref: null,
          displayName: admin.display_name || '管理者',
          email: user.email || 'メール未登録',
          lastSignInAt: user.last_sign_in_at || null,
          loginMethod: getLoginMethod(user),
          portalLabel: '管理画面 /admin/login',
          role: 'admin',
          roleLabel: '管理者',
          statusLabel: admin.role === 'owner' ? 'オーナー' : '管理者',
        }
      }

      if (company) {
        return {
          authUserId: user.id,
          createdAt: user.created_at,
          detailHref: `/admin/companies/${company.id}`,
          displayName: company.company_name,
          email: user.email || 'メール未登録',
          lastSignInAt: user.last_sign_in_at || null,
          loginMethod: getLoginMethod(user),
          portalLabel: '企業会員DB /login',
          role: 'company',
          roleLabel: '企業',
          statusLabel: getCompanyMembershipStatusLabel(company.membership_status),
        }
      }

      if (student) {
        return {
          authUserId: user.id,
          createdAt: user.created_at,
          detailHref: `/admin/students/${student.id}/edit`,
          displayName: student.display_name,
          email: user.email || 'メール未登録',
          lastSignInAt: user.last_sign_in_at || null,
          loginMethod: getLoginMethod(user),
          portalLabel: '学生マイページ /student/login',
          role: 'student',
          roleLabel: '学生',
          statusLabel: getStudentLoginStatusLabel(student.login_status),
        }
      }

      return {
        authUserId: user.id,
        createdAt: user.created_at,
        detailHref: null,
        displayName: '紐づけ先なし',
        email: user.email || 'メール未登録',
        lastSignInAt: user.last_sign_in_at || null,
        loginMethod: getLoginMethod(user),
        portalLabel: '入口を判定できません',
        role: 'unlinked',
        roleLabel: '未紐づけ',
        statusLabel: '要確認',
      }
    })
    .sort((left, right) => {
      if (!left.lastSignInAt && !right.lastSignInAt) {
        return right.createdAt.localeCompare(left.createdAt)
      }

      if (!left.lastSignInAt) return 1
      if (!right.lastSignInAt) return -1
      return right.lastSignInAt.localeCompare(left.lastSignInAt)
    })
}

export default async function AccessAccountsPage() {
  await requireAdmin()
  const serviceClient = createAdminClient()

  if (!serviceClient) {
    return (
      <section className="admin-panel">
        <h1>ログイン情報を取得できません</h1>
        <p>Supabaseの管理用キーを設定すると、アカウントと最終ログインを表示できます。</p>
      </section>
    )
  }

  const [usersResult, studentsResult, companiesResult, adminsResult] = await Promise.all([
    serviceClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    serviceClient.from('students').select('id, auth_user_id, display_name, login_status'),
    serviceClient.from('companies').select('id, auth_user_id, company_name, membership_status'),
    serviceClient.from('admin_users').select('auth_user_id, display_name, role'),
  ])

  if (usersResult.error) {
    return (
      <section className="admin-panel danger">
        <h1>ログイン情報を取得できませんでした</h1>
        <p>{usersResult.error.message}</p>
      </section>
    )
  }

  const profileDataError = studentsResult.error || companiesResult.error || adminsResult.error

  if (profileDataError) {
    return (
      <section className="admin-panel danger">
        <h1>利用者情報との紐づけに失敗しました</h1>
        <p>{profileDataError.message}</p>
      </section>
    )
  }

  const accounts = buildAccountRows(
    usersResult.data.users,
    (studentsResult.data || []) as StudentAccount[],
    (companiesResult.data || []) as CompanyAccount[],
    (adminsResult.data || []) as AdminAccount[],
  )
  const signedInCount = accounts.filter((account) => account.lastSignInAt).length
  const studentCount = accounts.filter((account) => account.role === 'student').length
  const companyCount = accounts.filter((account) => account.role === 'company').length
  const unlinkedCount = accounts.filter((account) => account.role === 'unlinked').length

  return (
    <>
      <section className="admin-page-title">
        <div>
          <p>Account Access</p>
          <h1>アカウント・ログイン状況</h1>
          <span>
            管理画面で登録・紐づけた学生、企業、管理者を、Supabase Authのログイン情報と合わせて確認できます。
          </span>
        </div>
      </section>

      <section className="admin-access-metrics" aria-label="アカウント集計">
        <div className="admin-metric">
          <strong>{accounts.length}</strong>
          <span>全アカウント</span>
        </div>
        <div className="admin-metric">
          <strong>{studentCount}</strong>
          <span>学生アカウント</span>
        </div>
        <div className="admin-metric">
          <strong>{companyCount}</strong>
          <span>企業アカウント</span>
        </div>
        <div className="admin-metric">
          <strong>{signedInCount}</strong>
          <span>ログイン実績あり</span>
        </div>
        <div className="admin-metric">
          <strong>{accounts.length - signedInCount}</strong>
          <span>未ログイン</span>
        </div>
        <div className={`admin-metric ${unlinkedCount ? 'attention' : ''}`}>
          <strong>{unlinkedCount}</strong>
          <span>未紐づけ</span>
        </div>
      </section>

      <div className="admin-access-note">
        <strong>表示について</strong>
        <p>
          最終ログインは認証が成功した時刻です。現在オンライン中か、どのページを閲覧中かを示すものではありません。
        </p>
      </div>

      <AccountAccessTable accounts={accounts} />
    </>
  )
}
