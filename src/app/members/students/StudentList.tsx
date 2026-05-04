'use client'

import { useMemo, useState } from 'react'
import { createInterviewRequest } from './actions'
import type { MemberProfile, Student } from './page'

const INITIAL_VISIBLE_COUNT = 6
const LOAD_MORE_COUNT = 2

function normalizeProfile(profile: Student['student_member_profiles']): MemberProfile | null {
  if (Array.isArray(profile)) {
    return profile[0] || null
  }

  return profile
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
          const displayName = profile?.real_name || student.display_name

          return (
            <article className="student-card" key={student.id}>
              <div className="student-card-top">
                <div className="student-face" aria-hidden="true">
                  {student.profile_image_url ? (
                    <img src={student.profile_image_url} alt="" />
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

              <p className="catch-copy">{student.catch_copy}</p>

              <div className="tag-row">
                {student.desired_industries?.map((industry) => (
                  <span key={industry}>{industry}</span>
                ))}
                {student.attributes?.map((attribute) => (
                  <span key={attribute}>{attribute}</span>
                ))}
              </div>

              <dl>
                <div>
                  <dt>価値観</dt>
                  <dd>{profile?.values_text || '未登録'}</dd>
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
