# DuoWide

**Páginas da web que usam toda a tela externa do iPhone Duo no Safari.**

⭐ Se você gosta do DuoWide, dê uma **Star** no topo desta página. Isso ajuda outros usuários do iPhone Duo a encontrá-lo.
[![GitHub stars](https://img.shields.io/github/stars/hyungchulc/duowide?style=social)](https://github.com/hyungchulc/duowide/stargazers)

[English](README.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Español](README.es.md) · **Português** · [Français](README.fr.md) · [Deutsch](README.de.md)

[Baixar](https://github.com/hyungchulc/duowide/releases/latest/download/DuoWide.zip) · [Pedir suporte a um site](https://github.com/hyungchulc/duowide/issues/new/choose)

<div align="center">
  <img src="media/demo.webp" width="360" alt="DuoWide no Safari da tela externa do iPhone Duo: apple.com, Netflix, Notion, Figma e The Verge se estendendo por baixo da faixa lateral">
</div>

<details>
<summary>Vídeo completo (19 s, 60 fps)</summary>

https://github.com/user-attachments/assets/64fab1b0-b13f-4736-ae52-480a993d2d6b

</details>

Na tela externa do iPhone Duo, o Safari mantém seus botões em uma faixa de vidro ao longo do lado direito e só monta as
páginas até essa faixa, então os 84 pt embaixo dela ficam vazios. O DuoWide é um userscript para a extensão gratuita
[Userscripts](https://apps.apple.com/us/app/userscripts/id1463298887) do Safari. Ele monta as páginas na tela inteira,
inclusive por baixo da faixa, e não deixa que ela cubra nada em que você precise tocar.

> **Beta.** O DuoWide ainda está em beta, e o modo paisagem ainda não tem suporte. Ele ainda não dá conta de todos os
> sites: se algum site não aparecer direito, [abra uma issue](https://github.com/hyungchulc/duowide/issues/new/choose)
> ou mande um e-mail para [hyungchulc@gmail.com](mailto:hyungchulc@gmail.com), que eu corrijo assim que puder.

## O que ele faz

- As páginas usam toda a largura da tela (466 pt em vez de 382 pt). Fotos, fundos e as cores das barras se estendem por
  baixo da faixa, que continua sendo um vidro transparente.
- Links, botões e campos de texto que ficariam cobertos pela faixa se deslocam para dentro, para que você ainda consiga
  tocar neles.
- Parágrafos, comentários e outros textos corridos quebram a linha antes da faixa, então nenhuma linha termina embaixo
  dos botões dela. Se preferir que caibam mais palavras por linha, adicione o interruptor opcional de
  [texto largo](#texto-largo-opcional).
- Menus, barras de abas e outras barras fixas terminam antes da faixa, e a cor delas continua por baixo da faixa.
- Os carrosséis ganham um espaço a mais no fim, então dá para deslizar até o último item sair de baixo da faixa.
- Players de vídeo cujos botões não podem ser movidos (players incorporados de outros sites, vídeos com os controles do
  próprio Safari) se estendem por baixo da faixa como as imagens, até você tocar neles ou dar play. A partir daí, eles
  terminam antes da faixa, para que os botões de tela cheia e de volume continuem ao alcance do dedo.
- A página não desliza para os lados. O zoom com pinça e os gestos de deslizar a partir da borda para voltar e avançar
  continuam funcionando. O próprio DuoWide desenha a barra de rolagem da página, então a barra de rolagem horizontal do
  iOS não aparece na parte de baixo.
- No Split View com o iPhone Duo aberto (o Safari ao lado de outro app), as cores e os fundos da página também se
  estendem por baixo da faixa do Safari na lateral da janela, enquanto textos, imagens e botões não ficam embaixo dela.
  Para deixar o Split View do jeito que o Safari monta, defina `split` como `false`.
  <br><img src="media/split.webp" width="560" alt="DuoWide no Split View com o iPhone Duo aberto: Netflix e apple.com lado a lado, com as cores e os fundos de cada página se estendendo por baixo da faixa da sua janela">
- Em outros iPhones, no iPad, no Mac e no iPhone Duo aberto quando o Safari ocupa a tela toda, ele não muda nada.

## Instalação

1. Instale o [Userscripts](https://apps.apple.com/us/app/userscripts/id1463298887) pela App Store.
2. No Safari do iPhone, baixe o
   [DuoWide.zip](https://github.com/hyungchulc/duowide/releases/latest/download/DuoWide.zip) e toque nele no app
   Arquivos (pasta Downloads) para descompactá-lo. A pasta `DuoWide` contém dois scripts. Mantenha os dois:
   - `DuoWide.user.js` faz o trabalho.
   - `DuoWide-Frames.user.js` impede que a página deslize para os lados quando você começa a arrastar o dedo dentro de
     um frame da página, como um anúncio ou um vídeo incorporado, e avisa a página quando você toca em um vídeo
     incorporado.

   Mova a pasta para um lugar onde ela possa ficar de vez, como o iCloud Drive ou No Meu iPhone.
3. Abra o app Userscripts, toque em **Change Userscripts Directory** e escolha a pasta `DuoWide`.
   - Se você já usa o Userscripts, mantenha a sua pasta e copie os dois scripts para ela.
4. Em **Ajustes → Apps → Safari → Extensões → Userscripts**, ative a extensão e defina **Todos os Sites** como
   **Permitir**.
5. Recomendado: em **Ajustes → Apps → Safari**, desative **Pré-Carregar Mais Relevante**. Enquanto você digita um
   endereço, o Safari carrega antecipadamente o resultado mais relevante. As extensões não conseguem rodar em uma página
   carregada assim, então ela abre sem o DuoWide até você recarregá-la.
6. Abra ou recarregue uma página no Safari da tela externa.

**Ou instale pelo Safari.** Com a extensão ativada, abra o
[DuoWide.user.js](https://raw.githubusercontent.com/hyungchulc/duowide/main/DuoWide.user.js), abra o Userscripts no menu
de extensões do Safari e toque no aviso para instalar. Faça o mesmo com o
[DuoWide-Frames.user.js](https://raw.githubusercontent.com/hyungchulc/duowide/main/DuoWide-Frames.user.js).

## Texto largo (opcional)

Por padrão, o DuoWide quebra as linhas de parágrafos, comentários e outros textos corridos antes da faixa, para que
nenhuma linha termine embaixo dos botões do Safari. Se você preferir que caibam mais palavras por linha, por exemplo com
a página ampliada, adicione o script opcional `DuoWide-WideText.user.js`:

- As linhas de texto continuam por baixo da faixa, até a borda da tela. Elas aparecem através do vidro. Só ficam
  escondidas as letras que passam bem embaixo de um botão, e, ao rolar a página, elas passam por ele.
- Um parágrafo cujo link acabaria ficando embaixo da faixa continua quebrando antes dela, para que você ainda consiga
  tocar no link. Links, botões, menus, tabelas e vídeos são tratados como antes.
- Ele é um interruptor para o `DuoWide.user.js` 1.6.5 ou posterior e não faz nada sozinho, então atualize o DuoWide
  primeiro se o seu for mais antigo. Todo script que está na pasta fica ativado, por isso ele fica de fora do
  `DuoWide.zip`: ele só está na pasta se você o adicionar.

**Como adicionar**

1. Com a extensão Userscripts ativada, abra o
   [DuoWide-WideText.user.js](https://raw.githubusercontent.com/hyungchulc/duowide/main/DuoWide-WideText.user.js) no
   Safari do iPhone.
2. Abra o Userscripts no menu de extensões do Safari e toque no aviso para instalar. Ele salva o script na sua pasta do
   Userscripts, junto dos outros dois.
3. Recarregue a página que você está lendo.

Ou baixe o `DuoWide-WideText.user.js` da [versão mais recente](https://github.com/hyungchulc/duowide/releases/latest)
(em **Assets**) e mova-o para a pasta onde estão os outros dois scripts. Depois abra o menu do Userscripts no Safari uma
vez, para que ele reconheça o arquivo novo.

**Desativar ou reativar**

Abra o Userscripts no menu de extensões do Safari, toque em **DuoWide-WideText** na lista para desativá-lo (ou
reativá-lo) e recarregue a página. Ele continua desativado mesmo depois de atualizações, até você ativá-lo de novo. Para
removê-lo, apague o arquivo da pasta.

## Atualizações

Os scripts procuram versões novas neste repositório. Quando sai uma, ela aparece no menu do Userscripts no Safari: toque
em **Update All**. Você também pode baixar o zip novo e substituir os dois arquivos (e também o
`DuoWide-WideText.user.js` da versão nova, se você o usa).

## Configurações

`CONFIG`, no topo do `DuoWide.user.js`:

| Configuração | Padrão | O que faz |
| --- | --- | --- |
| `skip` | `[]` | Sites que devem ficar como estão, como `["example.com"]` (subdomínios também). |
| `landscape` | `false` | Alarga as páginas também no modo paisagem. Ainda sem suporte. |
| `left` | `false` | Com `landscape` ativado, alarga as páginas também quando a faixa fica à esquerda. |
| `bar` | `true` | Esconde a barra de rolagem horizontal do iOS e desenha a vertical no lugar dela. `false` mantém as barras do iOS. |
| `split` | `true` | No Split View com o iPhone Duo aberto, estende as cores da página também por baixo da faixa do Safari. `false` deixa o Split View do jeito que o Safari monta. |

Edite o arquivo com um app de edição que consiga alterar arquivos no lugar onde eles estão. Uma atualização substitui o
arquivo, então defina esses valores de novo depois de atualizar.

## Problemas conhecidos

- O modo paisagem ainda não tem suporte. No modo paisagem, as páginas ficam do jeito que o Safari monta.
- Uma página que mantém um menu ao lado do conteúdo e abre já rolada além dele, como o chatgpt.com, fica com a largura
  padrão do Safari. Se ela fosse alargada, o Safari deixaria as próprias barras para trás toda vez que o menu entrasse
  ou saísse deslizando.
- Tocar duas vezes amplia as páginas alargadas. O Safari permite isso quando a largura da página é definida como um
  número, e a configuração que desativa isso não pode ser combinada com a que impede a página de deslizar para os lados.
- Alguns sites ainda não funcionam bem. Por favor, me avise quais são.

## Pedir suporte a um site ou relatar um problema

[Abra uma issue](https://github.com/hyungchulc/duowide/issues/new/choose) com o endereço da página, o que está
aparecendo errado e uma captura de tela, se puder, ou mande um e-mail para
[hyungchulc@gmail.com](mailto:hyungchulc@gmail.com). Vou fazer o site funcionar assim que eu puder.

## Licença

[MIT](LICENSE)
