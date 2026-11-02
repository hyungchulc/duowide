# DuoWide

**让 Safari 里的网页铺满整个 iPhone Duo 外屏。**

⭐ 如果你喜欢 DuoWide，请点一下本页顶部的 **Star**，这能帮助其他 iPhone Duo 用户找到它。[![GitHub stars](https://img.shields.io/github/stars/hyungchulc/duowide?style=social)](https://github.com/hyungchulc/duowide/stargazers)

[English](README.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · **简体中文** · [繁體中文](README.zh-TW.md) · [Español](README.es.md) · [Português](README.pt-BR.md) · [Français](README.fr.md) · [Deutsch](README.de.md)

[下载](https://github.com/hyungchulc/duowide/releases/latest/download/DuoWide.zip) · [申请适配网站](https://github.com/hyungchulc/duowide/issues/new/choose)

<div align="center">
  <img src="media/demo.webp" width="360" alt="在 iPhone Duo 外屏的 Safari 中使用 DuoWide：apple.com、Netflix、Notion、Figma 和 The Verge 的页面一直铺到侧边按钮条下面">
</div>

<details>
<summary>完整视频（19 秒，60 fps）</summary>

https://github.com/user-attachments/assets/64fab1b0-b13f-4736-ae52-480a993d2d6b

</details>

在 iPhone Duo 外屏上，Safari 把按钮收在屏幕右侧的一条玻璃按钮条里，网页也只排到按钮条前面为止，所以按钮条下面的 84 pt 一直空着。DuoWide 是为免费 Safari 扩展 [Userscripts](https://apps.apple.com/us/app/userscripts/id1463298887) 编写的用户脚本。它把网页排满整个屏幕，一直排到按钮条下面，同时让所有可以点的内容都避开按钮条。

> **测试版**：DuoWide 还在测试阶段，暂不支持横屏，也还不能适配所有网站。如果某个网站显示不正常，请[提交 issue](https://github.com/hyungchulc/duowide/issues/new/choose) 或发邮件到 [hyungchulc@gmail.com](mailto:hyungchulc@gmail.com)，我会尽快修好。

## 功能

- 网页使用屏幕的全部宽度（466 pt，而不是 382 pt）。照片、背景和各种栏的颜色会延伸到按钮条下面，按钮条本身仍是透明的玻璃。
- 会被按钮条挡住的链接、按钮和输入框会往里挪，让你仍然能点到。
- 段落、评论等成段的文字会在按钮条前换行，不会有哪一行的末尾落在按钮下面。如果你更想让一行多放些字，可以加上可选的[宽文本](#宽文本可选)开关。
- 菜单、标签栏等固定栏会在按钮条前结束，它们的颜色则一直延续到按钮条下面。
- 轮播内容的末尾会多留出一些空间，让你能把最后一项从按钮条下面划出来。
- 按钮无法移动的视频播放器（从其他网站嵌入的播放器、使用 Safari 自带控件的视频）在你轻点或播放之前，会像图片一样延伸到按钮条下面；轻点或播放之后，它们会缩到按钮条前为止，让全屏和音量按钮仍然点得到。
- 页面不会左右滑动。双指缩放和从屏幕边缘轻扫来后退、前进的手势照常可用。DuoWide 会自己绘制页面的滚动条，所以底部不会出现 iOS 的横向滚动条。
- 在展开后的内屏上分屏浏览时（Safari 与另一个 App 并排），页面的颜色和背景同样会延伸到窗口侧边的 Safari 按钮条下面，而文字、图片和按钮都会避开它。如果想让分屏浏览保持 Safari 原本的排版，把 `split` 设为 `false` 即可。
  <br><img src="media/split.webp" width="560" alt="在展开后的 iPhone Duo 内屏上分屏浏览时使用 DuoWide：Netflix 和 apple.com 并排显示，两个窗口的页面颜色和背景都延伸到外侧的 Safari 按钮条下面">
- 在其他 iPhone、iPad、Mac 上，以及 Safari 独占展开后的 iPhone Duo 内屏时，它不做任何改动。

## 安装

1. 从 App Store 安装 [Userscripts](https://apps.apple.com/us/app/userscripts/id1463298887)。
2. 在 iPhone 上用 Safari 下载 [DuoWide.zip](https://github.com/hyungchulc/duowide/releases/latest/download/DuoWide.zip)，然后在“文件” App 的“下载”文件夹中轻点它进行解压。解压得到的 `DuoWide` 文件夹里有两个脚本，两个都要保留：
   - `DuoWide.user.js` 负责主要功能。
   - `DuoWide-Frames.user.js` 在你从页面内的框架（比如广告或嵌入的视频）上开始滑动时，也能防止页面左右滑动，还会在你轻点嵌入的视频时通知页面。

   把这个文件夹移到可以长期存放的位置，比如“iCloud 云盘”或“我的 iPhone”。
3. 打开 Userscripts App，轻点 **Change Userscripts Directory**，然后选择 `DuoWide` 文件夹。
   - 如果你已经在用 Userscripts，就保留原来的文件夹，改为把这两个脚本复制进去。
4. 在**设置 → App → Safari 浏览器 → 扩展 → Userscripts** 中打开这个扩展，并把**所有网站**设为**允许**。
5. 建议：在**设置 → App → Safari 浏览器**中关闭**预加载最佳搜索结果**。你输入网址时，Safari 会提前加载排在最前面的结果，而扩展无法在这样加载的页面里运行，所以这个页面在你刷新之前都不会启用 DuoWide。
6. 在外屏上的 Safari 中打开或刷新一个网页。

**也可以直接从 Safari 安装**：启用扩展后，打开 [DuoWide.user.js](https://raw.githubusercontent.com/hyungchulc/duowide/main/DuoWide.user.js)，从 Safari 的扩展菜单中打开 Userscripts，然后轻点安装提示。再对 [DuoWide-Frames.user.js](https://raw.githubusercontent.com/hyungchulc/duowide/main/DuoWide-Frames.user.js) 重复一遍。

## 宽文本（可选）

默认情况下，DuoWide 会让段落、评论等成段的文字在按钮条前换行，不会有哪一行的末尾落在 Safari 的按钮下面。如果你更想让一行多放些字（比如在放大页面的时候），可以加上可选的 `DuoWide-WideText.user.js`：

- 文字行会一直延伸到按钮条下面、直到屏幕边缘，透过玻璃也能看到。只有正好从某个按钮下方经过的字会被挡住，滚动页面就能让它们移过去。
- 如果某个段落里的链接会落到按钮条下面，这个段落仍会在按钮条前换行，让链接保持可点。链接、按钮、菜单、表格和视频的处理方式不变。
- 它是 `DuoWide.user.js` 1.6.5 及更高版本的开关，单独使用不起任何作用；如果你的 DuoWide 版本更旧，请先更新。放在文件夹里的脚本都会生效，所以 `DuoWide.zip` 里没有包含它：只有你自己添加，它才会在文件夹里。

**添加方法**

1. 在 Userscripts 扩展已启用的情况下，用 iPhone 上的 Safari 打开 [DuoWide-WideText.user.js](https://raw.githubusercontent.com/hyungchulc/duowide/main/DuoWide-WideText.user.js)。
2. 从 Safari 的扩展菜单中打开 Userscripts，轻点安装提示。脚本会保存到你的 Userscripts 文件夹中，和另外两个脚本放在一起。
3. 刷新你正在阅读的页面。

你也可以从[最新发布版本](https://github.com/hyungchulc/duowide/releases/latest)（在 **Assets** 下）下载 `DuoWide-WideText.user.js`，把它移到另外两个脚本所在的文件夹里。然后在 Safari 中打开一次 Userscripts 菜单，让它读取这个新文件。

**关闭或重新开启**

从 Safari 的扩展菜单中打开 Userscripts，在列表中轻点 **DuoWide-WideText** 将它关闭（或重新开启），然后刷新页面。关闭后，即使更新也会一直保持关闭，直到你重新开启。要彻底移除它，从文件夹中删除这个文件即可。

## 更新

脚本会到这个仓库检查新版本。有新版本时，它会出现在 Safari 的 Userscripts 菜单中，轻点 **Update All** 即可。你也可以下载新的 zip 包替换那两个文件（如果你在用 `DuoWide-WideText.user.js`，也用发布页里的新文件替换它）。

## 配置

`DuoWide.user.js` 顶部的 `CONFIG`：

| 配置项 | 默认值 | 作用 |
| --- | --- | --- |
| `skip` | `[]` | 保持原样、不做处理的网站，例如 `["example.com"]`（子域名也包括在内）。 |
| `landscape` | `false` | 横屏时也加宽页面。暂不支持。 |
| `left` | `false` | 开启 `landscape` 后，按钮条位于左侧时也加宽页面。 |
| `bar` | `true` | 隐藏 iOS 的横向滚动条，并在原来的位置绘制纵向滚动条。设为 `false` 则保留 iOS 的滚动条。 |
| `split` | `true` | 在展开后的内屏上分屏浏览时，也把页面颜色延伸到 Safari 按钮条下面。设为 `false` 则让分屏浏览保持 Safari 原本的排版。 |

请用可以直接编辑原文件的编辑器 App 修改这个文件。更新会替换整个文件，所以更新后需要重新设置这些值。

## 已知问题

- 暂不支持横屏。横屏时，页面保持 Safari 原本的排版。
- 像 chatgpt.com 这样把菜单放在页面旁边、打开时已经滚过菜单的页面，会保持 Safari 原本的宽度。如果加宽，Safari 每次把菜单滑进或滑出时，自己的栏都会被甩在后面。
- 在加宽的页面上，连按两下会放大。页面宽度设为具体数值时，Safari 就允许这样放大，而关闭它的设置又无法和防止页面左右滑动的设置同时使用。
- 有些网站目前还适配得不好，请反馈给我。

## 申请适配网站或反馈问题

[提交 issue](https://github.com/hyungchulc/duowide/issues/new/choose)，写上页面地址、哪里显示不对，能附上截图就更好了；也可以发邮件到 [hyungchulc@gmail.com](mailto:hyungchulc@gmail.com)。我会尽快把它适配好。

## 许可证

[MIT](LICENSE)
