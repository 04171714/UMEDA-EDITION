# UMEDA Edition（外部公開版）

梅田で働く男たちの装いと美学を記録するWebマガジン「UMEDA Edition」のサイト一式です。
無料の **GitHub**（ファイル置き場）と **Netlify**（公開サーバー）で動きます。
記事の追加・編集は、サイトの `/admin/` にある編集画面（Decap CMS）から行い、保存するとサイトに自動で反映されます。
**閲覧する人はログイン不要・アカウント不要** です。

---

## 1. 公開までの手順（初回だけ・30分ほど）

### ① GitHubにファイルを置く
1. https://github.com でアカウントを作る（無料）。
2. 右上の「＋」→「New repository」。名前は `umeda-edition`、**Private** を選んで「Create repository」。
3. 作成直後の画面の「uploading an existing file」をクリック。
4. このzipを展開した中身（`index.html`、`admin` フォルダなど**全部**）をドラッグ＆ドロップし、「Commit changes」。

### ② Netlifyで公開する
1. https://app.netlify.com で「Sign up」→「GitHubで登録」。
2. 「Add new site（またはAdd new project）」→「Import an existing project」→「GitHub」→ `umeda-edition` を選ぶ。
3. 設定は自動で読み込まれます（Build command: `node build.js`／Publish directory: `.`）。そのまま「Deploy」。
4. 1〜2分で `https://〇〇〇.netlify.app` のURLが発行され、サイトが公開されます。

### ③ 編集画面にログインできるようにする
1. Netlifyのサイト管理画面で **Identity**（「Site configuration」または「Project configuration」の中）を開き、「Enable Identity」。
2. **Registration** を「Invite only（招待制）」にする（知らない人が登録できないように）。
3. Identity の **Services → Git Gateway** を「Enable」。
4. Identity の「Invite users」から、自分と編集を任せる人のメールアドレスを招待。
5. 届いたメールのリンクを開き、パスワードを設定 → 自動で編集画面 `/admin/` に移ります。

### ④ 独自ドメインをつなぐ（任意）
Netlifyの「Domain management」→「Add a domain」から、取得したドメイン（例：umeda-edition.jp）を登録し、画面の案内どおりにDNSを設定します。

---

## 2. 最初にやること

- **写真を入れ直す**：如月 冬樹さんの記事とキャスト情報は移してありますが、写真は入っていません。
  編集画面の「キャスト」→ 如月 冬樹 で**プロフィール写真**、「記事」→ 001 で**バナー画像・表紙画像・本文の画像**をアップロードしてください。
- **サイト設定**：編集画面の「サイト設定」→「SNS・説明文」で公式InstagramのIDなどを入れると、トップの「Official SNS」とフッターに反映されます。

---

## 3. 普段の使い方

| やりたいこと | 編集画面での操作 |
| --- | --- |
| キャストを登録 | 「キャスト」→「新規作成」。IDは英小文字（例：`kisaragi-fuyuki`） |
| 記事を書く | 「記事」→「新規作成」→ キャストを選ぶ → 見出し・画像・Q&A（最大3つ）を入力 |
| 下書き保存 | 「保存」→ 状態が「下書き」になる（サイトには出ない） |
| 本人に確認してもらう | 状態を「確認待ち」にする → Netlifyがプレビュー用URLを作る（編集画面の「プレビューを見る」など）→ そのURLを本人に送る |
| 公開する | 状態を「準備完了」にして「公開」→ 1〜2分でサイトに反映 |
| ランキング | 記事の「ランキング順位」に1〜10を入れる（空欄は圏外） |
| 広告 | 「広告バナー」→ 画像・リンク先・表示する枠を入れる。2本以上で自動で流れる |

※ 確認待ちのプレビューURLは、Netlifyの「Deploy Previews」が有効な場合に作られます（初期設定で有効）。
  URLが出ないときは、Netlifyの「Build & deploy」→「Deploy Previews」を確認してください。

---

## 4. ファイル構成

| ファイル | 役割 |
| --- | --- |
| `index.html` / `app.js` / `style.css` | サイト本体 |
| `admin/` | 編集画面（Decap CMS）と設定 `config.yml` |
| `content/` | 記事・キャスト・広告・設定のデータ（編集画面が自動で書き換える） |
| `images/uploads/` | 編集画面でアップロードした画像 |
| `build.js` | 公開時に `content/` をまとめて `data/site.json` を作る |
| `netlify.toml` | Netlifyの公開設定 |

---

## 5. Instagramとつなぐ
Instagramのプロフィールのリンク欄に、サイトのURLを入れます。
アクセス数を計測する場合は末尾に `?utm_source=ig&utm_medium=social&utm_content=link_in_bio` を付けます。
