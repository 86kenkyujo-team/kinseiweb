import { requireAdmin } from '@/lib/admin/auth'
import { updateRequestStatus } from './actions'

export const dynamic = 'force-dynamic'

type RequestRow = {
  companies: { company_name: string; contact_name: string } | null
  created_at: string
  id: string
  preferred_method: string
  preferred_schedule: string | null
  request_reason: string
  status: string
  students: { display_name: string } | null
}

type RequestsPageProps = {
  searchParams?: Promise<{ status?: string }>
}

const statusMessages: Record<string, string> = {
  error: 'ステータスを更新できませんでした。',
  missing: '更新内容が不足しています。',
  updated: 'ステータスを更新しました。',
}

export default async function AdminRequestsPage({ searchParams }: RequestsPageProps) {
  const params = await searchParams
  const { adminClient } = await requireAdmin()
  const { data: requests, error } = await adminClient
    .from('interview_requests')
    .select(
      `
        id,
        request_reason,
        preferred_method,
        preferred_schedule,
        status,
        created_at,
        companies ( company_name, contact_name ),
        students ( display_name )
      `,
    )
    .order('created_at', { ascending: false })
    .returns<RequestRow[]>()

  const message = params?.status ? statusMessages[params.status] : null

  return (
    <>
      <section className="admin-page-title">
        <div>
          <p>Interview Requests</p>
          <h1>面談リクエスト</h1>
          <span>企業から届いた面談希望を確認し、運営側の対応状況を更新します。</span>
        </div>
      </section>

      {message ? <div className="admin-notice">{message}</div> : null}
      {error ? <div className="admin-notice">{error.message}</div> : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>企業</th>
              <th>学生</th>
              <th>理由</th>
              <th>希望</th>
              <th>対応</th>
            </tr>
          </thead>
          <tbody>
            {requests?.map((request) => (
              <tr key={request.id}>
                <td>
                  {request.companies?.company_name || '企業不明'}
                  <small>{request.companies?.contact_name || ''}</small>
                </td>
                <td>{request.students?.display_name || '学生不明'}</td>
                <td>{request.request_reason}</td>
                <td>
                  {request.preferred_method}
                  <small>{request.preferred_schedule || '時期未指定'}</small>
                </td>
                <td>
                  <form action={updateRequestStatus} className="admin-inline-form">
                    <input name="requestId" type="hidden" value={request.id} />
                    <select name="status" defaultValue={request.status}>
                      <option value="new">new</option>
                      <option value="reviewing">reviewing</option>
                      <option value="introduced">introduced</option>
                      <option value="declined">declined</option>
                      <option value="closed">closed</option>
                    </select>
                    <button type="submit">更新</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!requests?.length ? <p className="admin-empty">面談リクエストはまだありません。</p> : null}
      </div>
    </>
  )
}
