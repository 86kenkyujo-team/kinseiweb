# WordPress 移行・クライアント譲渡 要件定義書

作成日: 2026-05-21  
対象: KINSEI 公式サイト / 学生データベース / 企業会員データベース  
方針: 公開サイトは WordPress、会員 DB 機能は Next.js + Supabase を継続

## 1. 目的

現在の KINSEI サイトを、クライアントが公開コンテンツを自分たちで更新できる形にする。

ただし、学生データベース、企業ログイン、会員判定、面談リクエスト、運営管理画面は、既存の Next.js + Supabase 実装を維持する。

WordPress 化の目的は、すべての機能を WordPress に置き換えることではなく、クライアントが日常的に更新する公開サイト部分を CMS 化することである。

## 2. 基本方針

- 公開マーケティングサイトは WordPress で管理する。
- 学生 DB、企業会員 DB、ログイン、管理画面は Next.js + Supabase で管理する。
- WordPress には Supabase の秘密鍵や会員限定データを置かない。
- クライアント譲渡後も、学生情報の公開/非公開制御は Supabase 側を正とする。
- まずはハイブリッド構成で移行し、完全 WordPress 化は将来検討とする。

## 3. 対象範囲

### 3.1 WordPress 化する範囲

- TOP ページ
- 企業向けページ
- 協賛企業一覧
- 実績・事例
- メンバー / メンター紹介
- お問い合わせ導線
- フッター、グローバルナビ
- SEO メタ情報
- OGP 画像
- サイトマップ
- robots.txt
- 必要に応じたニュース / お知らせ

### 3.2 Next.js + Supabase を維持する範囲

- 公開学生 DB: `/students`
- 企業ログイン: `/login`
- 企業会員 DB: `/members/students`
- 会員状態確認画面: `/membership-inactive`
- 運営管理画面: `/admin`
- Supabase Auth
- Supabase Postgres
- RLS による閲覧制御
- 面談リクエスト
- 学生情報、企業情報、管理ログ

### 3.3 初期移行でやらないこと

- 学生 DB を WordPress カスタム投稿へ移すこと
- 企業ログインを WordPress ユーザーへ移すこと
- Supabase RLS を WordPress 権限で再実装すること
- 決済機能を WordPress に追加すること
- 学生アカウントを作ること

## 4. 推奨アーキテクチャ

### 4.1 推奨構成

```txt
WordPress
- https://kinsei.example/
- 公開サイト、LP、企業向け情報、協賛企業、事例、メンバー、問い合わせ

Next.js + Supabase
- https://app.kinsei.example/
- 学生 DB、ログイン、企業会員 DB、管理画面
```

サブドメインで分ける構成を推奨する。

理由:

- WordPress ホスティングと Vercel/Next.js の責務を分けやすい
- WordPress 側の不具合が会員 DB に波及しにくい
- Supabase Auth のログイン Cookie を app 側に閉じ込めやすい
- 譲渡時に「クライアントが触る場所」と「システム管理者が触る場所」を説明しやすい

### 4.2 同一ドメイン構成を選ぶ場合

```txt
https://kinsei.example/
https://kinsei.example/students
https://kinsei.example/login
https://kinsei.example/members/students
```

この場合は、WordPress と Next.js を同一ドメイン配下で出し分けるため、リバースプロキシ、Vercel rewrites、またはホスティング側のルーティング設計が必要になる。

初期移行では、実装難易度が上がるため優先度は低い。

## 5. URL 設計

### 5.1 WordPress 側 URL

| ページ | 推奨 URL | 内容 |
| --- | --- | --- |
| TOP | `/` | サービス全体の入口 |
| 企業向け | `/for-companies/` | 導入メリット、プラン、問い合わせ |
| 協賛企業 | `/sponsors/` | 協賛企業一覧 |
| 実績・事例 | `/cases/` | 学生の挑戦、企業接点の事例 |
| メンバー | `/members/` | メンター、運営メンバー |
| お問い合わせ | `/contact/` | 問い合わせフォームまたは導線 |
| プライバシーポリシー | `/privacy/` | 個人情報の取り扱い |

