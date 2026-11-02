# DuoWide

**Páginas web que aprovechan toda la pantalla exterior del iPhone Duo en Safari.**

⭐ Si te gusta DuoWide, dale una **Star** en la parte de arriba de esta página. Así ayudas a que otros usuarios del iPhone Duo lo encuentren.
[![GitHub stars](https://img.shields.io/github/stars/hyungchulc/duowide?style=social)](https://github.com/hyungchulc/duowide/stargazers)

[English](README.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · **Español** · [Português](README.pt-BR.md) · [Français](README.fr.md) · [Deutsch](README.de.md)

[Descargar](https://github.com/hyungchulc/duowide/releases/latest/download/DuoWide.zip) · [Pedir un sitio](https://github.com/hyungchulc/duowide/issues/new/choose)

<div align="center">
  <img src="media/demo.webp" width="360" alt="DuoWide en Safari, en la pantalla exterior del iPhone Duo: apple.com, Netflix, Notion, Figma y The Verge se extienden bajo la franja lateral">
</div>

<details>
<summary>Video completo (19 s, 60 fps)</summary>

https://github.com/user-attachments/assets/64fab1b0-b13f-4736-ae52-480a993d2d6b

</details>

En la pantalla exterior del iPhone Duo, Safari reúne sus botones en una franja de vidrio a lo largo del lado derecho y
solo muestra las páginas hasta esa franja, así que los 84 pt que hay debajo quedan vacíos. DuoWide es un userscript
para [Userscripts](https://apps.apple.com/us/app/userscripts/id1463298887), una extensión gratuita de Safari. Extiende
las páginas por toda la pantalla, también bajo la franja, y se asegura de que nada de lo que tocas quede debajo de ella.

> **Beta.** DuoWide sigue en beta y todavía no admite la orientación horizontal. Aún no funciona bien con todos los
> sitios web: si alguno se ve mal, [abre un issue](https://github.com/hyungchulc/duowide/issues/new/choose) o escríbeme
> a [hyungchulc@gmail.com](mailto:hyungchulc@gmail.com) y lo arreglaré lo antes posible.

## Qué hace

- Las páginas usan todo el ancho de la pantalla (466 pt en lugar de 382 pt). Las fotos, los fondos y los colores de las
  barras se extienden por debajo de la franja, que sigue siendo de vidrio transparente.
- Los enlaces, botones y campos de texto que la franja taparía se mueven hacia el interior de la página, para que
  puedas seguir tocándolos.
- Los párrafos, los comentarios y el resto del texto corrido saltan de línea antes de la franja, así que ninguna línea
  termina bajo sus botones. Si en cambio prefieres que quepan más palabras en cada línea, añade el interruptor opcional
  de [texto ancho](#texto-ancho-opcional).
- Los menús, las barras de pestañas y las demás barras fijas terminan antes de la franja, y su color continúa por
  debajo de ella.
- Los carruseles tienen espacio extra al final, para que puedas deslizar el último elemento hasta sacarlo de debajo de
  la franja.
- Los reproductores de video cuyos botones no se pueden mover (reproductores insertados desde otros sitios, videos con
  los controles propios de Safari) se extienden por debajo de la franja como las imágenes hasta que los tocas o los
  reproduces. Entonces terminan antes de la franja, para que los botones de pantalla completa y de volumen se puedan
  seguir tocando.
- La página no se desliza hacia los lados. Puedes seguir pellizcando para hacer zoom y deslizando desde el borde para
  ir atrás o adelante. DuoWide dibuja por su cuenta la barra de desplazamiento de la página, así que la barra de
  desplazamiento horizontal de iOS no aparece en la parte de abajo.
- En Split View en la pantalla desplegada (Safari junto a otra app), los colores y fondos de la página también
  continúan bajo la franja que Safari pone en el lateral de la ventana, mientras que el texto, las imágenes y los
  botones quedan fuera de ella. Para dejar Split View tal como lo muestra Safari, pon `split` en `false`.
  <br><img src="media/split.webp" width="560" alt="DuoWide en Split View en la pantalla desplegada del iPhone Duo: Netflix y apple.com uno junto al otro, con los colores y fondos de cada página bajo la franja de su ventana">
- En otros iPhone, iPad y Mac, y en la pantalla desplegada del iPhone Duo cuando Safari la ocupa entera, no cambia
  nada.

## Instalación

1. Instala [Userscripts](https://apps.apple.com/us/app/userscripts/id1463298887) desde App Store.
2. Desde Safari en el iPhone, descarga
   [DuoWide.zip](https://github.com/hyungchulc/duowide/releases/latest/download/DuoWide.zip) y luego tócalo en la app
   Archivos (Descargas) para descomprimirlo. La carpeta `DuoWide` contiene dos scripts. Conserva los dos:
   - `DuoWide.user.js` hace el trabajo.
   - `DuoWide-Frames.user.js` evita que la página se deslice cuando un gesto empieza dentro de un marco (frame) de la
     página, como un anuncio o un video insertado, y avisa a la página cuando tocas un video insertado.

   Mueve la carpeta a un lugar donde pueda quedarse, como iCloud Drive o En mi iPhone.
3. Abre la app Userscripts, toca **Change Userscripts Directory** y elige la carpeta `DuoWide`.
   - Si ya usas Userscripts, mantén tu carpeta y copia en ella los dos scripts.
4. En **Ajustes (Configuración) → Apps → Safari → Extensiones → Userscripts**, activa la extensión y, en
   **Todos los sitios web (Todos los sitios)**, elige **Permitir**.
5. Recomendado: en **Ajustes → Apps → Safari**, desactiva **Precargar mejor resultado**. Mientras escribes una
   dirección, Safari carga por adelantado el mejor resultado. Las extensiones no pueden funcionar en una página cargada
   así, de modo que esa página se abre sin DuoWide hasta que la recargas.
6. Abre o recarga una página en Safari en la pantalla exterior.

**O instálalo desde Safari.** Con la extensión activada, abre
[DuoWide.user.js](https://raw.githubusercontent.com/hyungchulc/duowide/main/DuoWide.user.js), abre Userscripts desde
el menú de extensiones de Safari y toca el aviso de instalación. Haz lo mismo con
[DuoWide-Frames.user.js](https://raw.githubusercontent.com/hyungchulc/duowide/main/DuoWide-Frames.user.js).

## Texto ancho (opcional)

De forma predeterminada, DuoWide hace que los párrafos, los comentarios y el resto del texto corrido salten de línea
antes de la franja, para que ninguna línea termine bajo los botones de Safari. Si prefieres que quepan más palabras en
cada línea, por ejemplo con la página ampliada, añade el archivo opcional `DuoWide-WideText.user.js`:

- Las líneas de texto continúan por debajo de la franja, hasta el borde de la pantalla. Se ven a través del vidrio.
  Solo quedan ocultas las letras que pasan justo por debajo de un botón, y al desplazar la página dejan el botón atrás.
- Un párrafo cuyo enlace terminaría bajo la franja sigue saltando de línea antes de ella, así que el enlace se puede
  seguir tocando. Los enlaces, botones, menús, tablas y videos se tratan igual que antes.
- Es un interruptor para `DuoWide.user.js` 1.6.5 o posterior y por sí solo no hace nada, así que, si tu DuoWide es más
  antiguo, actualízalo primero. Cualquier script que esté en la carpeta está activado, por eso no viene en
  `DuoWide.zip`: solo está si lo añades tú.

**Cómo añadirlo**

1. Con la extensión Userscripts activada, abre
   [DuoWide-WideText.user.js](https://raw.githubusercontent.com/hyungchulc/duowide/main/DuoWide-WideText.user.js) en
   Safari en el iPhone.
2. Abre Userscripts desde el menú de extensiones de Safari y toca el aviso de instalación. El script se guarda en tu
   carpeta de Userscripts, junto a los otros dos.
3. Recarga la página que estás leyendo.

También puedes descargar `DuoWide-WideText.user.js` de la
[última versión](https://github.com/hyungchulc/duowide/releases/latest) (en **Assets**) y moverlo a la carpeta de los
otros dos scripts. Después abre una vez el menú de Userscripts en Safari para que detecte el archivo nuevo.

**Desactivarlo o volver a activarlo**

Abre Userscripts desde el menú de extensiones de Safari, toca **DuoWide-WideText** en la lista para desactivarlo (o
volver a activarlo) y recarga la página. Sigue desactivado aunque actualices, hasta que lo vuelvas a activar. Para
quitarlo, borra el archivo de la carpeta.

## Actualizaciones

Los scripts buscan versiones nuevas en este repositorio. Cuando sale una, aparece en el menú de Userscripts en Safari:
toca **Update All**. También puedes descargar el zip nuevo y reemplazar los dos archivos (y `DuoWide-WideText.user.js`
de esa versión, si lo usas).

## Configuración

`CONFIG`, al principio de `DuoWide.user.js`:

| Opción | Valor predeterminado | Qué hace |
| --- | --- | --- |
| `skip` | `[]` | Sitios que se dejan tal cual, como `["example.com"]` (incluidos sus subdominios). |
| `landscape` | `false` | Ensancha las páginas también en horizontal. Todavía no es compatible. |
| `left` | `false` | Con `landscape` activado, ensancha las páginas también cuando la franja está a la izquierda. |
| `bar` | `true` | Oculta la barra de desplazamiento horizontal de iOS y dibuja la vertical en su lugar. `false` mantiene las barras de iOS. |
| `split` | `true` | En Split View en la pantalla desplegada, extiende también los colores de la página bajo la franja de Safari. `false` deja la pantalla en Split View tal como la muestra Safari. |

Edita el archivo con una app de edición que pueda modificar archivos directamente en su ubicación. Al actualizar se
reemplaza el archivo, así que vuelve a configurar estas opciones después de cada actualización.

## Problemas conocidos

- La orientación horizontal todavía no es compatible. En horizontal, las páginas se quedan tal como las muestra Safari.
- Una página que tiene un menú a un lado y se abre ya desplazada más allá de él, como chatgpt.com, se queda con el
  ancho propio de Safari. Si se ensanchara, Safari dejaría sus barras rezagadas cada vez que desliza el menú para
  mostrarlo u ocultarlo.
- En las páginas ensanchadas, tocar dos veces amplía la página. Safari lo permite cuando el ancho de una página se fija
  con un número, y la opción que lo desactiva no se puede combinar con la que impide que la página se deslice hacia los
  lados.
- Algunos sitios todavía no funcionan bien. Por favor, avísame si encuentras alguno.

## Pedir un sitio o avisar de un problema

[Abre un issue](https://github.com/hyungchulc/duowide/issues/new/choose) con la dirección de la página, qué se ve mal
y, si puedes, una captura de pantalla, o escríbeme a [hyungchulc@gmail.com](mailto:hyungchulc@gmail.com). Haré que
funcione lo antes posible.

## Licencia

[MIT](LICENSE)
