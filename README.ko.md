# DuoWide

**Safari 웹페이지가 아이폰 듀오 바깥 화면을 끝까지 씁니다.**

[English](README.md) · [다운로드](https://github.com/hyungchulc/duowide/releases/latest/download/DuoWide.zip) · [사이트 요청](https://github.com/hyungchulc/duowide/issues/new/choose)

아이폰 듀오 바깥 화면에서 Safari는 버튼을 화면 오른쪽의 유리 줄에 모아 두고, 페이지는 그 줄 앞까지만 그립니다.
그래서 줄 밑 84pt가 비어 있습니다. DuoWide는 무료 Safari 확장 프로그램
[Userscripts](https://apps.apple.com/us/app/userscripts/id1463298887)에서 도는 유저스크립트입니다. 페이지를 줄 밑까지
화면 전체에 그리고, 누르는 것은 모두 줄에 가리지 않게 둡니다.

> **베타입니다.** DuoWide는 아직 베타이고, 가로 모드는 아직 지원하지 않습니다. 모든 웹사이트에 맞춰져 있지는 않아서,
> 이상하게 보이는 사이트가 있으면 [이슈](https://github.com/hyungchulc/duowide/issues/new/choose)를 만들거나
> [hyungchulc@gmail.com](mailto:hyungchulc@gmail.com)으로 알려 주세요. 최대한 빨리 고쳐 보겠습니다.

## 하는 일

- 페이지가 화면 폭을 다 씁니다(382pt 대신 466pt). 사진, 배경, 막대 색은 줄 밑까지 이어지고, 줄은 밑이 비치는 유리로
  남습니다.
- 줄에 가려 누를 수 없게 되는 링크, 버튼, 입력칸은 안쪽으로 옮깁니다.
- 문단, 댓글처럼 줄을 따라 읽는 글은 줄 앞에서 줄을 바꿔서, 글줄 끝이 버튼 밑에 들어가지 않습니다.
- 메뉴, 탭 막대 같은 고정 막대는 줄 앞에서 끝나고, 막대 색은 줄 밑까지 이어집니다.
- 옆으로 넘기는 목록(캐러셀)은 끝에 여유를 둬서, 마지막 항목까지 줄 밑에서 꺼내 볼 수 있습니다.
- 버튼을 옮길 수 없는 영상 플레이어(다른 사이트에서 끼워 넣은 플레이어, Safari 기본 컨트롤이 달린 영상)는 줄 앞에서
  끝나게 줄여서, 전체화면과 소리 버튼을 누를 수 있습니다.
- 페이지가 옆으로 밀리지 않습니다. 두 손가락 확대와 화면 끝에서 미는 뒤로/앞으로 가기는 그대로 됩니다. 스크롤 막대를
  DuoWide가 직접 그려서, 아래에 iOS의 가로 스크롤 막대가 생기지 않습니다.
- 다른 iPhone, iPad, Mac, 펼친 아이폰 듀오 화면에서는 아무것도 바꾸지 않습니다.

## 설치

1. App Store에서 [Userscripts](https://apps.apple.com/us/app/userscripts/id1463298887)를 설치합니다.
2. iPhone의 Safari에서 [DuoWide.zip](https://github.com/hyungchulc/duowide/releases/latest/download/DuoWide.zip)을
   다운로드하고, 파일 앱의 다운로드 폴더에서 눌러 압축을 풉니다. `DuoWide` 폴더에 스크립트 두 개가 들어 있습니다. 둘 다
   둡니다.
   - `DuoWide.user.js`가 본체입니다.
   - `DuoWide-Frames.user.js`는 페이지 안의 프레임(광고, 끼워 넣은 영상)에서 시작한 밀기에도 페이지가 밀리지 않게
     합니다.

   폴더는 계속 둘 곳(iCloud Drive나 나의 iPhone)으로 옮겨 둡니다.
3. Userscripts 앱을 열고 **Change Userscripts Directory**를 눌러 `DuoWide` 폴더를 고릅니다.
   - 이미 Userscripts를 쓰고 있다면 폴더는 그대로 두고, 두 스크립트를 지금 쓰는 폴더에 넣습니다.
4. **설정 → 앱 → Safari → 확장 프로그램 → Userscripts**에서 확장 프로그램을 켜고, **모든 웹사이트**를 **허용**으로
   둡니다.
5. 권장: **설정 → 앱 → Safari**에서 **상위 히트 미리 로드**를 끕니다. 주소를 치는 동안 Safari가 첫 결과를 미리 불러
   두는데, 확장 프로그램은 그렇게 미리 불러 둔 페이지에서 돌지 못해서 그 페이지는 새로고침하기 전까지 넓어지지 않습니다.
6. 바깥 화면의 Safari에서 페이지를 열거나 새로고침합니다.

**Safari에서 바로 설치할 수도 있습니다.** 확장 프로그램을 켠 뒤
[DuoWide.user.js](https://raw.githubusercontent.com/hyungchulc/duowide/main/DuoWide.user.js)를 열고, Safari의 확장
프로그램 메뉴에서 Userscripts를 열어 설치 안내를 누릅니다.
[DuoWide-Frames.user.js](https://raw.githubusercontent.com/hyungchulc/duowide/main/DuoWide-Frames.user.js)도 똑같이
합니다.

## 업데이트

두 스크립트는 이 저장소에서 새 버전을 확인합니다. 새 버전이 나오면 Safari의 Userscripts 메뉴에 보이니 **Update All**을
누릅니다. 새 zip을 받아 두 파일을 바꿔 넣어도 됩니다.

## 설정

`DuoWide.user.js` 맨 위의 `CONFIG`:

| 설정 | 기본값 | 하는 일 |
| --- | --- | --- |
| `skip` | `[]` | 넓히지 않을 사이트. 예: `["example.com"]`(하위 도메인도 같이) |
| `landscape` | `false` | 가로에서도 페이지를 넓힙니다. 아직 지원하지 않습니다. |
| `left` | `false` | `landscape`를 켰을 때, 줄이 왼쪽에 있어도 페이지를 넓힙니다. |
| `bar` | `true` | iOS의 가로 스크롤 막대를 숨기고 세로 막대를 같은 자리에 그립니다. `false`면 iOS 막대를 그대로 둡니다. |

파일을 그 자리에서 고칠 수 있는 편집기 앱으로 엽니다. 업데이트하면 파일이 새로 바뀌니, 업데이트한 뒤에 다시 정해 주세요.

## 알려진 문제

- 가로 모드는 아직 지원하지 않습니다. 가로에서는 Safari가 그리는 그대로 둡니다.
- 넓힌 페이지에서는 두 번 탭하면 확대됩니다. 페이지 폭을 숫자로 정하면 Safari가 두 번 탭 확대를 켜는데, 그것을 끄는
  설정은 페이지가 옆으로 밀리지 않게 하는 설정과 같이 쓸 수 없습니다.
- 아직 잘 맞지 않는 사이트가 있습니다. 알려 주세요.

## 사이트 요청과 문제 알리기

페이지 주소, 무엇이 이상한지, 가능하면 스크린샷을 담아 [이슈](https://github.com/hyungchulc/duowide/issues/new/choose)를
만들거나 [hyungchulc@gmail.com](mailto:hyungchulc@gmail.com)으로 보내 주세요. 최대한 빨리 맞춰 보겠습니다.

## 라이선스

[MIT](LICENSE)
