'use client'

import { useEffect, useRef } from 'react'
import { createInterviewRequest } from './actions'
import type { MemberProfile, Student } from './page'
import {
  getDeepDiveList,
  getDeepDiveText,
  normalizeDeepDiveAnswers,
  studentQuestionLayers,
} from '@/lib/studentProfileQuestions'

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
const REEL_WHEEL_THRESHOLD = 18
const REEL_SNAP_LOCK_MS = 520

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

function getPrimaryIndustry(student: Student) {
  return student.desired_industries?.[0] || '志望業界未設定'
}

function getScrollPaddingTop(element: HTMLElement) {
  const value = Number.parseFloat(getComputedStyle(element).scrollPaddingTop)

  return Number.isFinite(value) ? value : 0
}

function canScrollElement(element: HTMLElement, deltaY: number) {
  if (deltaY > 0) {
    return element.scrollTop + element.clientHeight < element.scrollHeight - 1
  }

  return element.scrollTop > 1
}

function shouldLetNestedScrollHandle(target: EventTarget | null, deltaY: number) {
  if (!(target instanceof Element)) {
    return false
  }

  if (target.closest('input, select, textarea')) {
    return true
  }

  const nestedScroller = target.closest<HTMLElement>('.student-profile-scroll, .student-action-panel')

  return nestedScroller ? canScrollElement(nestedScroller, deltaY) : false
}

function getActiveReelIndex(reels: HTMLElement[], scrollContainer: HTMLElement) {
  const containerTop = scrollContainer.getBoundingClientRect().top
  const snapTop = containerTop + getScrollPaddingTop(scrollContainer)

  return reels.reduce((activeIndex, reel, index) => {
    const activeDistance = Math.abs(reels[activeIndex].getBoundingClientRect().top - snapTop)
    const currentDistance = Math.abs(reel.getBoundingClientRect().top - snapTop)

    return currentDistance < activeDistance ? index : activeIndex
  }, 0)
}

function scrollReelIntoView(reel: HTMLElement, scrollContainer: HTMLElement) {
  const targetTop = (
    scrollContainer.scrollTop
    + reel.getBoundingClientRect().top
    - scrollContainer.getBoundingClientRect().top
    - getScrollPaddingTop(scrollContainer)
  )

  scrollContainer.scrollTo({
    behavior: 'smooth',
    top: targetTop,
  })
}

type DeepDiveAnswers = Record<string, string | string[]>

function StudentTags({ deepDiveAnswers, student }: { deepDiveAnswers: DeepDiveAnswers; student: Student }) {
  return (
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
  )
}

function StudentSummaryPanel({ deepDiveAnswers, student }: { deepDiveAnswers: DeepDiveAnswers; student: Student }) {
  return (
    <section className="student-summary-panel">
      <span className="student-side-label">学生サマリー</span>
      <p className="catch-copy">{student.catch_copy}</p>
      <p className="profile-summary">
        {student.profile_summary || 'プロフィール概要は準備中です。'}
      </p>
      <StudentTags deepDiveAnswers={deepDiveAnswers} student={student} />
    </section>
  )
}

function StudentQuickGrid({ age, deepDiveAnswers, mbti }: {
  age: string
  deepDiveAnswers: DeepDiveAnswers
  mbti: string
}) {
  return (
    <dl className="student-quick-grid">
      <div>
        <dt>基本情報</dt>
        <dd>年齢: {age} / MBTI: {mbti}</dd>
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
    </dl>
  )
}

