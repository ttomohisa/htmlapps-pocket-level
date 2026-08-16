# Pocket Level

[![GitHub Pages](https://github.com/ttomohisa/htmlapps-pocket-level/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ttomohisa/htmlapps-pocket-level/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Single HTML](https://img.shields.io/badge/distribution-single%20HTML-0ea5e9)](https://ttomohisa.github.io/htmlapps-pocket-level/)

[English README](README.md)

スマートフォンを**水平器・傾斜計**として使える、インストール不要・プライバシー重視の単一HTMLアプリです。端末の傾きセンサーをブラウザーから直接読み取り、ネイティブアプリをインストールせずに水平・垂直・傾斜を確認できます。

## 🚀 デモ

### [GitHub PagesでPocket Levelを開く](https://ttomohisa.github.io/htmlapps-pocket-level/)

最初のHTMLはGitHub Pagesから配信されますが、センサー値の取得・校正・平均化・画面表示は端末内で処理されます。ランタイムCDN、解析タグ、テレメトリ、アカウント、外部APIはありません。

[![Pocket Levelの画面](assets/screenshot.png)](https://ttomohisa.github.io/htmlapps-pocket-level/)

<img src="assets/screenshot-mobile.png" alt="Pocket Level スマホ表示" width="320">

## 主な機能

- **平面モード** — 2軸の気泡表示、X/Y角度、合成傾斜角
- **辺・垂直モード** — 棚板の辺、壁、柱などを1軸で水平・垂直確認
- 角度に加えて**勾配 %**を表示
- **ゼロ設定** — 現在の角度を一時的な0°基準として利用
- **固定 / 再開** — 読み値を保持したままスマホを動かせる
- 水平判定の許容誤差を ±0.1° / ±0.3° / ±0.5° / ±1.0° から選択
- **安定度表示** — 直近のセンサー値の揺れから測定状態を表示
- 水平に入った瞬間の音・振動通知（対応端末のみ）
- 測定中の画面消灯を抑えるScreen Wake Lock（対応ブラウザーのみ）
- **2秒平均** — 2秒分のセンサー値を平均し、ばらつきも表示
- **180°反転の2点校正** — 同じ面を180°回して2回測り、端末側のX/Yセンサー偏りを推定
- センサー未対応・権限拒否・HTTPS必須・イベント未受信などを検出して理由を表示
- 日本語 / Englishを1つのHTML内で切り替え
- スマホでは親指で操作しやすい画面下部の操作バー
- 外部ランタイムライブラリなし

## 180°反転の2点校正について

通常の**ゼロ設定**は、基準にした面そのものが正しい角度であることを前提とします。Pocket Levelでは、完全に水平な基準面を用意しにくい場合向けに、同じ面をスマホだけ180°回して2回測る校正方法を用意しています。

概念的には、

```text
m1 = surface + deviceBias
m2 = -surface + deviceBias
```

なので、

```text
(m1 + m2) / 2 ≈ deviceBias
```

として、端末側に一定して存在するセンサー偏りを推定します。

ただし、ケース、ボタン、丸みのある側面、カメラの出っ張りなどによって**接地状態そのものが変わる誤差**は補正できません。本アプリは手軽な確認用であり、精度保証された施工・測量機器の代替ではありません。

## すぐに使う

### Webで使う

スマートフォンで[デモを開く](https://ttomohisa.github.io/htmlapps-pocket-level/)だけで利用できます。インストールやアカウント登録は不要です。

1. **測定を開始**をタップします。
2. ブラウザーからモーション / 傾きセンサーの利用許可を求められた場合は許可します。
3. 平らな面では**平面**、棚板の辺や壁の垂直確認では**辺・垂直**を使います。
4. 現在の角度を基準にしたい場合は**ゼロ設定**を使います。
5. スマホを動かしても値を残したい場合は**固定**を使います。

### HTMLをダウンロードして使う

`dist/index.html` は完全内包の単一HTMLなので、ローカルファイルとしてUIを開くこと自体はできます。

ただし、スマートフォンのブラウザーによっては `file://` で開いたHTMLからモーションセンサーを利用できません。Pocket Levelが「センサー値を取得できない」と表示した場合は、GitHub Pages / Browser Kittyなど**HTTPSで配信されたページ**から利用してください。

バックエンドAPIやアプリサーバーは不要です。ブラウザーがSecure Contextを要求する場合でも、HTTPSの静的ホスティングだけで利用できます。

## センサーが使えない場合

Pocket Levelは、実際のセンサー値が1件届くまで `0.0°` を「測定中の値」として表示しません。

開始画面では、以下のような状態を検出して理由を表示します。

- Device Orientation APIに未対応
- ブラウザーがHTTPSを必要としている安全でないコンテキスト
- モーション / 傾きセンサーの権限拒否
- `file://` で開いたHTMLにセンサーイベントが届かない
- API自体は存在するが、有効な傾きセンサー値が届かない端末・ブラウザー

利用不能が確定した場合は、動かない**測定を開始**ボタンを残さず無効化します。

## 精密測定機能

### 2秒平均

2秒間のセンサー値を集めて平均し、その間のばらつきも表示します。手持ちの微細な揺れで瞬間値が読みづらいときに使えます。

### 180°反転の2点校正

1. 同じ面にスマホを置き、1点目を記録します。
2. スマホの同じ面を接地したままにします。
3. 平面上でスマホを180°回転します。
4. 2点目を記録します。
5. Pocket LevelがX/Y方向の一定したセンサー偏りを推定して補正値として保存します。

校正値は設定画面からリセットできます。

## GitHub Pagesで公開する

このリポジトリには、単一HTMLをビルド・検証して `dist/` をGitHub Pagesへ自動公開するワークフローが含まれています。

1. リポジトリ名を `htmlapps-pocket-level` としてGitHubへプッシュします。
2. **Settings → Pages → Build and deployment → Source** で **GitHub Actions** を選択します。
3. `main` へプッシュするか、Actions画面から **Deploy GitHub Pages** を手動実行します。
4. ビルド成功後、`https://ttomohisa.github.io/htmlapps-pocket-level/` で公開されます。

公開時には生成物を再ビルドし、リポジトリチェックに通過した `dist/` をデプロイします。

## 開発とビルド構成

```text
.
├─ src/index.template.html       # アプリ本体
├─ app.config.json               # アプリ名・バージョンなどの設定
├─ dependencies.json             # 内包依存定義（現在は依存なし）
├─ build-standalone.bat          # Windows用ビルド入口
├─ build-standalone.ps1          # 単一HTML生成処理
├─ scripts/check-repository.ps1  # ビルド + リポジトリ検証
├─ dist/index.html               # 可読な単一HTML生成物
├─ dist/index.self-extract.html  # gzip自己展開版
└─ .github/workflows/
   ├─ build-standalone.yml       # ビルド検証
   └─ deploy-pages.yml           # GitHub Pages自動公開
```

### Windowsでビルド

```bat
build-standalone.bat
```

またはリポジトリ全体をチェックします。

```powershell
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-repository.ps1
```

生成物:

- `dist/index.html`
- `dist/index.self-extract.html`
- `dist/build-manifest.json`
- `dist/dependency-manifest.json`

編集するのは `src/index.template.html` です。`dist/` の生成物は直接編集しないでください。

## プライバシーと通信防止

Pocket Levelはローカル処理を前提にしています。

- センサー値はブラウザーのメモリ内だけで処理
- 校正値・設定は利用可能な場合のみ `localStorage` に保存
- カメラ / マイク / GPS / アカウント / クラウドストレージ不使用
- Analytics / Telemetryなし
- 外部ランタイムライブラリなし
- 生成HTMLのContent Security Policyに `connect-src 'none'` を設定

GitHub Pages版では最初のHTML配信だけ通信が発生しますが、測定したセンサー値をアプリが外部へ送信することはありません。

## 制限事項

- センサー精度は端末・ブラウザー・端末自身の校正状態・ケース・接地方法によって異なります。
- カメラの出っ張り、丸みのあるケース、側面ボタンなどによる物理的な誤差はセンサー校正だけでは補正できません。
- ブラウザーによっては `file://` でDevice Orientation / Motionを利用できないため、その場合はHTTPSで開く必要があります。
- iOSなど一部ブラウザーでは、ユーザーのタップ操作を起点にモーション / 傾きセンサー権限を要求する必要があります。
- Wake Lock・振動・音通知は端末やブラウザーの対応状況、ユーザー設定に依存します。
- 本アプリは校正証明された測定器ではありません。専門機器の精度が必要な用途には使用しないでください。

## 使用ライブラリ

Pocket Levelは現在、**外部ランタイムライブラリを使用していません**。センサー取得、校正、描画、UI、保存、平均化はブラウザー標準APIとアプリ内コードで実装しています。

依存関係の情報は [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) を確認してください。

## コントリビューション

バグ報告や機能提案はGitHub Issuesからお願いします。開発への参加方法は [CONTRIBUTING.md](CONTRIBUTING.md) を確認してください。

## ライセンス

Copyright © 2026 ttomohisa

このプロジェクトは [MIT License](LICENSE) で公開されています。
