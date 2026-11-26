// Projects with working starting points. `track` is the youngest path they suit.
export const projects = {
  nombre: {
    name: "Mi nombre con la tortuga",
    track: "primeros",
    description: "Cada letra es un procedimiento. Escribe HOLA y luego crea las letras de tu nombre.",
    source: `; Cada letra es un procedimiento que dibuja la letra y deja la tortuga
; lista para la siguiente. :t es el alto de la letra.
; Ideas: crea las letras de tu nombre (E, I, T…), cambia el tamaño
; o pon cada letra de un color.
PARA SEPARA :t
  SUBELÁPIZ
  GIRADERECHA 90
  AVANZA :t / 3
  GIRAIZQUIERDA 90
  BAJALÁPIZ
FIN

PARA LETRAH :t
  AVANZA :t
  RETROCEDE :t / 2
  GIRADERECHA 90
  AVANZA :t / 2
  GIRAIZQUIERDA 90
  AVANZA :t / 2
  RETROCEDE :t
  SUBELÁPIZ
  GIRAIZQUIERDA 90
  AVANZA :t / 2
  GIRADERECHA 90
  BAJALÁPIZ
  SEPARA :t + :t * 3 / 2
FIN

PARA LETRAO :t
  REPITE 2 [
    AVANZA :t
    GIRADERECHA 90
    AVANZA :t / 2
    GIRADERECHA 90
  ]
  SEPARA :t * 3 / 2 + :t
FIN

PARA LETRAL :t
  AVANZA :t
  RETROCEDE :t
  GIRADERECHA 90
  AVANZA :t / 2
  GIRAIZQUIERDA 90
  SEPARA :t
FIN

PARA LETRAA :t
  GIRADERECHA 20
  AVANZA :t
  GIRADERECHA 140
  AVANZA :t
  RETROCEDE :t / 2
  GIRADERECHA 110
  AVANZA :t * 0.34
  SUBELÁPIZ
  RETROCEDE :t * 0.34
  GIRAIZQUIERDA 110
  AVANZA :t / 2
  GIRAIZQUIERDA 160
  BAJALÁPIZ
  SEPARA :t
FIN

GROSORLAPIZ 5
SUBELÁPIZ
PONXY -170 -40
BAJALÁPIZ
COLORLAPIZ "#ff8a65
LETRAH 80
COLORLAPIZ "#ffd166
LETRAO 80
COLORLAPIZ "#76f2bf
LETRAL 80
COLORLAPIZ "#7aa7ff
LETRAA 80
OCULTATORTUGA`,
  },
  paisaje: {
    name: "Un paisaje",
    track: "primeros",
    description: "Cielo, sol, montañas y una casa con RELLENA. Añade árboles, nubes o un río.",
    challenge: {
      name: "Paisaje a tu manera",
      goal: "Dibuja un paisaje con al menos un arco y dos rellenos.",
      source: `; Este sol tiene un arco y un relleno. Añade otra forma y píntala.
COLORLAPIZ "#ffd166
ARCO 360 30
RELLENA`,
      check({ arcs, fills }) {
        if (arcs.length === 0) return "Dibuja al menos un arco.";
        if (fills.length < 2) return "Usa RELLENA al menos dos veces.";
        return true;
      },
    },
    source: `; Un paisaje hecho con figuras y RELLENA. Cada figura es un procedimiento.
; Ideas: añade árboles, una nube, una puerta o cambia el cielo a la noche.
PARA VE :x :y
  SUBELÁPIZ
  PONXY :x :y
  PONRUMBO 0
  BAJALÁPIZ
FIN

PARA PINTA :x :y :tinta
  SUBELÁPIZ
  PONXY :x :y
  COLORLAPIZ :tinta
  RELLENA
FIN

PARA SOL :x :y :radio
  VE :x :y
  COLORLAPIZ "#ffd166
  ARCO 360 :radio
  RELLENA
FIN

PARA MONTAÑA :x :ancho :alto
  VE :x 0
  COLORLAPIZ "#3f6f5a
  PONXY :x + :ancho / 2 :alto
  PONXY :x + :ancho 0
  PONXY :x 0
  PINTA :x + :ancho / 2 :alto / 3 "#3f6f5a
FIN

PARA CASA :x :lado
  VE :x 0
  COLORLAPIZ "#f3f7e9
  REPITE 4 [ AVANZA :lado GIRADERECHA 90 ]
  AVANZA :lado
  GIRADERECHA 30
  AVANZA :lado
  GIRADERECHA 120
  AVANZA :lado
  PINTA :x + :lado / 2 :lado / 2 "#ff8a65
  PINTA :x + :lado / 2 :lado * 1.3 "#b3412f
FIN

PONCOLORFONDO "#9fd3f0
GROSORLAPIZ 3
COLORLAPIZ "#5c8f3e
VE -220 0
PONXY 220 0
SOL 170 170 35
MONTAÑA -220 200 150
MONTAÑA -80 180 110
CASA 120 70
OCULTATORTUGA`,
  },
  teclado: {
    name: "Dibuja con el teclado",
    track: "primeros",
    description: "Las flechas mueven la tortuga y las letras cambian el color. Un juego para dibujar a mano.",
    source: `; Pulsa Ejecutar y luego las teclas:
;   flechas: mueven la tortuga 10 pasos (arriba, abajo, izquierda, derecha)
;   R, V, A: tinta roja, verde o azul    S y B: sube o baja el lápiz
;   ESPACIO: borra    ESCAPE: termina
; Ideas: añade más colores, una tecla para el grosor o una para dibujar un círculo.
PARA PASO :rumbo
  PONRUMBO :rumbo
  AVANZA 10
FIN

GROSORLAPIZ 4
COLORLAPIZ "#76f2bf
HAZ "sigue 1
MIENTRAS :sigue = 1 [
  HAZ "tecla LEETECLA
  SI :tecla = "ARRIBA [PASO 0]
  SI :tecla = "DERECHA [PASO 90]
  SI :tecla = "ABAJO [PASO 180]
  SI :tecla = "IZQUIERDA [PASO 270]
  SI :tecla = "R [COLORLAPIZ "#ff8a65]
  SI :tecla = "V [COLORLAPIZ "#76f2bf]
  SI :tecla = "A [COLORLAPIZ "#7aa7ff]
  SI :tecla = "S [SUBELÁPIZ]
  SI :tecla = "B [BAJALÁPIZ]
  SI :tecla = "ESPACIO [BORRARPANTALLA]
  SI :tecla = "ESCAPE [HAZ "sigue 0]
]
ESCRIBE ["¡Buen "dibujo!]`,
  },
  mandala: {
    name: "Mandala de colores",
    challenge: {
      name: "Dibujo de dos colores",
      goal: "Inventa un dibujo que use al menos dos colores y un bucle.",
      source: `; Este cuadrado usa un bucle y un color. Añade trazos de otro color.
COLORLAPIZ "#ffd166
REPITE 4 [AVANZA 60 GIRADERECHA 90]`,
      check({ moves, arcs, usedLoop }) {
        const strokes = moves.filter(({ from, to }) => from.x !== to.x || from.y !== to.y);
        const colors = new Set([...strokes, ...arcs].map(({ color }) => color ?? "#76f2bf"));
        if (colors.size < 2) return "Dibuja trazos con al menos dos colores.";
        if (!usedLoop) return "Ejecuta al menos un bucle, por ejemplo REPITE.";
        return true;
      },
    },
    track: "explorador",
    description: "Una figura que gira con REPITE y cambia de tinta con PARACADA. Prueba otras formas y paletas.",
    source: `; Un pétalo es un rombo. El mandala repite anillos de pétalos de colores.
; Ideas: cambia el número de pétalos, la forma del pétalo o la paleta.
PARA PETALO :lado
  REPITE 2 [
    AVANZA :lado
    GIRADERECHA 45
    AVANZA :lado
    GIRADERECHA 135
  ]
FIN

PARA ANILLO :lado :petalos
  REPITE :petalos [
    PETALO :lado
    GIRADERECHA 360 / :petalos
  ]
FIN

GROSORLAPIZ 2
HAZ "lado 110
PARACADA "tinta ["#7aa7ff "#c5a6ff "#ff8a65 "#ffd166 "#76f2bf] [
  COLORLAPIZ :tinta
  ANILLO :lado 12
  GIRADERECHA 15
  HAZ "lado :lado - 20
]
OCULTATORTUGA`,
  },
  arbol: {
    name: "Árbol fractal",
    track: "explorador",
    description: "Cada rama se divide en dos ramas más cortas con recursión. Cambia el ángulo o la profundidad.",
    source: `; RAMA dibuja una rama y, en su punta, dos ramas más cortas: es recursión.
; Cuando la rama es muy corta, ALTO termina esa llamada.
; Ideas: cambia el ángulo de 25, el 0.7 o añade una tercera rama.
PARA RAMA :largo
  SI :largo < 8 [ALTO]
  GROSORLAPIZ 1 + :largo / 12
  AVANZA :largo
  GIRAIZQUIERDA 25
  RAMA :largo * 0.7
  GIRADERECHA 50
  RAMA :largo * 0.7
  GIRAIZQUIERDA 25
  RETROCEDE :largo
FIN

SUBELÁPIZ
PONXY 0 -160
BAJALÁPIZ
COLORLAPIZ "#c9a36b
RAMA 110
OCULTATORTUGA`,
  },
};

export const projectChallengePrefix = "reto:";

export function getProjectChallenge(key) {
  return typeof key === "string" && key.startsWith(projectChallengePrefix)
    ? projects[key.slice(projectChallengePrefix.length)]?.challenge : undefined;
}
