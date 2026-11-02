# DuoWide

**SafariのウェブページがiPhone Duoの外側の画面を端まで使います。**

⭐ DuoWideを気に入っていただけたら、このページ上部の**Star**を押してください。ほかのiPhone Duoユーザーが見つけやすくなります。
[![GitHub stars](https://img.shields.io/github/stars/hyungchulc/duowide?style=social)](https://github.com/hyungchulc/duowide/stargazers)

[English](README.md) · [한국어](README.ko.md) · **日本語** · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Español](README.es.md) · [Português](README.pt-BR.md) · [Français](README.fr.md) · [Deutsch](README.de.md)

[ダウンロード](https://github.com/hyungchulc/duowide/releases/latest/download/DuoWide.zip) · [サイトのリクエスト](https://github.com/hyungchulc/duowide/issues/new/choose)

<div align="center">
  <img src="media/demo.webp" width="360" alt="iPhone Duoの外側の画面のSafariで動くDuoWide。apple.com、Netflix、Notion、Figma、The Vergeのページが横の帯の下まで広がっています">
</div>

<details>
<summary>動画全編（19秒、60fps）</summary>

https://github.com/user-attachments/assets/64fab1b0-b13f-4736-ae52-480a993d2d6b

</details>

iPhone Duoの外側の画面では、Safariはボタンを画面右側に沿ったガラスの帯にまとめ、ページをその帯の手前までしかレイアウトしません。そのため、帯の下の84ptは空いたままです。DuoWideは、無料のSafari機能拡張[Userscripts](https://apps.apple.com/us/app/userscripts/id1463298887)用のユーザースクリプトです。ページを帯の下まで画面全体にレイアウトし、タップするものはすべて帯にかからないようにします。

> **ベータ版です**。DuoWideはまだベータ版で、横向きにはまだ対応していません。まだすべてのウェブサイトに対応できているわけではないので、表示がおかしいサイトがあれば[Issueを作成](https://github.com/hyungchulc/duowide/issues/new/choose)するか、[hyungchulc@gmail.com](mailto:hyungchulc@gmail.com)までメールでお知らせください。できるだけ早く直します。

## できること

- ページが画面の幅いっぱいを使います（382ptではなく466pt）。写真や背景、バーの色は帯の下まで続き、帯は下が透けるガラスのままです。
- 帯に隠れてしまうリンク、ボタン、入力欄は内側に移るので、そのままタップできます。
- 段落やコメントなどの本文は帯の手前で折り返すので、行の終わりがボタンの下に入りません。1行により多くの文字を収めたい場合は、オプションの[ワイドテキスト](#ワイドテキストオプション)スイッチを追加します。
- メニューやタブバーなどの固定バーは帯の手前で終わり、その色は帯の下まで続きます。
- 横にスワイプして見る一覧（カルーセル）は末尾に余白ができるので、最後の項目も帯の下からスワイプで引き出せます。
- ボタンを動かせない動画プレーヤー（ほかのサイトから埋め込まれたプレーヤーや、Safari標準のコントロールが付いた動画）は、タップするか再生するまでは画像と同じように帯の下まで広がります。タップまたは再生すると帯の手前で終わるので、フルスクリーンや音量のボタンをタップできます。
- ページが横にずれることはありません。ピンチでのズームや、画面の端からスワイプして戻る・進む操作はそのまま使えます。DuoWideがページのスクロールバーを自分で描くので、画面の下にiOSの横スクロールバーは表示されません。
- iPhone Duoを開いた画面のSplit View（Safariをほかのアプリと並べた表示）でも、ページの色や背景はウインドウの横にあるSafariの帯の下まで続き、文字、画像、ボタンは帯にかからないようにします。Split ViewをSafari本来のレイアウトのままにするには、`split`を`false`にします。
- ほかのiPhone、iPad、Mac、そしてiPhone Duoを開いてSafariが画面全体を使っているときは、何も変えません。

## インストール

1. App Storeから[Userscripts](https://apps.apple.com/us/app/userscripts/id1463298887)をインストールします。
2. iPhoneのSafariで[DuoWide.zip](https://github.com/hyungchulc/duowide/releases/latest/download/DuoWide.zip)をダウンロードし、「ファイル」アプリの「ダウンロード」フォルダでタップして展開します。`DuoWide`フォルダにはスクリプトが2つ入っています。両方とも残しておきます。
   - `DuoWide.user.js`が本体です。
   - `DuoWide-Frames.user.js`は、ページ内のフレーム（広告や埋め込み動画など）でスワイプが始まったときもページが横にずれないようにし、埋め込み動画をタップしたことをページに伝えます。

   フォルダは、iCloud Driveや「このiPhone内」など、ずっと置いておける場所に移動します。
3. Userscriptsアプリを開いて**Change Userscripts Directory**をタップし、`DuoWide`フォルダを選びます。
   - すでにUserscriptsを使っている場合は、今のフォルダはそのままにして、代わりにそのフォルダへ2つのスクリプトをコピーします。
4. **設定 → アプリ → Safari → 機能拡張 → Userscripts**で機能拡張をオンにし、**すべてのウェブサイト**を**許可**にします。
5. おすすめ：**設定 → アプリ → Safari**で**トップヒットを事前に読み込む**をオフにします。アドレスを入力している間、Safariはいちばん上の候補を前もって読み込みます。そうして読み込まれたページでは機能拡張が動かないため、そのページは再読み込みするまでDuoWideなしで開きます。
6. 外側の画面のSafariでページを開くか、再読み込みします。

**Safariからインストールすることもできます**。機能拡張をオンにした状態で[DuoWide.user.js](https://raw.githubusercontent.com/hyungchulc/duowide/main/DuoWide.user.js)を開き、Safariの機能拡張メニューからUserscriptsを開いて、インストールの案内をタップします。[DuoWide-Frames.user.js](https://raw.githubusercontent.com/hyungchulc/duowide/main/DuoWide-Frames.user.js)も同じようにします。

## ワイドテキスト（オプション）

DuoWideは通常、段落やコメントなどの本文を帯の手前で折り返し、行の終わりがSafariのボタンの下に入らないようにしています。ページを拡大して読むときなど、1行により多くの文字を収めたい場合は、オプションの`DuoWide-WideText.user.js`を追加します。

- 文章の各行が帯の下を通って画面の端まで続きます。帯の下の文字はガラス越しに透けて見えます。隠れるのはボタンのすぐ下を通る文字だけで、スクロールすればボタンの外に出てきます。
- リンクが帯の下に来てしまう段落は、これまでどおり帯の手前で折り返すので、リンクはタップできるままです。リンク、ボタン、メニュー、表、動画の扱いは変わりません。
- これは`DuoWide.user.js` 1.6.5以降のためのスイッチで、単体では何もしません。お使いのDuoWideがそれより古い場合は、先にアップデートしてください。フォルダに入れたスクリプトはそのまま有効になるため、`DuoWide.zip`には含めていません。自分で追加したときだけフォルダに入ります。

**追加する**

1. Userscriptsの機能拡張をオンにした状態で、iPhoneのSafariで[DuoWide-WideText.user.js](https://raw.githubusercontent.com/hyungchulc/duowide/main/DuoWide-WideText.user.js)を開きます。
2. Safariの機能拡張メニューからUserscriptsを開き、インストールの案内をタップします。スクリプトは、ほかの2つと同じUserscriptsのフォルダに保存されます。
3. 読んでいたページを再読み込みします。

[最新のリリース](https://github.com/hyungchulc/duowide/releases/latest)の**Assets**から`DuoWide-WideText.user.js`をダウンロードして、ほかの2つのスクリプトがあるフォルダに移動しても構いません。そのあとSafariでUserscriptsのメニューを一度開くと、新しいファイルが読み込まれます。

**オフにする・オンに戻す**

Safariの機能拡張メニューからUserscriptsを開き、一覧の**DuoWide-WideText**をタップしてオフに（またはオンに）してから、ページを再読み込みします。一度オフにすると、オンに戻すまではアップデートしてもオフのままです。取り除くには、フォルダからファイルを削除します。

## アップデート

スクリプトは、このリポジトリで新しいバージョンが出ていないか確認します。新しいバージョンが出るとSafariのUserscriptsメニューに表示されるので、**Update All**をタップします。新しいzipをダウンロードして2つのファイルを置き換えることもできます（`DuoWide-WideText.user.js`を使っている場合は、それもリリースからダウンロードして置き換えます）。

## 設定

`DuoWide.user.js`の先頭にある`CONFIG`：

| 設定 | デフォルト | 説明 |
| --- | --- | --- |
| `skip` | `[]` | 手を加えずにそのままにするサイト。例：`["example.com"]`（サブドメインも含みます）。 |
| `landscape` | `false` | 横向きでもページを広げます。まだ対応していません。 |
| `left` | `false` | `landscape`がオンのとき、帯が左側にある場合もページを広げます。 |
| `bar` | `true` | iOSの横スクロールバーを隠し、縦スクロールバーをiOSのバーと同じ位置に描きます。`false`にするとiOSのバーのままです。 |
| `split` | `true` | iPhone Duoを開いた画面のSplit Viewでも、ページの色をSafariの帯の下まで続けます。`false`にするとSplit ViewはSafari本来のレイアウトのままです。 |

ファイルをその場で編集できるエディタアプリで編集します。アップデートするとファイルが置き換わるので、アップデートのあとでもう一度設定してください。

## 既知の問題

- 横向きにはまだ対応していません。横向きのページはSafari本来のレイアウトのままです。
- chatgpt.comのように、ページの横にメニューを置き、そのメニューを過ぎたところまでスクロールした状態で開くページは、Safari本来の幅のままにしています。広げると、メニューが出入りするたびにSafariのバーが取り残されてしまうためです。
- 広げたページでは、ダブルタップで拡大されてしまいます。ページの幅が数値で指定されているとSafariはダブルタップでの拡大を許可し、それを止める設定は、ページが横にずれないようにする設定と一緒に使えないためです。
- まだうまく動かないサイトもあります。ぜひお知らせください。

## サイトのリクエスト・不具合の報告

ページのアドレス、どこがおかしく見えるか、できればスクリーンショットを添えて[Issueを作成](https://github.com/hyungchulc/duowide/issues/new/choose)するか、[hyungchulc@gmail.com](mailto:hyungchulc@gmail.com)までメールしてください。できるだけ早く対応します。

## ライセンス

[MIT](LICENSE)
