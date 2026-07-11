# KINSEI TOP Page Design Direction

## Purpose

KINSEI の TOP ページは、理念型の団体紹介から、学生の実績・挑戦・企業接点を可視化するキャリアプラットフォームとして見える状態へ刷新する。

第一印象では「先進性」「信頼感」「実績でつながる」を伝える。装飾は AI / データ / マッチングの印象を支えるために使い、何のサービスか分からない抽象表現だけで終わらせない。

## Visual Theme

- White and pale blue SaaS interface.
- Glassmorphism surfaces with soft borders and restrained shadows.
- Deep navy text for readability.
- Bright blue accents for actions, metrics, and active states.
- Human photos should remain visible to prevent the page from feeling too abstract.

## Color Roles

- Base: `#f7fbff`, `#eef6ff`, `#ffffff`
- Primary: `#1769e8`
- Primary dark: `#0b3f9f`
- Accent cyan: `#58c4ff`
- Text: `#0f1f3a`
- Muted text: `#5f7190`
- Border: `rgba(62, 122, 220, 0.18)`
- Footer: `#061b3d`, `#082b64`

Avoid heavy beige, brown, purple-dominant gradients, and dark hero sections for this refreshed TOP.

## Typography

- Use bold Japanese display type for the hero message.
- Keep letter spacing at `0`.
- Hero text can be large, but compact cards and navigation must use smaller, stable sizes.
- Important words such as `実績` may use blue emphasis, but do not over-highlight every phrase.

## Layout Principles

- First viewport should immediately show:
  - KINSEI brand
  - Who it is for
  - What action to take
  - A product-like visual of achievement data and matching
- Desktop hero may use a two-column composition:
  - Left: headline, body, search/CTA
  - Right: K symbol, people, floating data cards
- Mobile hero should simplify:
  - Headline
  - Short copy
  - Primary CTA
  - Compact visual
  - Search chips or stats below

## Components

- Header:
  - White or translucent glass surface.
  - K logo at left.
  - Navigation: サービス, 仕組み, 実績・事例, メンバー, 企業の方へ.
  - Actions: ログイン, 無料で始める or お問い合わせ.
  - Mobile navigation uses a solid white panel rather than a translucent overlay.
  - Each mobile menu item is a separate pale-blue row with a visible blue-gray border, deep navy text, and at least 46px tap height.
  - The active item uses a stronger blue surface and accent edge. Login and registration actions use solid primary blue so they remain distinct from navigation links.

- Hero:
  - Soft radial blue background.
  - Large K mark or AI/data ring visual.
  - Real member/student imagery where available.
  - Floating glass cards for project growth, skill analysis, matching, or student profile.

- Search bar:
  - A visual entry point for "まずは探してみる".
  - If no real search is implemented, link the button to the student database or contact route.

- Metrics:
  - 3 to 4 cards maximum in the first band.
  - Use honest current numbers or clearly label draft numbers before launch.

- Audience switch:
  - Two segmented panels: 学生の方へ / 企業の方へ.
  - Active state should be clear with a blue border and subtle pointer.

- Feature cards:
  - 4 cards: 実績を見える化, 最適なマッチング, 成長支援, 信頼ネットワーク.
  - Icons should be simple and blue.

- Steps:
  - 3 steps: プロフィール登録, 実績をつくる, 企業と出会う.
  - Use arrows on desktop, vertical flow on mobile.

- Partner logos:
  - Use real logos only with permission.
  - If unavailable, avoid fake brand names in production; use "導入企業ロゴ掲載予定" or omit.

- Members:
  - Use existing portraits.
  - Keep cards restrained and readable.

- Final CTA:
  - Strong blue gradient block.
  - Provide two real actions: LINE / メール / 問い合わせ / 学生DB.

- Footer:
  - Deep navy.
  - Organized links and contact route.

## Responsive Rules

- Check around 390px width.
- Floating cards should collapse or hide on mobile instead of overlapping text.
- Buttons and chips must wrap cleanly.
- Search bar becomes vertical on mobile.
- Metrics become two columns or one column depending on available width.
- No text should overlap decorative rings, people images, or cards.

## Motion Rules

- Use motion to express data, matching, and student growth rather than pure decoration.
- Prefer soft fade-in, slight lift, and subtle parallax over abrupt or bouncy movement.
- Hero visuals may float, pulse, or orbit slowly, but primary copy and CTA must remain stable and readable.
- Metrics can count up once when entering the viewport.
- Sponsor carousels should feel active and premium, with gentle continuous movement and hover pause.
- Respect `prefers-reduced-motion` by removing non-essential animation and keeping all content visible.

## Do

- Make the product feel active, data-backed, and human.
- Use existing KINSEI copy where it still fits: "学歴ではなく、実歴で戦え。"
- Keep the TOP conversion paths obvious.
- Use actual available photos for members where possible.

## Do Not

- Do not copy the reference layout exactly.
- Do not use placeholder company logos as if they are real sponsors.
- Do not let AI-like visuals obscure the service purpose.
- Do not ship CTA links that remain `#`.
- Do not place nested cards inside cards.
