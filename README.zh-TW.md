# DuoWide

**讓 Safari 網頁佔滿 iPhone Duo 的整個外螢幕。**

⭐ 如果你喜歡 DuoWide，請到這個頁面上方幫它按個 **Star**。這能幫助其他 iPhone Duo 使用者找到它。[![GitHub stars](https://img.shields.io/github/stars/hyungchulc/duowide?style=social)](https://github.com/hyungchulc/duowide/stargazers)

[English](README.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md) · **繁體中文** · [Español](README.es.md) · [Português](README.pt-BR.md) · [Français](README.fr.md) · [Deutsch](README.de.md)

[下載](https://github.com/hyungchulc/duowide/releases/latest/download/DuoWide.zip) · [申請支援網站](https://github.com/hyungchulc/duowide/issues/new/choose)

<div align="center">
  <img src="media/demo.webp" width="360" alt="在 iPhone Duo 外螢幕的 Safari 中使用 DuoWide：apple.com、Netflix、Notion、Figma 和 The Verge 的網頁都延伸到側邊的按鈕條底下">
</div>

<details>
<summary>完整影片（19 秒，60 fps）</summary>

https://github.com/user-attachments/assets/64fab1b0-b13f-4736-ae52-480a993d2d6b

</details>

在 iPhone Duo 的外螢幕上，Safari 把按鈕收在右側一條玻璃質感的按鈕條裡，網頁的版面也只排到按鈕條前面為止，所以按鈕條底下那 84 pt 寬的地方一直空著。DuoWide 是一個使用者腳本，搭配免費的 Safari 延伸功能 [Userscripts](https://apps.apple.com/us/app/userscripts/id1463298887) 使用。它會讓網頁排滿整個螢幕、一路延伸到按鈕條底下，同時讓你要點的東西全都避開按鈕條。

> **Beta 版**。DuoWide 仍在 Beta 階段，也還不支援橫向模式。它目前沒辦法應付所有網站：如果有網站看起來不對，請[開一個 issue](https://github.com/hyungchulc/duowide/issues/new/choose) 或寄信到 [hyungchulc@gmail.com](mailto:hyungchulc@gmail.com)，我會盡快修好。

## 功能

- 網頁會用上整個螢幕的寬度（466 pt，而不是 382 pt）。照片、背景和橫條的顏色都會延伸到按鈕條底下，按鈕條本身仍是透明的玻璃。
- 原本會被按鈕條蓋住的連結、按鈕和輸入框會往內移，讓你還是點得到。
- 段落、留言和其他內文會在按鈕條前換行，所以不會有一行字的結尾落在按鈕底下。如果想讓一行顯示更多字，可以加上選用的[寬版文字](#寬版文字選用)開關。
- 選單、標籤列和其他固定在畫面上的橫條會在按鈕條前結束，顏色則延續到按鈕條底下。
- 輪播的最後面會多留一點空間，讓你能把最後一個項目從按鈕條底下滑出來。
- 按鈕無法移動的影片播放器（從其他網站嵌入的播放器、使用 Safari 內建控制項目的影片），在你點一下或播放之前，會像圖片一樣延伸到按鈕條底下；之後就會改成在按鈕條前結束，讓全螢幕和音量按鈕都點得到。
- 網頁不會左右滑動（有一種例外，請見「已知問題」），雙指縮放和從邊緣滑動回上一頁、到下一頁也都照常可用。DuoWide 會自己畫出網頁的捲軸，所以底部不會出現 iOS 的水平捲軸。
- 在打開後的內螢幕上使用「分割顯示」（Safari 和另一個 App 並排）時，網頁的顏色和背景也會延伸到視窗側邊的 Safari 按鈕條底下，文字、圖片和按鈕則會避開它。如果想讓「分割顯示」維持 Safari 原本的排版，就把 `split` 設為 `false`。
  <br><img src="media/split.webp" width="560" alt="在打開後的 iPhone Duo 內螢幕上以「分割顯示」使用 DuoWide：Netflix 和 apple.com 並排顯示，兩個視窗的網頁顏色和背景都延伸到外側的 Safari 按鈕條底下">
- 在其他 iPhone、iPad、Mac 上，以及 Safari 佔滿整個 iPhone Duo 內螢幕時，DuoWide 不會改變任何東西。

## 安裝

1. 從 App Store 安裝 [Userscripts](https://apps.apple.com/us/app/userscripts/id1463298887)。
2. 在 iPhone 的 Safari 中下載 [DuoWide.zip](https://github.com/hyungchulc/duowide/releases/latest/download/DuoWide.zip)，然後到「檔案」App 的「下載項目」裡點一下它來解壓縮。`DuoWide` 檔案夾裡有兩個腳本，兩個都要保留：
   - `DuoWide.user.js` 負責主要的工作。
   - `DuoWide-Frames.user.js` 會在你從網頁裡的框架（例如廣告或嵌入的影片）開始滑動時，防止網頁跟著滑動，也會在你點一下嵌入的影片時通知網頁。

   把這個檔案夾搬到可以一直放著的位置，例如「iCloud 雲碟」或「我的 iPhone」。
3. 打開 Userscripts App，點一下 **Change Userscripts Directory**，然後選擇 `DuoWide` 檔案夾。
   - 如果你已經在用 Userscripts，就保留原本的檔案夾，改把這兩個腳本拷貝進去。
4. 前往**設定 → App → Safari → 延伸功能 → Userscripts**，開啟這個延伸功能，並將**所有網站**設為**允許**。
5. 建議：前往**設定 → App → Safari**，關閉**預先載入最佳搜尋結果**。你輸入網址時，Safari 會預先載入最前面的結果，但延伸功能無法在這樣載入的網頁中執行，所以這個網頁打開時不會套用 DuoWide，要等你重新載入才會。
6. 在外螢幕的 Safari 中打開或重新載入網頁。

**也可以直接從 Safari 安裝**。開啟延伸功能後，打開 [DuoWide.user.js](https://raw.githubusercontent.com/hyungchulc/duowide/main/DuoWide.user.js)，從 Safari 的延伸功能選單打開 Userscripts，再點一下安裝提示。[DuoWide-Frames.user.js](https://raw.githubusercontent.com/hyungchulc/duowide/main/DuoWide-Frames.user.js) 也照同樣的步驟做一次。

## 寬版文字（選用）

DuoWide 預設會讓段落、留言和其他內文在按鈕條前換行，這樣就不會有一行字的結尾落在 Safari 的按鈕底下。如果你比較想讓一行顯示更多字（例如把網頁放大來看時），可以加上選用的 `DuoWide-WideText.user.js`：

- 文字行會一路延伸到按鈕條底下，直到螢幕邊緣，並透過玻璃顯示出來。只有剛好經過按鈕正下方的字會被擋住，捲動一下就能讓它們移過按鈕。
- 如果段落裡有連結會落到按鈕條底下，這個段落仍會在按鈕條前換行，讓連結保持點得到。連結、按鈕、選單、表格和影片的處理方式則和原本一樣。
- 它是給 `DuoWide.user.js` 1.6.5 或以上版本用的開關，單獨存在時不會有任何作用，所以如果你的 DuoWide 比較舊，請先更新。只要腳本放在檔案夾裡就會啟用，所以它沒有放進 `DuoWide.zip`：只有你自己加進去，它才會在。

**加入方法**

1. 在 Userscripts 延伸功能已開啟的情況下，用 iPhone 的 Safari 打開 [DuoWide-WideText.user.js](https://raw.githubusercontent.com/hyungchulc/duowide/main/DuoWide-WideText.user.js)。
2. 從 Safari 的延伸功能選單打開 Userscripts，再點一下安裝提示。腳本會存到你的 Userscripts 檔案夾裡，和另外兩個放在一起。
3. 重新載入你正在看的網頁。

你也可以從[最新版本](https://github.com/hyungchulc/duowide/releases/latest)（在 **Assets** 底下）下載 `DuoWide-WideText.user.js`，再把它搬到另外兩個腳本所在的檔案夾。接著在 Safari 中打開 Userscripts 選單一次，讓它讀到這個新檔案。

**關閉或重新開啟**

從 Safari 的延伸功能選單打開 Userscripts，在列表中點一下 **DuoWide-WideText** 把它關閉（或重新開啟），然後重新載入網頁。關閉後就算更新也會維持關閉，直到你重新開啟為止。如果要移除，就把這個檔案從檔案夾裡刪掉。

## 更新

這些腳本會到這個儲存庫檢查有沒有新版本。有新版本時，它會出現在 Safari 的 Userscripts 選單中：點一下 **Update All** 即可。你也可以下載新的 zip 檔並替換那兩個檔案（如果你有使用 `DuoWide-WideText.user.js`，也從同一個版本下載替換）。

## 設定

`DuoWide.user.js` 最上方的 `CONFIG`：

| 設定 | 預設值 | 作用 |
| --- | --- | --- |
| `skip` | `[]` | 要維持原樣的網站，例如 `["example.com"]`（子網域也算在內）。 |
| `landscape` | `false` | 橫向時也加寬網頁。目前尚未支援。 |
| `left` | `false` | 開啟 `landscape` 後，按鈕條在左側時也加寬網頁。 |
| `bar` | `true` | 隱藏 iOS 的水平捲軸，改為自行畫出垂直捲軸。設為 `false` 則保留 iOS 原本的捲軸。 |
| `split` | `true` | 在內螢幕的「分割顯示」中，也讓網頁的顏色延伸到 Safari 的按鈕條底下。設為 `false` 則讓「分割顯示」維持 Safari 原本的排版。 |

請用能直接編輯原檔案的編輯器 App 來修改。更新時檔案會被整個換掉，所以更新後要重新設定這些值。

## 已知問題

- 目前還不支援橫向模式。橫向時，網頁會維持 Safari 原本的排版。
- 像 chatgpt.com 這樣把選單放在網頁旁邊、打開時已經捲動越過選單的網頁，會維持 Safari 原本的寬度。因為加寬的話，每次 Safari 把選單滑進或滑出時，都會把橫條留在後面。
- 在加寬的網頁上點兩下會放大。只要網頁寬度是用數字指定的，Safari 就會允許點兩下放大，而關閉這項功能的設定，又無法和防止網頁左右滑動的設定一起使用。
- 網頁被快速滑動後還在滑行時，如果手指放上去，網頁可能會左右移動（最多移動按鈕條的寬度）。Safari 不會把這種觸控告訴網頁，所以無法阻止，不過網頁很快就會自己回到原位。
- 有些網站目前效果還不理想，請回報給我。

## 申請支援網站或回報問題

請[開一個 issue](https://github.com/hyungchulc/duowide/issues/new/choose)，附上網頁網址、哪裡看起來不對，可以的話也附上截圖；或是寄信到 [hyungchulc@gmail.com](mailto:hyungchulc@gmail.com)。我會盡快讓它正常運作。

## 授權條款

[MIT](LICENSE)
