'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

export type AccessAccountRow = {
  authUserId: string
  createdAt: string
  detailHref: string | null
  displayName: string
  email: string
  lastSignInAt: string | null
  loginMethod: string
  portalLabel: string
  role: 'student' | 'company' | 'admin' | 'unlinked'
  roleLabel: string
  statusLabel: string
}

type AccountAccessTableProps = {
  accounts: AccessAccountRow[]
}

const dateTimeFormatter = new Intl.DateTimeFormat('ja-JP', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Tokyo',
})

const roleOptions = [
  { label: 'すべて', value: 'all' },
  { label: '学生', value: 'student' },
  { label: '企業', value: 'company' },
  { label: '管理者', value: 'admin' },
  { label: '未紐づけ', value: 'unlinked' },
] as const

const loginOptions = [
  { label: 'すべて', value: 'all' },
  { label: 'ログイン実績あり', value: 'signed-in' },
  { label: '未ログイン', value: 'never' },
] as const

function formatDateTime(value: string | null) {
  return value ? dateTimeFormatter.format(new Date(value)) : '未ログイン'
}

export function AccountAccessTable({ accounts }: AccountAccessTableProps) {
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<(typeof roleOptions)[number]['value']>('all')
  const [loginFilter, setLoginFilter] = useState<(typeof loginOptions)[number]['value']>('all')

  const filteredAccounts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ja-JP')

    return accounts.filter((account) => {
      const matchesQuery =
        !normalizedQuery ||
        [account.displayName, account.email, account.portalLabel, account.statusLabel].some((value) =>
          value.toLocaleLowerCase('ja-JP').includes(normalizedQuery),
        )
      const matchesRole = roleFilter === 'all' || account.role === roleFilter
      const matchesLogin =
        loginFilter === 'all' ||
        (loginFilter === 'signed-in' && Boolean(account.lastSignInAt)) ||
        (loginFilter === 'never' && !account.lastSignInAt)

      return matchesQuery && matchesRole && matchesLogin
    })
  }, [accounts, loginFilter, query, roleFilter])

  return (
    <section className="admin-access-panel" aria-labelledby="access-account-list-title">
      <div className="admin-access-toolbar">
        <div>
          <h2 id="access-account-list-title">アカウント一覧</h2>
          <p>{filteredAccounts.length}件を表示</p>
        </div>

        <div className="admin-access-filters">
          <label className="admin-access-search">
            <span>名前・メールで検索</span>
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="学生名、企業名、メールアドレス"
              type="search"
              value={query}
            />
          </label>
          <label>
            <span>利用者区分</span>
            <select
              onChange={(event) =>
                setRoleFilter(event.target.value as (typeof roleOptions)[number]['value'])
              }
              value={roleFilter}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>ログイン実績</span>
            <select
              onChange={(event) =>
                setLoginFilter(event.target.value as (typeof loginOptions)[number]['value'])
              }
              value={loginFilter}
            >
              {loginOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {filteredAccounts.length ? (
        <>
          <div className="admin-access-table-wrap">
            <table className="admin-access-table">
              <thead>
                <tr>
                  <th>利用者</th>
                  <th>区分／入口</th>
                  <th>アカウント状態</th>
                  <th>最終ログイン</th>
                  <th>認証方法</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account) => (
                  <tr key={account.authUserId}>
                    <td>
                      {account.detailHref ? (
                        <Link href={account.detailHref}>{account.displayName}</Link>
                      ) : (
                        <strong>{account.displayName}</strong>
                      )}
                      <small>{account.email}</small>
                    </td>
                    <td>
                      <span className={`admin-access-role ${account.role}`}>{account.roleLabel}</span>
                      <small>{account.portalLabel}</small>
                    </td>
                    <td>{account.statusLabel}</td>
                    <td>
                      <strong className={account.lastSignInAt ? undefined : 'admin-access-muted'}>
                        {formatDateTime(account.lastSignInAt)}
                      </strong>
                      <small>登録: {formatDateTime(account.createdAt)}</small>
                    </td>
                    <td>{account.loginMethod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-access-cards">
            {filteredAccounts.map((account) => (
              <article className="admin-access-card" key={account.authUserId}>
                <div className="admin-access-card-heading">
                  <div>
                    {account.detailHref ? (
                      <Link href={account.detailHref}>{account.displayName}</Link>
                    ) : (
                      <strong>{account.displayName}</strong>
                    )}
                    <small>{account.email}</small>
                  </div>
                  <span className={`admin-access-role ${account.role}`}>{account.roleLabel}</span>
                </div>
                <dl>
                  <div>
                    <dt>ログイン入口</dt>
                    <dd>{account.portalLabel}</dd>
                  </div>
                  <div>
                    <dt>アカウント状態</dt>
                    <dd>{account.statusLabel}</dd>
                  </div>
                  <div>
                    <dt>最終ログイン</dt>
                    <dd>{formatDateTime(account.lastSignInAt)}</dd>
                  </div>
                  <div>
                    <dt>認証方法</dt>
                    <dd>{account.loginMethod}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="admin-access-empty">
          <strong>該当するアカウントがありません</strong>
          <p>検索語または絞り込み条件を変更してください。</p>
        </div>
      )}
    </section>
  )
}
