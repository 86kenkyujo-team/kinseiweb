import Link from 'next/link'
import { createStudent, updateStudent } from './actions'

type MemberProfile = {
  career_axis?: string[] | null
  decision_axis?: string | null
  deep_dive_answers?: unknown
  future_vision?: string | null
  meeting_preference?: string | null
  motivation_detail?: string | null
  real_name?: string | null
  thinking_style?: string | null
  values_text?: string | null
}

type Student = {
  attributes?: string[] | null
  catch_copy?: string
  desired_industries?: string[] | null
  display_name?: string
  faculty?: string
  grade?: string
  id?: string
  initials?: string
  location?: string | null
  profile_image_url?: string | null
  profile_summary?: string | null
  publication_status?: string
  student_member_profiles?: MemberProfile | MemberProfile[] | null
  tiktok_url?: string | null
  video_url?: string | null
}

type StudentFormProps = {
  student?: Student
}

function joinValues(values?: string[] | null) {
  return values?.join(', ') || ''
}

function normalizeProfile(profile?: Student['student_member_profiles']) {
  if (Array.isArray(profile)) {
    return profile[0] || null
  }

  return profile || null
}

function stringifyDeepDive(value: unknown) {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    return ''
  }

  return JSON.stringify(value, null, 2)
}

export function StudentForm({ student }: StudentFormProps) {
  const profile = normalizeProfile(student?.student_member_profiles)
  const isEditing = Boolean(student?.id)

  return (
    <form action={isEditing ? updateStudent : createStudent} className="admin-form">
      {student?.id ? <input name="studentId" type="hidden" value={student.id} /> : null}
      <input name="previousStatus" type="hidden" value={student?.publication_status || ''} />

      <div className="admin-form-grid">
        <label>
          表示名
          <input name="displayName" required defaultValue={student?.display_name || ''} />
        </label>
        <label>
          本名
          <input name="realName" defaultValue={profile?.real_name || ''} />
        </label>
        <label>
          イニシャル
          <input name="initials" required defaultValue={student?.initials || ''} />
        </label>
        <label>
          公開ステータス
          <select name="publicationStatus" required defaultValue={student?.publication_status || 'draft'}>
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="archived">archived</option>
          </select>
        </label>
        <label>
          学部
          <input name="faculty" required defaultValue={student?.faculty || ''} />
        </label>
        <label>
          学年
          <input name="grade" required defaultValue={student?.grade || ''} />
        </label>
        <label>
          地域
          <input name="location" defaultValue={student?.location || ''} />
        </label>
        <label>
          志望業界
          <input name="desiredIndustries" defaultValue={joinValues(student?.desired_industries)} />
        </label>
        <label>
          属性タグ
          <input name="attributes" defaultValue={joinValues(student?.attributes)} />
        </label>
        <label>
          TikTok URL
          <input name="tiktokUrl" defaultValue={student?.tiktok_url || ''} />
        </label>
        <label>
          プロフィール画像 URL
          <input name="profileImageUrl" defaultValue={student?.profile_image_url || ''} />
        </label>
        <label>
          紹介動画 URL
          <input name="videoUrl" defaultValue={student?.video_url || ''} />
        </label>
        <label className="full">
          キャッチコピー
          <input name="catchCopy" required defaultValue={student?.catch_copy || ''} />
        </label>
        <label className="full">
          公開プロフィール概要
          <textarea name="profileSummary" defaultValue={student?.profile_summary || ''} />
        </label>
        <label className="full">
          価値観
          <textarea name="valuesText" defaultValue={profile?.values_text || ''} />
        </label>
        <label className="full">
          思考スタイル
          <textarea name="thinkingStyle" defaultValue={profile?.thinking_style || ''} />
        </label>
        <label className="full">
          キャリアの軸
          <input name="careerAxis" defaultValue={joinValues(profile?.career_axis)} />
        </label>
        <label className="full">
          志望理由の深掘り
          <textarea name="motivationDetail" defaultValue={profile?.motivation_detail || ''} />
        </label>
        <label className="full">
          意思決定の軸
          <textarea name="decisionAxis" defaultValue={profile?.decision_axis || ''} />
        </label>
        <label className="full">
          将来像
          <textarea name="futureVision" defaultValue={profile?.future_vision || ''} />
        </label>
        <label className="full">
          面談希望条件
          <textarea name="meetingPreference" defaultValue={profile?.meeting_preference || ''} />
        </label>
        <label className="full">
          深掘り Q&A JSON
          <textarea name="deepDiveAnswers" defaultValue={stringifyDeepDive(profile?.deep_dive_answers)} />
        </label>
        <label className="full">
          公開ステータス変更メモ
          <textarea name="publicationNote" />
        </label>
      </div>

      <div className="admin-form-actions">
        <button type="submit">{isEditing ? '学生情報を更新' : '学生を登録'}</button>
        <Link className="admin-button secondary" href="/admin/students">
          一覧へ戻る
        </Link>
      </div>
    </form>
  )
}
