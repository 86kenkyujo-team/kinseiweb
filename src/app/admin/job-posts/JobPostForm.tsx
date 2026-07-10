import Link from 'next/link'
import { jobPostPublicationStatusOptions } from '@/lib/admin/jobPostPublicationStatus'
import { createJobPost, updateJobPost } from './actions'

type CompanyOption = {
  company_name: string
  id: string
}

type JobPost = {
  admin_note?: string | null
  closed_at?: string | null
  company_id?: string
  contact_email?: string | null
  description?: string | null
  id?: string
  job_type?: string | null
  location?: string | null
  publication_status?: string
  published_at?: string | null
  requirements?: string | null
  reward?: string | null
  summary?: string | null
  tags?: string[] | null
  target_grade?: string | null
  title?: string
  welcome_points?: string | null
  work_style?: string | null
}

type JobPostFormProps = {
  companies: CompanyOption[]
  jobPost?: JobPost
}

function joinValues(values?: string[] | null) {
  return values?.join(', ') || ''
}

function dateTimeInputValue(value?: string | null) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString().slice(0, 16)
}

export function JobPostForm({ companies, jobPost }: JobPostFormProps) {
  const isEditing = Boolean(jobPost?.id)

  return (
    <form action={isEditing ? updateJobPost : createJobPost} className="admin-form">
      {jobPost?.id ? <input name="jobPostId" type="hidden" value={jobPost.id} /> : null}
      <div className="admin-form-grid">
        <div className="admin-form-section full">
          <p>求人基本情報</p>
          <span>学生向け企業詳細ページに表示する求人情報です。</span>
        </div>
        <label>
          <span className="admin-label-text">紐づく企業</span>
          <select name="companyId" required defaultValue={jobPost?.company_id || ''}>
            <option value="" disabled>
              企業を選択
            </option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.company_name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="admin-label-text">公開状態</span>
          <select name="publicationStatus" required defaultValue={jobPost?.publication_status || 'draft'}>
            {jobPostPublicationStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}（{option.description}）
              </option>
            ))}
          </select>
        </label>
        <label className="full">
          <span className="admin-label-text">求人タイトル</span>
          <input name="title" required defaultValue={jobPost?.title || ''} />
        </label>
        <label className="full">
          <span className="admin-label-text">募集概要</span>
          <textarea name="summary" defaultValue={jobPost?.summary || ''} />
        </label>
        <label className="full">
          <span className="admin-label-text">業務内容</span>
          <textarea name="description" defaultValue={jobPost?.description || ''} />
        </label>
        <label>
          <span className="admin-label-text">職種</span>
          <input name="jobType" defaultValue={jobPost?.job_type || ''} />
        </label>
        <label>
          <span className="admin-label-text">対象学年</span>
          <input name="targetGrade" defaultValue={jobPost?.target_grade || ''} />
        </label>
        <label>
          <span className="admin-label-text">勤務地</span>
          <input name="location" defaultValue={jobPost?.location || ''} />
        </label>
        <label>
          <span className="admin-label-text">勤務形態</span>
          <input name="workStyle" defaultValue={jobPost?.work_style || ''} />
        </label>
        <label>
          <span className="admin-label-text">報酬・条件</span>
          <input name="reward" defaultValue={jobPost?.reward || ''} />
        </label>
        <label>
          <span className="admin-label-text">求人ごとの連絡先メール</span>
          <span className="admin-field-hint">未入力なら企業の学生向け公開メールを使います。</span>
          <input name="contactEmail" type="email" defaultValue={jobPost?.contact_email || ''} />
        </label>
        <label className="full">
          <span className="admin-label-text">必須条件</span>
          <textarea name="requirements" defaultValue={jobPost?.requirements || ''} />
        </label>
        <label className="full">
          <span className="admin-label-text">歓迎条件</span>
          <textarea name="welcomePoints" defaultValue={jobPost?.welcome_points || ''} />
        </label>
        <label>
          <span className="admin-label-text">表示タグ</span>
          <input name="tags" defaultValue={joinValues(jobPost?.tags)} />
        </label>
        <label>
          <span className="admin-label-text">掲載開始日時</span>
          <input name="publishedAt" type="datetime-local" defaultValue={dateTimeInputValue(jobPost?.published_at)} />
        </label>
        <label>
          <span className="admin-label-text">掲載終了日時</span>
          <input name="closedAt" type="datetime-local" defaultValue={dateTimeInputValue(jobPost?.closed_at)} />
        </label>
        <label className="full">
          <span className="admin-label-text">運営メモ</span>
          <textarea name="adminNote" defaultValue={jobPost?.admin_note || ''} />
        </label>
      </div>

      <div className="admin-form-actions">
        <button type="submit">{isEditing ? '求人情報を更新' : '求人を登録'}</button>
        <Link className="admin-button secondary" href="/admin/job-posts">
          一覧へ戻る
        </Link>
      </div>
    </form>
  )
}