### 5.2 Next.js 側 URL

| ページ | URL | 内容 |
| --- | --- | --- |
| 公開学生 DB | `/students` | Supabase の公開学生データを表示 |
| ログイン | `/login?next=/members/students` | 企業会員ログイン |
| 企業会員 DB | `/members/students` | 有効企業会員のみ閲覧 |
| 会員状態確認 | `/membership-inactive` | 契約状態が無効な企業向け |
| 管理画面 | `/admin` | 運営専用 |

### 5.3 旧 URL のリダイレクト

| 旧 URL | 新 URL |
| --- | --- |
| `/index.html` | `/` |
| `/sponsor.html` | `/for-companies/` |
| `/sponsors_list.html` | `/sponsors/` |
| `/students.html` | `https://app.kinsei.example/students` |
| `/members-students-demo.html` | `https://app.kinsei.example/login?next=/members/students` |

## 6. WordPress 機能要件

### 6.1 固定ページ

WordPress 管理画面から以下を編集できること。

- TOP のヒーローコピー
- CTA 文言とリンク先
- サービス説明
- 利用の流れ
- 実績・事例セクション
- 協賛企業セクション
- メンバー紹介
- 企業向けページの本文
- お問い合わせ導線

### 6.2 カスタム投稿タイプ

以下のカスタム投稿タイプを用意する。

| 投稿タイプ | 用途 | 主な項目 |
| --- | --- | --- |
| `sponsor` | 協賛企業 | 企業名、ロゴ、紹介文、業種、掲載順、リンク |
| `case` | 実績・事例 | タイトル、カテゴリ、成果、本文、画像、関連企業 |
| `mentor` | メンター/メンバー | 氏名、肩書き、プロフィール、画像、専門領域 |
| `faq` | よくある質問 | 質問、回答、対象者 |
| `news` | お知らせ | タイトル、本文、公開日 |

### 6.3 編集権限

| 権限 | できること |
| --- | --- |
| 管理者 | テーマ、プラグイン、ユーザー、全コンテンツ管理 |
| 編集者 | 固定ページ、投稿、画像、協賛企業、事例、メンバー編集 |
| 投稿者 | お知らせ、事例の下書き作成 |

クライアントには原則として編集者権限を渡し、テーマやプラグインの破壊的変更は管理者だけが行う。

### 6.4 画像管理

- 現在使用している画像素材を WordPress メディアライブラリへ移行する。
- 画像の権利、生成画像の利用可否、人物写真の掲載同意を確認する。
- OGP 画像、ロゴ、協賛企業ロゴは用途ごとに整理する。
- 画像差し替え時にレイアウトが崩れないよう、推奨サイズを管理画面に明記する。

### 6.5 問い合わせ

問い合わせは以下のいずれかで実装する。

- WordPress フォームから指定メールへ送信
- 外部フォームへリンク
- LINE / メール / CRM への導線

問い合わせフォームでは、学生の会員限定情報や機密情報を入力させない。

## 7. デザイン要件

- 現在の TOP リデザインの世界観を維持する。
- 白、淡い青、濃紺、明るい青を基調とする。
- 企業向けページ、協賛企業ページも TOP と同じナビゲーション体系にする。
- PC とスマホ 390px 前後で表示崩れがないこと。
- CTA は必ず実際に遷移できるリンクにする。
- 協賛企業ロゴや事例は、実在確認と掲載許諾が取れたものだけを本番掲載する。
- WordPress 編集画面で文章量が多少変わっても、カードやボタンから文字がはみ出さないこと。

## 8. Next.js / Supabase 連携要件

### 8.1 アプリ側に残す機能

