'use client'

import { useMemo, useState } from 'react'
import { createInterviewRequest } from './actions'
import type { MemberProfile, Student } from './page'
import {
  getDeepDiveList,
  getDeepDiveText,
  normalizeDeepDiveAnswers,
  studentQuestionLayers,
} from '@/lib/studentProfileQuestions'

const INITIAL_VISIBLE_COUNT = 6
const LOAD_MORE_COUNT = 2
const VIDEO_THEMES = [
  'member-video-blue',
  'member-video-sky',
  'member-video-gold',
  'member-video-green',
  'member-video-rose',
  'member-video-indigo',
  'member-video-cyan',
  'member-video-slate',
  'member-video-orange',
  'member-video-teal',
]
const MARUBAYASHI_PROFILE_IMAGE_URL = '/assets/students/marubayashi-yuto.png'

function normalizeProfile(profile: Student['student_member_profiles']): MemberProfile | null {
  if (Array.isArray(profile)) {
    return profile[0] || null
  }

  return profile
}

function getProfileImageStyle(profileImageUrl: string | null) {
  return profileImageUrl === MARUBAYASHI_PROFILE_IMAGE_URL
    ? { objectPosition: '50% 28%' }
    : undefined
}

function hasFieldValue(answers: Record<string, string | string[]>, fieldId: string) {
  return getDeepDiveList(answers, fieldId).length > 0
}

type StudentListProps = {
  students: Student[]
}

export function StudentList({ students }: StudentListProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT)
  const visibleStudents = useMemo(
    () => students.slice(0, visibleCount),
    [students, visibleCount],
  )
  const remainingCount = Math.max(students.length - visibleStudents.length, 0)

  return (
    <>
      <div className="student-grid">
        {visibleStudents.map((student) => {
          const profile = normalizeProfile(student.student_member_profiles)
          const deepDiveAnswers = normalizeDeepDiveAnswers(profile?.deep_dive_answers)
          const displayName = profile?.real_name || student.display_name
          const studentIndex = students.findIndex((item) => item.id === student.id)
          const videoTheme = VIDEO_THEMES[Math.max(studentIndex, 0) % VIDEO_THEMES.length]

          return (
            <article className="student-card" key={student.id}>
              <div className="student-card-top">
                <div className="student-face" aria-hidden="true">
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
                <div className="student-title">
                  <p>{student.faculty} / {student.grade}</p>
                  <h2>{displayName}</h2>
                  <span>{student.location || '地域未設定'}</span>
                </div>
                <strong>{student.initials}</strong>
              </div>

              <div className={`member-short-video ${videoTheme}`}>
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
                <div className="member-video-scrim" />
                <div className="member-video-label">ショート動画</div>
                <div className="member-video-play">
                  <span />
                </div>
                <div className="member-video-copy">
                  <strong>{displayName}</strong>
                  <span>{student.catch_copy}</span>
                </div>
              </div>

              <p className="catch-copy">{student.catch_copy}</p>

              <div className="tag-row">
                {getDeepDiveList(deepDiveAnswers, 'personality_tags').map((tag) => (
                  <span className="personality-tag" key={tag}>{tag}</span>
                ))}
                {student.desired_industries?.map((industry) => (
                  <span key={industry}>{industry}</span>
                ))}
                {student.attributes?.map((attribute) => (
                  <span key={attribute}>{attribute}</span>
                ))}
              </div>

              <dl>
                <div>
                  <dt>基本情報</dt>
                  <dd>
                    年齢: {getDeepDiveText(deepDiveAnswers, 'age') || '未登録'} / MBTI:{' '}
                    {getDeepDiveText(deepDiveAnswers, 'mbti') || '任意未登録'}
                  </dd>
                </div>
                <div>
                  <dt>今何を頑張ってる？</dt>
                  <dd>{getDeepDiveText(deepDiveAnswers, 'current_focus') || '未登録'}</dd>
                </div>
                <div>
                  <dt>将来やりたいこと</dt>
                  <dd>{getDeepDiveText(deepDiveAnswers, 'future_goal_short') || '未登録'}</dd>
                </div>
                <div>
                  <dt>合う会社</dt>
                  <dd>{getDeepDiveText(deepDiveAnswers, 'company_fit') || '未登録'}</dd>
                </div>
                <div>
                  <dt>価値観</dt>
                  <dd>{profile?.values_text || '未登録'}</dd>
                </div>
                <div>
                  <dt>思考スタイル</dt>
                  <dd>{profile?.thinking_style || '未登録'}</dd>
                </div>
                <div>
                  <dt>意思決定の軸</dt>
                  <dd>{profile?.decision_axis || '未登録'}</dd>
                </div>
                <div>
                  <dt>志望理由</dt>
                  <dd>{profile?.motivation_detail || '未登録'}</dd>
                </div>
                <div>
                  <dt>将来像</dt>
                  <dd>{profile?.future_vision || '未登録'}</dd>
                </div>
              </dl>

              <div className="deep-dive-area">
                {studentQuestionLayers.map((layer) => (
                  <section className="deep-dive-layer" key={layer.title}>
                    <h3>{layer.title}</h3>
                    {layer.groups.map((group) => {
                      const hasAnswers = group.fields.some((field) => hasFieldValue(deepDiveAnswers, field.id))

                      return (
                        <div className="deep-dive-group" key={group.title}>
                          <h4>{group.title}</h4>
                          {hasAnswers ? (
                            <dl>
                              {group.fields
                                .filter((field) => hasFieldValue(deepDiveAnswers, field.id))
                                .map((field) => (
                                  <div key={field.id}>
                                    <dt>{field.label}</dt>
                                    <dd>{getDeepDiveText(deepDiveAnswers, field.id)}</dd>
                                  </div>
                                ))}
                            </dl>
                          ) : (
                            <p>未登録</p>
                          )}
                        </div>
                      )
                    })}
                  </section>
                ))}
              </div>

              <div className="request-strip">
                <span>{profile?.meeting_preference || '面談希望未設定'}</span>
              </div>

              <form action={createInterviewRequest} className="request-form">
                <input name="studentId" type="hidden" value={student.id} />
                <label>
                  <span>リクエスト理由</span>
                  <textarea
                    name="requestReason"
                    placeholder="例: 価値観や志望理由が自社の営業職と合いそうなため"
                    required
                  />
                </label>
                <div className="request-form-row">
                  <label>
                    <span>希望形式</span>
                    <select name="preferredMethod" required>
                      <option value="online">オンライン面談</option>
                      <option value="offline">対面面談</option>
                      <option value="consult">運営に相談して決める</option>
                    </select>
                  </label>
                  <label>
                    <span>希望時期</span>
                    <input name="preferredSchedule" placeholder="例: 5月中旬以降" />
                  </label>
                </div>
                <button type="submit">面談リクエストを送信</button>
              </form>
            </article>
          )
        })}
      </div>

      {remainingCount > 0 ? (
        <div className="load-more-area">
          <button
            className="load-more-button"
            type="button"
            onClick={() => setVisibleCount((count) => count + LOAD_MORE_COUNT)}
          >
            さらに読み込む
          </button>
          <span>残り{remainingCount}名</span>
        </div>
      ) : students.length > INITIAL_VISIBLE_COUNT ? (
        <p className="load-complete">すべてのメンバーを表示しています</p>
      ) : null}
    </>
  )
}
