import Link from 'next/link'
import {
  studentLoginStatusOptions,
  studentProfileShareStatusOptions,
} from '@/lib/admin/studentLoginStatus'
import { studentPublicationStatusOptions } from '@/lib/admin/studentPublicationStatus'
import { createStudent, updateStudent } from './actions'
import { AdminMediaUploader } from './AdminMediaUploader'
import {
  getDeepDiveList,
  getDeepDiveText,
  normalizeDeepDiveAnswers,
  studentQuestionLayers,
} from '@/lib/studentProfileQuestions'

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
  login_email?: string | null
  login_status?: string
  profile_image_url?: string | null
  profile_share_status?: string
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

export function StudentForm({ student }: StudentFormProps) {
  const profile = normalizeProfile(student?.student_member_profiles)
  const deepDiveAnswers = normalizeDeepDiveAnswers(profile?.deep_dive_answers)
  const isEditing = Boolean(student?.id)

  return (
    <form action={isEditing ? updateStudent : createStudent} className="admin-form">
      {student?.id ? <input name="studentId" type="hidden" value={student.id} /> : null}
      <input name="previousStatus" type="hidden" value={student?.publication_status || ''} />

      <div className="admin-form-grid">
        <div className="admin-form-section full">
          <p>基本情報</p>
          <span>学生DBのカードや検索で使う基本項目です。公開前でも下書き保存できます。</span>
        </div>
        <label>
          <span className="admin-label-text">表示名</span>
          <span className="admin-field-hint">企業会員側に表示される名前です。</span>
          <input name="displayName" required defaultValue={student?.display_name || ''} />
        </label>
        <label>
          <span className="admin-label-text">本名</span>
          <span className="admin-field-hint">運営確認用です。未入力でも登録できます。</span>
          <input name="realName" defaultValue={profile?.real_name || ''} />
        </label>
        <label>
          <span className="admin-label-text">イニシャル</span>
          <span className="admin-field-hint">一覧やカードで短く見せる表記です。</span>
          <input name="initials" required defaultValue={student?.initials || ''} />
        </label>
        <label>
          <span className="admin-label-text">公開状態</span>
          <span className="admin-field-hint">内部値はそのまま保存されます。表示だけ分かりやすくしています。</span>
          <select name="publicationStatus" required defaultValue={student?.publication_status || 'draft'}>
            {studentPublicationStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}（{option.description}）
              </option>
            ))}
          </select>
        </label>
        <div className="admin-form-section full">
          <p>学生ログイン</p>
          <span>学生本人がマイページでプロフィール確認と企業連絡導線を使うための設定です。</span>
        </div>
        <label>
          <span className="admin-label-text">学生ログイン用メールアドレス</span>
          <span className="admin-field-hint">学生本人がログインに使うメールアドレスです。</span>
          <input name="loginEmail" type="email" defaultValue={student?.login_email || ''} />
        </label>
        <label>
          <span className="admin-label-text">学生ログイン状態</span>
          <select name="loginStatus" required defaultValue={student?.login_status || 'not_invited'}>
            {studentLoginStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}（{option.description}）
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="admin-label-text">プロフィール共有可否</span>
          <span className="admin-field-hint">共有可の場合のみ、学生はプロフィール付き連絡導線を使えます。</span>
          <select name="profileShareStatus" required defaultValue={student?.profile_share_status || 'disabled'}>
            {studentProfileShareStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}（{option.description}）
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="admin-label-text">学部</span>
          <input name="faculty" required defaultValue={student?.faculty || ''} />
        </label>
        <label>
          <span className="admin-label-text">学年</span>
          <input name="grade" required defaultValue={student?.grade || ''} />
        </label>
        <label>
          <span className="admin-label-text">地域</span>
          <span className="admin-field-hint">例: 大阪 / 東京 / 福岡</span>
          <input name="location" defaultValue={student?.location || ''} />
        </label>
        <label>
          <span className="admin-label-text">志望業界</span>
          <span className="admin-field-hint">複数ある場合は「IT, 広告, 人材」のように区切ってください。</span>
          <input name="desiredIndustries" defaultValue={joinValues(student?.desired_industries)} />
        </label>
        <label>
          <span className="admin-label-text">属性タグ</span>
          <span className="admin-field-hint">検索・分類用のタグです。複数入力できます。</span>
          <input name="attributes" defaultValue={joinValues(student?.attributes)} />
        </label>
        <label>
          <span className="admin-label-text">TikTok URL</span>
          <span className="admin-field-hint">投稿やアカウントのURLを貼り付けます。</span>
          <input name="tiktokUrl" defaultValue={student?.tiktok_url || ''} />
        </label>

        <div className="admin-form-section full">
          <p>画像・動画</p>
          <span>ファイルを選ぶだけでアップロードできます。すでにURLがある場合は直接貼り付けても保存できます。</span>
        </div>
        <AdminMediaUploader
          accept="image/jpeg,image/png,image/webp,image/gif"
          helpText="プロフィールカードに表示する画像です。10MB以内の JPG / PNG / WebP / GIF を選べます。"
          initialUrl={student?.profile_image_url}
          kind="image"
          label="プロフィール画像"
          maxSizeMb={10}
          name="profileImageUrl"
        />
        <AdminMediaUploader
          accept="video/mp4,video/webm,video/quicktime"
          helpText="学生紹介で再生する動画です。50MB以内の MP4 / WebM / MOV を選べます。"
          initialUrl={student?.video_url}
          kind="video"
          label="紹介動画"
          maxSizeMb={50}
          name="videoUrl"
        />

        <div className="admin-form-section full">
          <p>公開プロフィール</p>
          <span>ログイン前後の学生DBで、企業に見せる文章です。</span>
        </div>
        <label className="full">
          <span className="admin-label-text">キャッチコピー</span>
          <span className="admin-field-hint">一覧で最初に目に入る短い紹介文です。</span>
          <input name="catchCopy" required defaultValue={student?.catch_copy || ''} />
        </label>
        <label className="full">
          <span className="admin-label-text">公開プロフィール概要</span>
          <span className="admin-field-hint">学生の雰囲気や強みが分かる紹介文です。</span>
          <textarea name="profileSummary" defaultValue={student?.profile_summary || ''} />
        </label>

        <div className="admin-form-section full">
          <p>企業会員限定プロフィール</p>
          <span>ログイン後の企業会員DBで、より詳しく見せる情報です。</span>
        </div>
        <label className="full">
          <span className="admin-label-text">価値観</span>
          <textarea name="valuesText" defaultValue={profile?.values_text || ''} />
        </label>
        <label className="full">
          <span className="admin-label-text">思考スタイル</span>
          <textarea name="thinkingStyle" defaultValue={profile?.thinking_style || ''} />
        </label>
        <label className="full">
          <span className="admin-label-text">キャリアの軸</span>
          <span className="admin-field-hint">複数ある場合はカンマ区切りで入力できます。</span>
          <input name="careerAxis" defaultValue={joinValues(profile?.career_axis)} />
        </label>
        <label className="full">
          <span className="admin-label-text">志望理由の深掘り</span>
          <textarea name="motivationDetail" defaultValue={profile?.motivation_detail || ''} />
        </label>
        <label className="full">
          <span className="admin-label-text">意思決定の軸</span>
          <textarea name="decisionAxis" defaultValue={profile?.decision_axis || ''} />
        </label>
        <label className="full">
          <span className="admin-label-text">将来像</span>
          <textarea name="futureVision" defaultValue={profile?.future_vision || ''} />
        </label>
        <label className="full">
          <span className="admin-label-text">面談希望条件</span>
          <textarea name="meetingPreference" defaultValue={profile?.meeting_preference || ''} />
        </label>
        <div className="admin-form-section full">
          <p>学生データベース質問項目</p>
          <span>ログイン後の企業会員DBに表示される第1層〜第3層の回答です。</span>
        </div>
        {studentQuestionLayers.map((layer) => (
          <fieldset className="admin-question-layer full" key={layer.title}>
            <legend>{layer.title}</legend>
            {layer.groups.map((group) => (
              <div className="admin-question-group" key={group.title}>
                <h2>{group.title}</h2>
                <div className="admin-question-grid">
                  {group.fields.map((field) => (
                    <div className={field.multiline ? 'admin-question-field full' : 'admin-question-field'} key={field.id}>
                      <span>{field.label}</span>
                      {field.choices ? (
                        <div className="admin-choice-grid">
                          {field.choices.map((choice) => (
                            <label key={choice}>
                              <input
                                defaultChecked={getDeepDiveList(deepDiveAnswers, field.id).includes(choice)}
                                name={field.id}
                                type="checkbox"
                                value={choice}
                              />
                              {choice}
                            </label>
                          ))}
                        </div>
                      ) : field.multiline ? (
                        <textarea
                          maxLength={field.maxLength}
                          name={field.id}
                          defaultValue={getDeepDiveText(deepDiveAnswers, field.id)}
                        />
                      ) : (
                        <input
                          maxLength={field.maxLength}
                          name={field.id}
                          defaultValue={getDeepDiveText(deepDiveAnswers, field.id)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </fieldset>
        ))}
        <label className="full">
          <span className="admin-label-text">公開状態変更メモ</span>
          <span className="admin-field-hint">公開・非公開を切り替えた理由を残せます。状態変更がない場合は空欄で大丈夫です。</span>
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