- Supabase Auth による企業ログイン
- `companies.membership_status` による会員判定
- `students.publication_status = published` の公開学生表示
- `student_member_profiles` の会員限定表示
- `interview_requests` の送信
- `/admin` の管理画面

### 8.2 WordPress からアプリへの導線

WordPress 側の CTA は以下へ接続する。

```txt
学生DBを見る -> https://app.kinsei.example/students
企業会員DB -> https://app.kinsei.example/login?next=/members/students
```

### 8.3 アプリから WordPress への導線

サブドメイン分離する場合、Next.js 側のヘッダーやフッターは相対パスではなく、環境変数で WordPress の URL を参照する。

追加推奨環境変数:

```txt
NEXT_PUBLIC_MARKETING_SITE_URL=https://kinsei.example
NEXT_PUBLIC_APP_SITE_URL=https://app.kinsei.example
```

例:

```txt
TOP -> ${NEXT_PUBLIC_MARKETING_SITE_URL}/
企業の方へ -> ${NEXT_PUBLIC_MARKETING_SITE_URL}/for-companies/
協賛企業 -> ${NEXT_PUBLIC_MARKETING_SITE_URL}/sponsors/
お問い合わせ -> ${NEXT_PUBLIC_MARKETING_SITE_URL}/contact/
```

### 8.4 Supabase 設定

Supabase Auth の Redirect URL / Site URL にアプリ側ドメインを登録する。

必要な登録例:

```txt
https://app.kinsei.example/login
https://app.kinsei.example/members/students
https://app.kinsei.example/admin
```

WordPress 側には Supabase の service role key を置かない。

## 9. データ移行要件

### 9.1 WordPress へ移行するデータ

- TOP ページ本文
- 企業向けページ本文
- 協賛企業情報
- 事例情報
- メンバー情報
- 画像素材
- SEO タイトル / ディスクリプション
- OGP 画像

### 9.2 WordPress へ移行しないデータ

- 学生の会員限定プロフィール
- 企業アカウント情報
- Supabase Auth ユーザー
- 面談リクエスト
- 管理ログ
- RLS ポリシー

## 10. セキュリティ要件

- WordPress 管理画面には強力なパスワードと 2FA を設定する。
- WordPress 管理者権限を渡す人数を最小限にする。
- Supabase の service role key は WordPress に保存しない。
- Next.js / Vercel の環境変数は譲渡時に一覧化するが、公開ドキュメントには記載しない。
- 学生の個人情報、会員限定情報、企業契約情報は Supabase 側で管理する。
- WordPress のフォームから機密情報を収集しない。
- バックアップと復旧手順を引き渡す。

## 11. 譲渡要件

### 11.1 クライアントへ渡すもの

- WordPress 管理画面 URL
- WordPress 編集者アカウント
- WordPress 操作マニュアル
- 投稿タイプごとの入力ルール
- 画像推奨サイズ
- CTA リンク一覧
- 公開前チェックリスト

### 11.2 システム管理者が保持または共同管理するもの

- GitHub リポジトリ
- Vercel プロジェクト
- Supabase プロジェクト
- ドメイン DNS
- 本番環境変数
- バックアップ設定

完全譲渡する場合は、上記アカウントのオーナー権限移管と、支払い方法の移管も必要になる。

## 12. 運用要件

- WordPress の本文更新はクライアントが行う。
- 学生 DB の登録、公開、会員限定情報の管理は `/admin` で運営が行う。
- 企業会員の契約状態は Supabase の `companies.membership_status` を正とする。
- 協賛企業や事例の掲載可否は、公開前に掲載許諾を確認する。
- 公開サイトの文言変更とアプリ側の会員機能変更は、別の更新フローとして扱う。

## 13. 移行ステップ

### Phase 0: 事前決定

- 本番ドメインを決める
- WordPress ホスティングを決める
- サブドメイン構成にするか、同一ドメイン構成にするか決める
- クライアントが編集したい範囲を確定する
- 協賛企業、事例、人物写真の掲載許諾を確認する