function StudentMoreDetails({ deepDiveAnswers, profile }: {
  deepDiveAnswers: DeepDiveAnswers
  profile: MemberProfile | null
}) {
  return (
    <details className="student-more-panel">
      <summary>さらに表示</summary>

      <section className="student-insight-panel">
        <span className="student-side-label">詳細情報</span>
        <dl>
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
      </section>

      <div className="deep-dive-area">
        {studentQuestionLayers.map((layer, layerIndex) => (
          <details className="deep-dive-layer" key={layer.title} open={layerIndex === 0}>
            <summary>{layer.title}</summary>
            {layer.groups.map((group) => {
              const hasAnswers = group.fields.some((field) => hasFieldValue(deepDiveAnswers, field.id))

              return (
                <div className="deep-dive-group" key={group.title}>
                  <h3>{group.title}</h3>
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
          </details>
        ))}
      </div>
    </details>
  )
}

function InterviewRequestForm({ studentId }: { studentId: string }) {
  return (
    <form action={createInterviewRequest} className="request-form">
      <input name="studentId" type="hidden" value={studentId} />
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
  )
}

type StudentListProps = {
  students: Student[]
}

export function StudentList({ students }: StudentListProps) {
  const feedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const feed = feedRef.current
    const scrollContainer = feed?.closest<HTMLElement>('.members-page')

    if (!feed || !scrollContainer) {
      return
    }

    let wheelDelta = 0
    let snapLockedUntil = 0

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
        return
      }

      if (shouldLetNestedScrollHandle(event.target, event.deltaY)) {
        return
      }

      const now = window.performance.now()

      if (now < snapLockedUntil) {
        event.preventDefault()
        return
      }

      wheelDelta += event.deltaY

      if (Math.abs(wheelDelta) < REEL_WHEEL_THRESHOLD) {
        return
      }

      const reels = Array.from(feed.querySelectorAll<HTMLElement>('.student-reel'))

      if (reels.length === 0) {
        return
      }

      const direction = wheelDelta > 0 ? 1 : -1
      const activeIndex = getActiveReelIndex(reels, scrollContainer)
      const nextIndex = activeIndex + direction

      wheelDelta = 0

      if (nextIndex < 0 || nextIndex >= reels.length) {
        return
      }

      event.preventDefault()
      snapLockedUntil = now + REEL_SNAP_LOCK_MS
      scrollReelIntoView(reels[nextIndex], scrollContainer)
    }

    feed.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      feed.removeEventListener('wheel', handleWheel)
    }
  }, [])

  return (
    <div className="student-feed" ref={feedRef} aria-label="企業会員向け学生フィード">
      <div className="student-feed-rail" aria-hidden="true">
        <span>Profiles</span>
        <strong>{students.length}</strong>
      </div>

      <div className="student-reel-stack">
        {students.map((student, index) => {
          const profile = normalizeProfile(student.student_member_profiles)
          const deepDiveAnswers = normalizeDeepDiveAnswers(profile?.deep_dive_answers)
          const displayName = profile?.real_name || student.display_name
          const videoTheme = VIDEO_THEMES[index % VIDEO_THEMES.length]
          const age = getDeepDiveText(deepDiveAnswers, 'age') || '未登録'
          const mbti = getDeepDiveText(deepDiveAnswers, 'mbti') || '任意未登録'

          return (
            <article className="student-reel" id={`student-${student.id}`} key={student.id}>
              <aside className="student-basic-panel" aria-label={`${displayName}の基本情報`}>
                <div className="student-panel-header">
                  <div className="student-face" aria-hidden="true">
                    {student.profile_image_url ? (
                      <img
                        src={student.profile_image_url}
                        alt=""
                        loading="lazy"
                        style={getProfileImageStyle(student.profile_image_url)}
                      />
                    ) : (
                      <span>{student.initials}</span>
                    )}
                  </div>
                  <div className="student-title">
                    <p>{student.faculty} / {student.grade}</p>
                    <h2>{displayName}</h2>
                    <span>{student.location || '地域未設定'} / {getPrimaryIndustry(student)}</span>
                  </div>
                  <strong>{student.initials}</strong>
                </div>

                <div className="student-profile-scroll">
                  <StudentSummaryPanel deepDiveAnswers={deepDiveAnswers} student={student} />
                  <StudentQuickGrid age={age} deepDiveAnswers={deepDiveAnswers} mbti={mbti} />
                  <StudentMoreDetails deepDiveAnswers={deepDiveAnswers} profile={profile} />
                </div>
              </aside>

              <div className="student-reel-stage">
                <div className={`member-short-video student-reel-video ${videoTheme}`}>
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
                    <img
                      src={student.profile_image_url}
                      alt=""
                      loading="lazy"
                      style={getProfileImageStyle(student.profile_image_url)}
                    />
                  ) : null}
                </div>
              </div>

              <details className="mobile-student-details">
                <summary>
                  <span className="mobile-reel-copy">
                    <strong>{displayName}</strong>
                    <span>{student.catch_copy}</span>
                  </span>
                  <span className="mobile-detail-button-label">学生の詳細</span>
                </summary>
                <div className="mobile-student-sheet">
                  <span className="mobile-sheet-handle" aria-hidden="true" />
                  <div className="mobile-sheet-heading">
                    <div className="mobile-student-face" aria-hidden="true">
                      {student.profile_image_url ? (
                        <img
                          src={student.profile_image_url}
                          alt=""
                          loading="lazy"
                          style={getProfileImageStyle(student.profile_image_url)}
                        />
                      ) : (
                        <span>{student.initials}</span>
                      )}
                    </div>
                    <div>
                      <p>{student.faculty} / {student.grade}</p>
                      <h3>{displayName}</h3>
                      <span>{student.location || '地域未設定'} / {getPrimaryIndustry(student)}</span>
                    </div>
                  </div>

                  <StudentSummaryPanel deepDiveAnswers={deepDiveAnswers} student={student} />
                  <StudentQuickGrid age={age} deepDiveAnswers={deepDiveAnswers} mbti={mbti} />
                  <StudentMoreDetails deepDiveAnswers={deepDiveAnswers} profile={profile} />

                  <section className="mobile-request-panel">
                    <div className="student-action-header">
                      <span>Next Action</span>
                      <h3>面談リクエスト</h3>
                      <p>{profile?.meeting_preference || '面談希望未設定'}</p>
                    </div>
                    <InterviewRequestForm studentId={student.id} />
                    {student.tiktok_url && (
                      <a className="secondary-action-link" href={student.tiktok_url} rel="noreferrer" target="_blank">
                        TikTok動画を開く
                      </a>
                    )}
                  </section>
                </div>
              </details>

              <aside className="student-action-panel" aria-label={`${displayName}へのCTA`} id={`request-${student.id}`}>
                <div className="student-action-header">
                  <span>Next Action</span>
                  <h3>面談リクエスト</h3>
                  <p>{profile?.meeting_preference || '面談希望未設定'}</p>
                </div>

                <InterviewRequestForm studentId={student.id} />

                {student.tiktok_url && (
                  <a className="secondary-action-link" href={student.tiktok_url} rel="noreferrer" target="_blank">
                    TikTok動画を開く
                  </a>
                )}
              </aside>
            </article>
          )
        })}
      </div>
    </div>
  )
}
