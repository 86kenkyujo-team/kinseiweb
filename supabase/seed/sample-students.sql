-- Sample student data for local verification / MVP demo.
-- Apply after supabase/migrations/20260504000000_member_schema.sql.

insert into public.students (
  id,
  display_name,
  initials,
  faculty,
  grade,
  location,
  attributes,
  desired_industries,
  catch_copy,
  profile_summary,
  publication_status
) values
(
  '00000000-0000-4000-8000-000000000101',
  'K.T.',
  'K.T.',
  '経営学部',
  '3年',
  '大阪',
  array['長期インターン', '企画', '関西'],
  array['人材', '営業'],
  '人の挑戦を近くで支える仕事がしたい。',
  '学生団体の企画運営や協賛企業との打ち合わせを経験。',
  'published'
),
(
  '00000000-0000-4000-8000-000000000102',
  'M.S.',
  'M.S.',
  '総合社会学部',
  '2年',
  '奈良',
  array['SNS運用', '編集', '発信力'],
  array['広告', '企画'],
  '生活者の気持ちが動く瞬間を設計したい。',
  'SNS運用や学生向けイベントの告知制作を経験。',
  'published'
),
(
  '00000000-0000-4000-8000-000000000103',
  'R.N.',
  'R.N.',
  '情報学部',
  '3年',
  '兵庫',
  array['開発', '業務改善'],
  array['IT', 'DX'],
  '技術で現場の面倒を減らす仕組みを作りたい。',
  'サークル内の出欠管理や資料整理を改善する小さなツールを制作。',
  'published'
)
on conflict (id) do update set
  display_name = excluded.display_name,
  initials = excluded.initials,
  faculty = excluded.faculty,
  grade = excluded.grade,
  location = excluded.location,
  attributes = excluded.attributes,
  desired_industries = excluded.desired_industries,
  catch_copy = excluded.catch_copy,
  profile_summary = excluded.profile_summary,
  publication_status = excluded.publication_status;

insert into public.student_member_profiles (
  student_id,
  real_name,
  values_text,
  thinking_style,
  career_axis,
  motivation_detail,
  decision_axis,
  future_vision,
  deep_dive_answers,
  meeting_preference
) values
(
  '00000000-0000-4000-8000-000000000101',
  '北島 太一',
  '成長実感 / 誠実さ',
  '誰かの挑戦に伴走しながら成果を作ることを重視。',
  array['長期的な信頼関係を作れること', '若手でも裁量を持てること', 'プロセスの誠実さを大切にする文化'],
  '人材業界に関心を持ったきっかけは、周囲の友人が就活で悩む姿を見たこと。',
  '人に向き合える環境',
  '採用や育成の現場で、次の一歩が見える相談相手になりたい。',
  '[{"question":"どんな企業に惹かれますか？","answer":"若手を一人の担当者として育てる企業です。"}]'::jsonb,
  'オンライン可'
),
(
  '00000000-0000-4000-8000-000000000102',
  '南 咲良',
  '共感設計 / 表現力',
  '相手の中にある違和感や欲求を丁寧に拾うことを大切にしている。',
  array['生活者理解を起点に企画を作れること', 'SNSや動画領域を活かせること', '仮説検証で表現を磨けること'],
  '広告・企画に惹かれる理由は、人の選択や行動が変わる瞬間を設計できるから。',
  '生活者の気持ちに近い仕事',
  'ブランドと生活者の距離を近づける企画担当を目指している。',
  '[{"question":"どんな仕事に燃えますか？","answer":"反応を想像しながら言葉や構成を磨く仕事です。"}]'::jsonb,
  'オンライン可'
),
(
  '00000000-0000-4000-8000-000000000103',
  '中村 蓮',
  '仕組み化 / 改善思考',
  '現場で困っている人の時間や手間を減らすことに関心が強い。',
  array['ユーザーに近い距離で開発できること', '運用後の改善まで見られること', '技術力と業務理解を伸ばせること'],
  'IT業界を志望する理由は、仕組みを作れば多くの人の負担を継続的に減らせるから。',
  '現場課題に近い開発',
  '技術と現場をつなぐプロダクトマネージャーに近いエンジニアを目指している。',
  '[{"question":"開発で大切にしていることは？","answer":"説明なしでも自然に使え、あとから改善しやすいことです。"}]'::jsonb,
  'オンライン可 / 対面相談可'
)
on conflict (student_id) do update set
  real_name = excluded.real_name,
  values_text = excluded.values_text,
  thinking_style = excluded.thinking_style,
  career_axis = excluded.career_axis,
  motivation_detail = excluded.motivation_detail,
  decision_axis = excluded.decision_axis,
  future_vision = excluded.future_vision,
  deep_dive_answers = excluded.deep_dive_answers,
  meeting_preference = excluded.meeting_preference;