### Phase 1: WordPress 構築

- WordPress テーマまたはブロック構成を作る
- TOP、企業向け、協賛企業、事例、メンバーを実装する
- カスタム投稿タイプを作る
- 管理画面の入力項目を整える
- SEO、OGP、サイトマップを設定する

### Phase 2: Next.js 側の導線調整

- アプリ側のヘッダーリンクを WordPress 本番 URL に接続する
- `NEXT_PUBLIC_MARKETING_SITE_URL` を導入する
- `/students`、`/login`、`/members/students` の動作を確認する
- Supabase Auth の Redirect URL を本番ドメインに合わせる

### Phase 3: ステージング確認

- WordPress ステージング URL で表示確認する
- app 側ステージング URL と CTA を接続する
- PC とスマホ 390px 前後で確認する
- フォーム送信を確認する
- ログイン後の企業会員 DB を確認する
- 会員ステータス無効時の画面を確認する

### Phase 4: 本番切り替え

- DNS を切り替える
- リダイレクトを設定する
- Search Console / Analytics を設定する
- 主要ページの 200 / 301 / 307 を確認する
- 問い合わせの受信を確認する
- ログインと会員 DB を確認する

### Phase 5: 譲渡

- WordPress 操作説明を行う
- アカウント権限を整理する
- 更新マニュアルを渡す
- 緊急時の連絡先と復旧手順を渡す
- 運用保守範囲を合意する

## 14. 受け入れ条件

- クライアントが WordPress 管理画面から TOP の文言と画像を変更できる。
- クライアントが協賛企業、事例、メンバーを追加・編集できる。
- `学生DBを見る` から Next.js の `/students` へ遷移できる。
- `企業会員DB` から `/login?next=/members/students` へ遷移できる。
- ログイン済み有効企業だけが `/members/students` を閲覧できる。
- 無効会員は `/membership-inactive` に誘導される。
- WordPress 側に Supabase の秘密鍵が存在しない。
- 旧 URL から新 URL へ適切にリダイレクトされる。
- PC とスマホで主要ページに表示崩れがない。
- 問い合わせが指定先に届く。
- 譲渡後の更新マニュアルが用意されている。

## 15. 主なリスク

| リスク | 内容 | 対策 |
| --- | --- | --- |
| ドメイン設計の複雑化 | WordPress と Next.js の出し分けが複雑になる | 初期はサブドメイン分離にする |
| デザイン再現のズレ | WordPress テーマ化で現在の見た目が崩れる | 先にデザイン基準と主要コンポーネントを固定する |
| 権限管理の混乱 | WordPress 管理と Supabase 管理が混ざる | 役割分担をマニュアル化する |
| 機密情報の誤配置 | WordPress に Supabase 秘密鍵を置いてしまう | WordPress は公開サイト専用にする |
| URL 変更によるリンク切れ | 旧 HTML URL が残る | リダイレクト一覧を作り、本番前に確認する |
| クライアント編集による崩れ | 長文や大画像でカードが崩れる | 入力制限、推奨サイズ、プレビュー確認を設ける |

## 16. 未決定事項

- 本番ドメイン名
- WordPress ホスティング
- サブドメイン構成か同一ドメイン構成か
- お問い合わせの送信先
- 協賛企業ロゴの掲載許諾
- 事例掲載の許諾
- 画像素材の権利確認
- クライアントへ渡す権限範囲
- Vercel / Supabase / GitHub まで完全譲渡するか、保守契約で管理するか

## 17. 推奨結論

初期移行では、公開サイトだけを WordPress 化し、学生 DB と企業会員 DB は Next.js + Supabase のまま維持する。

この構成であれば、クライアントは WordPress で日常的な更新ができ、既存のログイン、会員判定、学生データ保護は壊さずに運用できる。
