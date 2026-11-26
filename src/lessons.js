// Logo procedures shared by the two numeration lessons. Each lesson loads
// the whole program so it can still be edited and saved as a .logo file.
const numerationBoard = `PARA VE :x :y
  SUBELÁPIZ
  PONXY :x :y
  BAJALÁPIZ
FIN

PARA PAQUETE :y
  VE -116 :y
  PONRUMBO 90
  REPITE 2 [ AVANZA 120 GD 90 AVANZA 14 GD 90 ]
  REPITE 9 [
    VE (-116 + 12 * CUENTAREP) :y
    PONRUMBO 180
    AVANZA 14
  ]
FIN

PARA TABLERO :paquetes :sueltas :y
  HAZ "total (:paquetes * 10 + :sueltas)
  HAZ "cuenta FRASE :total FRASE "= FRASE (:paquetes * 10) FRASE "+ :sueltas
  COLORLÁPIZ "#193b34
  VE -116 (:y + 17)
  ROTULA :cuenta
  ESCRIBE :cuenta

  COLORLÁPIZ "#23715a
  REPITE :paquetes [ PAQUETE (:y - 20 * (CUENTAREP - 1)) ]

  COLORLÁPIZ "#974418
  REPITE :sueltas [
    HAZ "i (CUENTAREP - 1)
    VE (36 + 20 * (RESTO :i 3)) (:y - 7 - 20 * (COCIENTE :i 3))
    ARCO 360 5
  ]
  SI :sueltas = 0 [
    VE 30 (:y - 13)
    ROTULA [0 sueltas]
  ]
FIN

PONCOLORFONDO "#fff9ec
GROSORLÁPIZ 2`;

export const lessons = {
  tortuga: {
    name: "Tortuga · Conoce a la tortuga",
    outcome: "Da órdenes de una en una: AVANZA dibuja una línea y GIRADERECHA cambia la dirección.",
    source: `; La tortuga hace lo que le dices, una orden en cada línea.
; AVANZA 100 la mueve hacia delante y dibuja una línea.
; GIRADERECHA 90 la gira un cuarto de vuelta, sin moverse.
; Pulsa Ejecutar. Luego usa los botones de la tortuga
; o escribe más órdenes debajo.
AVANZA 100
GIRADERECHA 90
AVANZA 100`,
  },
  bucles: {
    name: "Bucles · Cuadrado",
    outcome: "Repite el mismo movimiento para dibujar un cuadrado de cuatro lados.",
    source: `; REPITE hace muchas veces lo que hay entre corchetes.
; El número dice cuántas veces. Prueba a cambiar el 80 de AVANZA por 120.
REPITE 4 [
  AVANZA 80
  GIRADERECHA 90
]`,
  },
  poligonos: {
    name: "Polígonos · Pentágono",
    outcome: "Reparte una vuelta completa en cinco giros para cerrar un pentágono.",
    source: `; Reparte una vuelta completa entre los cinco lados.
; Cuenta los lados: el número de REPITE y el del giro van juntos.
REPITE 5 [
  AVANZA 70
  GIRADERECHA (360 / 5)
]`,
  },
  variables: {
    name: "Variables · Espiral cuadrada",
    outcome: "Aumenta la longitud del paso para dibujar una espiral de 24 trazos.",
    source: `; HAZ guarda un valor. :paso lee el valor actual.
; Cambia cuánto crece el paso al final de cada vuelta del bucle.
HAZ "paso 10
REPITE 24 [
  AVANZA :paso
  GIRADERECHA 90
  HAZ "paso :paso + 5
]`,
  },
  argumentos: {
    name: "Argumentos · Dos polígonos",
    outcome: "Usa el mismo procedimiento para dibujar un triángulo y un hexágono.",
    source: `; Los argumentos son el número de lados y la longitud de cada lado.
; Prueba a cambiar solo los argumentos de la segunda llamada.
PARA POLIGONO :lados :longitud
  REPITE :lados [
    AVANZA :longitud
    GIRADERECHA (360 / :lados)
  ]
FIN

POLIGONO 3 80
SUBELÁPIZ
PONXY 110 0
BAJALÁPIZ
POLIGONO 6 50`,
  },
  desde: {
    name: "Bucles · DESDE y PARACADA",
    outcome: "Dibuja cuadrados que crecen con DESDE y una columna de colores con PARACADA.",
    source: `; DESDE "lado 20 100 20 [ ... ] da a :lado los valores 20, 40, 60, 80 y 100.
; PARACADA "tinta [ ... ] [ ... ] repite el bloque con cada color de la lista.
; Prueba un paso de 10 o añade otro color a la lista.
PARA CUADRADO :lado
  REPITE 4 [ AVANZA :lado GIRADERECHA 90 ]
FIN

GROSORLÁPIZ 3
DESDE "lado 20 100 20 [
  CUADRADO :lado
]

SUBELÁPIZ
PONXY 140 0
BAJALÁPIZ
PARACADA "tinta ["#ff8a65 "#ffd166 "#76f2bf "#7aa7ff] [
  COLORLÁPIZ :tinta
  CUADRADO 30
  SUBELÁPIZ
  AVANZA 40
  BAJALÁPIZ
]
OCULTATORTUGA`,
  },
  aleatorio: {
    name: "Aleatorio · Tiradas de dado",
    outcome: "Genera ocho tiradas de un dado de seis caras.",
    source: `; AZAR 6 devuelve un entero entre 0 y 5. Suma 1 para obtener un dado.
; Ejecuta de nuevo y compara las tiradas.
REPITE 8 [
  ESCRIBE (AZAR 6) + 1
]`,
  },
  colores: {
    name: "Colores · Tres franjas",
    outcome: "Usa una paleta de píxeles para dibujar tres franjas de distinto color.",
    source: `; El color 0 es el fondo. Las franjas usan los índices 1, 2 y 3.
; Cambia un color de la paleta y vuelve a ejecutar.
LIENZO 60 24
PALETA ["#192c36 "#76f2bf "#ffc36b "#a9a2ff]
HAZ "fila 0
REPITE 24 [
  HAZ "columna 0
  HAZ "color 1
  REPITE 3 [
    REPITE 20 [
      PONPIXEL :columna :fila :color
      HAZ "columna :columna + 1
    ]
    HAZ "color :color + 1
  ]
  HAZ "fila :fila + 1
]`,
  },
  rosetaColores: {
    name: "Colores · Roseta de tres tintas",
    outcome: "Dibuja 12 triángulos y alterna tres tintas según la vuelta del bucle.",
    source: `; CUENTAREP dice en qué vuelta va el bucle. RESTO hace que las tintas vuelvan a empezar.
; Prueba a añadir otra tinta a la lista y vuelve a ejecutar.
PARA TRIANGULO :lado
  REPITE 3 [
    AVANZA :lado
    GIRADERECHA 120
  ]
FIN

HAZ "tintas ["#ffb454 "#76f2bf "#c5a6ff]
REPITE 12 [
  HAZ "indice 1 + RESTO (CUENTAREP - 1) (CUENTA :tintas)
  COLORLÁPIZ ELEMENTO :indice :tintas
  TRIANGULO 95
  GIRADERECHA 30
]`,
  },
  grosores: {
    name: "Trazos · Tres grosores",
    outcome: "Compara tres trazos de la misma longitud con grosores 2, 6 y 12.",
    source: `; Cada línea con MUESTRA elige la altura, el grosor y la tinta.
; Cambia solo el grosor de la muestra turquesa de 6 a 10.
PARA MUESTRA :altura :ancho :tinta
  SUBELÁPIZ
  PONXY -90 :altura
  PONRUMBO 90
  COLORLÁPIZ :tinta
  GROSORLÁPIZ :ancho
  BAJALÁPIZ
  AVANZA 180
FIN

MUESTRA 52 2 "#ffc36b
MUESTRA 0 6 "#76f2bf
MUESTRA -52 12 "#c5a6ff`,
  },
  rotulos: {
    name: "Rótulos · Mapa del tesoro",
    outcome: "Dibuja una ruta sobre papel claro, rotula cada parada y esconde la tortuga al terminar.",
    source: `; PONCOLORFONDO cambia el papel y ROTULA escribe junto a la tortuga.
; Prueba a añadir otra parada con PARADA y un nuevo nombre.
PONCOLORFONDO "#f4ecd8

PARA PARADA :giro :pasos :nombre
  GIRADERECHA :giro
  COLORLÁPIZ "#8a6a3f
  AVANZA :pasos
  COLORLÁPIZ "#1f3a5f
  ROTULA :nombre
FIN

GROSORLÁPIZ 3
COLORLÁPIZ "#1f3a5f
ROTULA "Puerto
PARADA 30 70 "Palmeras
PARADA 80 90 "Cueva
PARADA -120 60 FRASE "Gran "roca
; El último tramo lleva al tesoro, marcado en rojo.
GIRADERECHA 70
COLORLÁPIZ "#8a6a3f
AVANZA 50
COLORLÁPIZ "#c0392b
ROTULA "X
OCULTATORTUGA`,
  },
  arcos: {
    name: "Arcos · Cara sonriente",
    outcome: "Dibuja una cara con círculos y un arco, y rellena la cara y los ojos.",
    source: `; ARCO ángulo radio dibuja un arco alrededor de la tortuga, sin moverla.
; Empieza hacia donde mira la tortuga y gira a la derecha. Prueba ARCO 180 en la boca.
PARA CIRCULO :radio
  ARCO 360 :radio
FIN

PARA VE :x :y
  SUBELÁPIZ
  PONXY :x :y
  BAJALÁPIZ
FIN

GROSORLÁPIZ 4
COLORLÁPIZ "#c9821a
CIRCULO 90
VE -32 28
CIRCULO 12
VE 32 28
CIRCULO 12
; La boca es un trozo de círculo que va de un lado a otro, por abajo.
VE 0 0
PONRUMBO 120
ARCO 120 50

; Rellena la cara desde arriba y los ojos desde su centro.
COLORLÁPIZ "#ffe29a
VE 0 65
RELLENA
COLORLÁPIZ "#1f3a5f
VE -32 28
RELLENA
VE 32 28
RELLENA
OCULTATORTUGA`,
  },
  relleno: {
    name: "Relleno · Vidriera",
    outcome: "Divide un cuadrado en cuatro triángulos y pinta cada uno con RELLENA.",
    source: `; RELLENA pinta la zona cerrada donde está la tortuga con la tinta de COLORLÁPIZ.
; Las líneas hacen de paredes. Prueba a quitar una diagonal y mira cómo se escapa el color.
PARA PINTA :x :y :tinta
  SUBELÁPIZ
  PONXY :x :y
  COLORLÁPIZ :tinta
  RELLENA
FIN

GROSORLÁPIZ 4
COLORLÁPIZ "#f3f7e9
REPITE 4 [ AVANZA 160 GIRADERECHA 90 ]
PONXY 160 160
SUBELÁPIZ
PONXY 0 160
BAJALÁPIZ
PONXY 160 0

PINTA 80 30 "#ff8a65
PINTA 130 80 "#ffd166
PINTA 80 130 "#76f2bf
PINTA 30 80 "#7aa7ff
OCULTATORTUGA`,
  },
  art: {
    name: "Art · Curvas de hilo",
    outcome: "Dibuja curvas aparentes con rectas de cuatro tintas. Cambia el número de hilos y compara la trama.",
    source: `; Los dos extremos de cada hilo avanzan en sentidos opuestos por ejes perpendiculares.
; Prueba a cambiar hilos de 16 a 10 y observa cuánto espacio queda entre las líneas.
HAZ "hilos 16
HAZ "radio 120

PARA ABANICO :signoX :signoY :tinta :hilos :radio
  COLORLÁPIZ :tinta
  GROSORLÁPIZ 1.5
  REPITE :hilos [
    LOCAL "fraccion CUENTAREP / (:hilos + 1)
    SUBELÁPIZ
    PONXY (:signoX * :radio * :fraccion) 0
    BAJALÁPIZ
    PONXY 0 (:signoY * :radio * (1 - :fraccion))
  ]
FIN

; El marco marca los cuatro extremos. Los hilos quedan dentro.
SUBELÁPIZ
PONXY 0 :radio
COLORLÁPIZ "#557d7c
GROSORLÁPIZ 1
BAJALÁPIZ
PONXY :radio 0
PONXY 0 (0 - :radio)
PONXY (0 - :radio) 0
PONXY 0 :radio

ABANICO  1  1 "#76f2bf :hilos :radio
ABANICO -1  1 "#c5a6ff :hilos :radio
ABANICO -1 -1 "#ffb454 :hilos :radio
ABANICO  1 -1 "#ffa1bc :hilos :radio
SUBELÁPIZ
PONXY 0 0`,
  },
  paquetesDeDiez: {
    name: "Decenas · Haz paquetes de diez",
    outcome: "Mira el 29: dos paquetes de diez y nueve fichas sueltas. Si añades una ficha, ¿cuántos paquetes completos tendrás? Predice y pulsa Ejecutar.",
    source: `; Cada paquete contiene diez fichas.
; Ejecuta y compara el 29 con el tablero de abajo.
; Para el reto, cambia los números de estas dos líneas.
HAZ "decenas 3
HAZ "unidades 0

${numerationBoard}
; Arriba está el 29. Abajo hay una ficha más, y con ella se completa otro paquete.
TABLERO 2 9 62
TABLERO :decenas :unidades -36
OCULTATORTUGA`,
  },
  mismasCifras: {
    name: "Decenas · Las mismas cifras",
    outcome: "24 y 42 tienen las mismas cifras. ¿Cuál vale más? Predice, pulsa Ejecutar y fíjate en dónde hay más paquetes de diez.",
    source: `; Arriba, decenas y unidades. Abajo, al revés.
; Para el reto, intercambia el 2 y el 4 de estas líneas.
HAZ "decenas 2
HAZ "unidades 4

${numerationBoard}
TABLERO :decenas :unidades 82
TABLERO :unidades :decenas -56

HAZ "arriba (:decenas * 10 + :unidades)
HAZ "abajo (:unidades * 10 + :decenas)
HAZ "comparacion FRASE :arriba FRASE "= :abajo
SI :arriba < :abajo [
  HAZ "comparacion FRASE :arriba FRASE [es menor que] :abajo
]
SI :arriba > :abajo [
  HAZ "comparacion FRASE :arriba FRASE [es mayor que] :abajo
]
COLORLÁPIZ "#193b34
VE -116 -18
ROTULA :comparacion
ESCRIBE :comparacion
OCULTATORTUGA`,
  },
  saltaEnLaRecta: {
    name: "Saltos · Salta en la recta",
    outcome: "La tortuga sale del 8. ¿Cuántos saltos de dos en dos necesita para llegar al 14? Predice el recorrido y adelanta la tortuga con REPITE.",
    source: `; SALTO 2 avanza dos casillas de la recta.
; Cambia cuántas veces se repite el salto.
RECTA
REPITE 1 [
  SALTO 2
]

PARA RECTA
  OCULTATORTUGA
  PONCOLORFONDO "#fff9ec
  COLORLÁPIZ "#193b34
  GROSORLÁPIZ 2
  SUBELÁPIZ
  PONXY -125 0
  BAJALÁPIZ
  PONXY 125 0
  DESDE "n 8 14 1 [
    HAZ "x ((:n - 11) * 36)
    SUBELÁPIZ
    PONXY :x -4
    BAJALÁPIZ
    PONXY :x 4
    SUBELÁPIZ
    PONXY (:x - 12) -20
    ROTULA :n
  ]
  PONXY -130 -43
  ROTULA "Salida
  PONXY 91 -43
  ROTULA "Meta
  PONXY -108 0
  PONRUMBO 90
  MUESTRATORTUGA
  ESCRIBE [Salida en 8]
FIN

PARA SALTO :pasos
  HAZ "radio (:pasos * 18)
  HAZ "centro (POSX + :radio)
  COLORLÁPIZ "#23715a
  GROSORLÁPIZ 3
  SUBELÁPIZ
  PONXY :centro 0
  PONRUMBO 270
  BAJALÁPIZ
  ARCO 180 :radio
  SUBELÁPIZ
  PONXY (:centro - 12) (:radio + 5)
  ROTULA FRASE "+ :pasos
  PONXY (:centro + :radio) 0
  PONRUMBO 90
  ESCRIBE FRASE [Caes en] (POSX / 36 + 11)
FIN`,
  },
  cuentaLasHuellas: {
    name: "Contar · Cuenta las huellas",
    outcome: "Cuenta una vez cada marca que deja la tortuga. ¿Cuántas marcas hay? El último número que dices indica cuántas hay en total.",
    source: `; Cada vuelta de REPITE deja una huella.
; Ejecuta, cuenta las marcas y cambia cuántas vueltas das.
PONCOLORFONDO "#fff9ec
REPITE 4 [
  HUELLA CUENTAREP
]

PARA HUELLA :numero
  HAZ "x ((:numero - 4) * 36)
  COLORLÁPIZ "#23715a
  GROSORLÁPIZ 3
  SUBELÁPIZ
  PONXY :x 0
  BAJALÁPIZ
  ARCO 360 8
  SUBELÁPIZ
  COLORLÁPIZ "#193b34
  PONXY (:x - 10) -30
  ROTULA :numero
  ESCRIBE :numero
  PONXY :x 25
  PONRUMBO 90
FIN`,
  },
  palabras: {
    name: "Palabras · Letras y fragmentos",
    outcome: "Cuenta caracteres y extrae letras de una palabra con tilde y ñ.",
    source: `; Cambia CAÑÓN por otra palabra de al menos cuatro letras.
; Verás el número de caracteres, la primera letra y un fragmento.
HAZ "texto "CAÑÓN
ESCRIBE CUENTA :texto
ESCRIBE LETRA 1 :texto
ESCRIBE SUBPALABRA 2 3 :texto`,
  },
  frases: {
    name: "Frases · Texto con espacios",
    outcome: "Introduce una frase y cuenta sus caracteres, incluidos los espacios.",
    source: `; Escribe una frase en el campo que aparece tras pulsar Ejecutar.
; Prueba «hola mundo». Los espacios también cuentan como caracteres.
HAZ "frase LEEPALABRA
ESCRIBE :frase
ESCRIBE CUENTA :frase`,
  },
  listas: {
    name: "Listas · Una ruta de giros",
    outcome: "Recorre una lista de cinco ángulos para dirigir la tortuga.",
    source: `; Cada elemento de la lista indica un giro. Las posiciones empiezan en 1.
; Añade otro giro a la lista y mira cómo se alarga la ruta.
HAZ "giros [45 90 45 90 45]
HAZ "posicion 1
REPITE CUENTA :giros [
  AVANZA 60
  GIRADERECHA ELEMENTO :posicion :giros
  HAZ "posicion :posicion + 1
]
ESCRIBE :giros`,
  },
  extremos: {
    name: "Listas · Los dos extremos",
    outcome: "Crea una lista, añade y quita fichas por ambos extremos y lee el resultado en Salida.",
    source: `; LISTA crea dos elementos. PONPRIMERO y PONULTIMO devuelven una lista nueva.
HAZ "base LISTA "AZUL "VERDE
HAZ "fichas PONULTIMO "AMARILLA PONPRIMERO "ROJA :base

ESCRIBE :fichas
ESCRIBE PRIMERO :fichas
ESCRIBE ULTIMO :fichas
ESCRIBE MENOSPRIMERO :fichas
ESCRIBE MENOSULTIMO :fichas
ESCRIBE INVIERTE :fichas

; La lista de partida conserva sus dos fichas.
ESCRIBE :base`,
  },
  eligeFicha: {
    name: "Listas · Busca y elige una ficha",
    outcome: "Distingue una lista de una palabra, busca fichas y elige una al azar.",
    source: `; Cambia MORADA por un color de la lista y vuelve a ejecutar.
HAZ "fichas ["ROJA "AZUL "VERDE "AZUL "AMARILLA]

ESCRIBE ESLISTA :fichas
ESCRIBE ESLISTA "AZUL
ESCRIBE MIEMBRO "AZUL :fichas
ESCRIBE MIEMBRO "MORADA :fichas

; ELIGE sortea una posición. MIEMBRO empieza por la primera aparición.
HAZ "elegida ELIGE :fichas
ESCRIBE :elegida
ESCRIBE MIEMBRO :elegida :fichas`,
  },
  fichasRepetidas: {
    name: "Listas · Fichas repetidas",
    outcome: "Quita todas las fichas de un color y conserva la última aparición de cada color repetido.",
    source: `; Cambia AZUL por VERDE y compara las listas en Salida.
HAZ "fichas ["ROJA "AZUL "ROJA "VERDE "AZUL "AMARILLA "VERDE]
HAZ "sinazules QUITA "AZUL :fichas

ESCRIBE :sinazules
ESCRIBE SINREPETIDOS :fichas
ESCRIBE SINREPETIDOS :sinazules

; QUITA y SINREPETIDOS dejan intacta la lista de partida.
ESCRIBE :fichas`,
  },
  mensaje: {
    name: "Listas · Construye un mensaje",
    outcome: "Une un saludo, forma una frase como lista y añade una despedida.",
    source: `; PALABRA une dos palabras. FRASE incorpora los elementos de una lista.
; ANEXA añade un elemento al final. Prueba a cambiar "AMIGA por ["HASTA "PRONTO].
HAZ "saludo PALABRA "BIEN "VENIDA
HAZ "mensaje FRASE :saludo ["A "KLOGO]
HAZ "completo ANEXA "AMIGA :mensaje

ESCRIBE :saludo
ESCRIBE :mensaje
ESCRIBE :completo`,
  },
  pilas: {
    name: "Pilas · La última ficha sale primero",
    outcome: "Apila tres fichas y sácalas en orden inverso al de entrada.",
    source: `; La cima es el primer elemento. APILA añade y DESAPILA quita la cima.
; Cambia el orden de las fichas y predice cuál saldrá primero.
HAZ "pila []
HAZ "pila APILA "ROJA :pila
HAZ "pila APILA "AZUL :pila
HAZ "pila APILA "VERDE :pila
MIENTRAS ESVACIA :pila = 0 [
  ESCRIBE CIMA :pila
  HAZ "pila DESAPILA :pila
]`,
  },
  recursion: {
    name: "Recursión · Cuenta atrás",
    outcome: "Haz que un procedimiento se llame a sí mismo hasta llegar a cero.",
    source: `; Cada llamada imprime su número y llama al mismo procedimiento con uno menos.
; Cuando llega a cero, ALTO termina esa llamada. Prueba a empezar en 8.
PARA CUENTAATRAS :n
  ESCRIBE :n
  SI :n = 0 [ALTO]
  CUENTAATRAS (:n - 1)
FIN

CUENTAATRAS 5`,
  },
  devuelve: {
    name: "Procedimientos · Calcula y devuelve",
    outcome: "Usa los valores de dos procedimientos en expresiones y observa cómo LOCAL protege una variable exterior.",
    source: `; LOCAL crea una variable para esta llamada. DEVUELVE entrega su valor.
; Cambia SUMAHASTA 5 por SUMAHASTA 6 y predice la suma.
HAZ "resultado 100

PARA DOBLE :n
  LOCAL "resultado :n * 2
  DEVUELVE :resultado
FIN

PARA SUMAHASTA :n
  SI :n < 1 [DEVUELVE 0]
  LOCAL "subtotal SUMAHASTA (:n - 1)
  DEVUELVE :subtotal + :n
FIN

ESCRIBE DOBLE 7
ESCRIBE 3 + DOBLE 7
ESCRIBE SUMAHASTA 5
ESCRIBE :resultado`,
  },
  circulo: {
    name: "Lógica · Dentro del círculo",
    outcome: "Pinta 1500 puntos al azar: menta dentro del círculo, violeta en el borde y ámbar fuera. Estima π, normalmente entre 3 y 3,3.",
    source: `; Lanza puntos al azar sobre un cuadrado y mira cuántos caen dentro del círculo.
; RAIZCUADRADA mide la distancia al centro e Y junta dos condiciones para el borde.
; Prueba con 3000 puntos: la estimación de π suele acercarse más.
LIENZO 60 60
PALETA ["#192c36 "#76f2bf "#ffb454 "#c5a6ff]
HAZ "puntos 1500
HAZ "dentro 0
REPITE :puntos [
  HAZ "x AZAR 60
  HAZ "y AZAR 60
  HAZ "distancia RAIZCUADRADA ((POTENCIA (:x - 29.5) 2) + (POTENCIA (:y - 29.5) 2))
  SI :distancia <= 30 [HAZ "dentro :dentro + 1]
  SISINO Y (:distancia > 27) (:distancia <= 30) [
    PONPIXEL :x :y 3
  ] [
    PONPIXEL :x :y 1 + (:distancia > 30)
  ]
]
HAZ "estimacion 4 * :dentro / :puntos
ESCRIBE FRASE "Dentro: :dentro
HAZ "aproximado (REDONDEA (:estimacion * 100)) / 100
ESCRIBE FRASE "π≈ :aproximado
SISINO (ABSOLUTO (:estimacion - PI)) < 0.2 [ESCRIBE "¡Cerca!] [ESCRIBE "Lejos]`,
  },
  rosa: {
    name: "Trigonometría · Rosa polar",
    outcome: "Dibuja con PONXY, SEN y COS una rosa de 8 pétalos y vuelve al centro con RUMBOHACIA y DISTANCIA. Imprime [Distancia: 100], [Rumbo: 270] y [0 0].",
    source: `; SEN y COS convierten un ángulo y un radio en coordenadas X e Y.
; Cambia :petalos a 3 o a 5 y vuelve a ejecutar.
HAZ "petalos 4
COLORLÁPIZ "#76f2bf
SUBELÁPIZ
PONXY 100 0
BAJALÁPIZ
HAZ "a 0
REPITE 120 [
  HAZ "a :a + 3
  HAZ "r 100 * COS (:petalos * :a)
  PONXY :r * COS :a :r * SEN :a
]
; RUMBOHACIA y DISTANCIA llevan la tortuga de vuelta al centro.
ESCRIBE FRASE "Distancia: DISTANCIA 0 0
ESCRIBE FRASE "Rumbo: RUMBOHACIA 0 0
COLORLÁPIZ "#ffb454
GD (RUMBOHACIA 0 0) - RUMBO
AV DISTANCIA 0 0
ESCRIBE LISTA POSX POSY`,
  },
  baliza: {
    name: "Teclado · Ruta a la baliza",
    outcome: "Guía la ficha turquesa con las flechas hasta la baliza dorada.",
    source: `; Cada flecha que pulsas mueve la ficha una casilla. Las paredes no la dejan pasar.
; Prueba a cambiar una pared interior del mapa para crear otro recorrido.
PARA BLOQUE :x :y :lado :tinta
  LOCAL "py :y
  REPITE :lado [
    LOCAL "px :x
    REPITE :lado [
      PONPIXEL :px :py :tinta
      HAZ "px :px + 1
    ]
    HAZ "py :py + 1
  ]
FIN

PARA FICHA :col :fil :tinta
  BLOQUE (4 * (:col - 1) + 1) (4 * (:fil - 1) + 1) 2 :tinta
FIN

PARA DIBUJAMAPA
  LOCAL "fil 1
  REPITE 7 [
    LOCAL "col 1
    REPITE 10 [
      SI LETRA :col (ELEMENTO :fil :mapa) = "# [
        BLOQUE (4 * (:col - 1)) (4 * (:fil - 1)) 4 1
      ]
      HAZ "col :col + 1
    ]
    HAZ "fil :fil + 1
  ]
  FICHA 9 6 3
  FICHA :columna :fila 2
FIN

PARA MUEVE :dx :dy
  LOCAL "destinox :columna + :dx
  LOCAL "destinoy :fila + :dy
  SI LETRA :destinox (ELEMENTO :destinoy :mapa) = "# [ALTO]
  FICHA :columna :fila 0
  HAZ "columna :destinox
  HAZ "fila :destinoy
  HAZ "movimientos :movimientos + 1
  FICHA :columna :fila 2
FIN

HAZ "mapa ["########## "#....#...# "#.##.#.#.# "#.#....#.# "#...####.# "###......# "##########]
HAZ "columna 2
HAZ "fila 2
HAZ "movimientos 0
LIENZO 40 28
PALETA ["#10162b "#415984 "#68eadf "#ffe29a]
DIBUJAMAPA

MIENTRAS ([:columna :fila] = [9 6]) = 0 [
  HAZ "tecla LEETECLA
  SI :tecla = "IZQUIERDA [MUEVE -1 0]
  SI :tecla = "DERECHA [MUEVE 1 0]
  SI :tecla = "ARRIBA [MUEVE 0 -1]
  SI :tecla = "ABAJO [MUEVE 0 1]
]
ESCRIBE ["¡Llegaste "a "la "baliza!]
ESCRIBE ["Movimientos :movimientos]`,
  },
  clics: {
    name: "Ratón · Une los puntos",
    outcome: "Haz clic en seis puntos del lienzo: la tortuga los une y cierra la figura.",
    source: `; LEECLIC espera un clic en el lienzo y devuelve la lista [x y] de ese punto.
; Haz clic en seis puntos. Cambia el 5 de REPITE para unir más o menos puntos.
PARA VE :punto
  PONXY PRIMERO :punto ULTIMO :punto
FIN

GROSORLÁPIZ 3
COLORLÁPIZ "#ffc36b
SUBELÁPIZ
HAZ "inicio LEECLIC
VE :inicio
BAJALÁPIZ
REPITE 5 [
  VE LEECLIC
]
VE :inicio
ESCRIBE FRASE "Figura "cerrada`,
  },
  melodia: {
    name: "Música · Melodía de cinco notas",
    outcome: "Toca cinco notas y dibuja un tramo con cada una. Cambia la lista o la duración y escucha el resultado.",
    source: `; El número de cada nota dice si suena más grave o más aguda: DO5 suena más agudo que DO4.
; NOTA y SILENCIO llevan la duración en milisegundos: 1000 es un segundo.
HAZ "melodia ["DO4 "MI4 "SOL4 "FA4 "DO5]
REPITE CUENTA :melodia [
  AVANZA 35
  GIRADERECHA 25
  NOTA ELEMENTO CUENTAREP :melodia 220
  SILENCIO 60
]`,
  },
  piano: {
    name: "Música · Piano con el teclado",
    outcome: "Toca en el lienzo o con A S D F G H J K y W E T Y U. Usa R para iniciar o terminar la grabación y P para reproducirla.",
    source: `; Cada tecla negra tiene su letra y su nota.
; Cambia la duración de NOTA en SUENA para tocar notas más largas.
HAZ "teclas ["A "S "D "F "G "H "J "K]
HAZ "notas ["DO4 "RE4 "MI4 "FA4 "SOL4 "LA4 "SI4 "DO5]
HAZ "negras [["W 1 "DO#4] ["E 2 "RE#4] ["T 4 "FA#4] ["Y 5 "SOL#4] ["U 6 "LA#4]]
HAZ "anchonegra 8
HAZ "altonegra 24
HAZ "melodia []
HAZ "grabando 0

PARA RECTANGULO :izquierda :ancho :alto :tinta
  REPITE :alto [
    LOCAL "y CUENTAREP
    REPITE :ancho [
      PONPIXEL (:izquierda + CUENTAREP - 1) :y :tinta
    ]
  ]
FIN

PARA DIBUJABLANCA :indice :tinta
  RECTANGULO (12 * (:indice - 1) + 1) 11 40 :tinta
FIN

PARA XNEGRA :hueco
  DEVUELVE 12 * :hueco - :anchonegra / 2
FIN

PARA DIBUJANEGRA :hueco :tinta
  RECTANGULO (XNEGRA :hueco) :anchonegra :altonegra :tinta
FIN

PARA REPASANEGRAS
  REPITE CUENTA :negras [
    LOCAL "negra ELEMENTO CUENTAREP :negras
    DIBUJANEGRA (ELEMENTO 2 :negra) 3
  ]
FIN

PARA ESTADOPIANO :modo
  ESCRIBE ["PIANOESTADO :modo (CUENTA :melodia)]
FIN

PARA GRABA
  SI :grabando [
    HAZ "grabando 0
    ESTADOPIANO "LISTO
    ALTO
  ]
  HAZ "melodia []
  HAZ "grabando 1
  ESTADOPIANO "GRABANDO
FIN

PARA SUENA :nota
  SI :grabando [
    HAZ "melodia ANEXA :nota :melodia
    ESTADOPIANO "GRABANDO
  ]
  ESCRIBE :nota
  NOTA :nota 220
FIN

PARA TOCA :entrada
  REPITE CUENTA :negras [
    LOCAL "negra ELEMENTO CUENTAREP :negras
    LOCAL "nota ELEMENTO 3 :negra
    SI (:entrada = ELEMENTO 1 :negra) + (:entrada = :nota) [
      LOCAL "hueco ELEMENTO 2 :negra
      DIBUJANEGRA :hueco 4
      SUENA :nota
      DIBUJANEGRA :hueco 3
      ALTO
    ]
  ]
  REPITE CUENTA :teclas [
    LOCAL "indice CUENTAREP
    LOCAL "nota ELEMENTO :indice :notas
    SI (:entrada = ELEMENTO :indice :teclas) + (:entrada = :nota) [
      DIBUJABLANCA :indice 2
      REPASANEGRAS
      SUENA :nota
      DIBUJABLANCA :indice 1
      REPASANEGRAS
      ALTO
    ]
  ]
FIN

PARA REPRODUCE
  SI :grabando [ALTO]
  SI ESVACIA :melodia [ALTO]
  ESTADOPIANO "REPRODUCIENDO
  REPITE CUENTA :melodia [
    TOCA (ELEMENTO CUENTAREP :melodia)
    SI CUENTAREP < CUENTA :melodia [SILENCIO 60]
  ]
  ESTADOPIANO "LISTO
FIN

LIENZO (12 * CUENTA :teclas) 44
PALETA ["#21353d "#fff7df "#76f2bf "#111c24 "#17685a]
REPITE CUENTA :teclas [DIBUJABLANCA CUENTAREP 1]
REPASANEGRAS
ESCRIBE FRASE "PIANO :teclas
REPITE CUENTA :negras [
  HAZ "negra ELEMENTO CUENTAREP :negras
  ESCRIBE ["PIANONEGRA (ELEMENTO 1 :negra) (XNEGRA (ELEMENTO 2 :negra)) 1 :anchonegra :altonegra]
]
ESTADOPIANO "LISTO

MIENTRAS 1 [
  HAZ "tecla NORMALIZAPALABRA LEETECLA
  SI :tecla = "ESCAPE [ALTO]
  SISINO :tecla = "R [GRABA] [
    SISINO :tecla = "P [REPRODUCE] [TOCA :tecla]
  ]
]`,
  },
  fractales: {
    name: "Fractales · Curva de Koch",
    outcome: "Divide cada tramo de la curva en otros cuatro hasta dibujar 64 trazos.",
    source: `; Cada tramo se sustituye por cuatro tramos de un tercio de largo.
; Prueba niveles del 0 al 4 y compara cuántos trazos produce cada uno.
PARA KOCH :nivel :longitud
  SI :nivel = 0 [
    AVANZA :longitud
    ALTO
  ]
  KOCH (:nivel - 1) (:longitud / 3)
  GIRAIZQUIERDA 60
  KOCH (:nivel - 1) (:longitud / 3)
  GIRADERECHA 120
  KOCH (:nivel - 1) (:longitud / 3)
  GIRAIZQUIERDA 60
  KOCH (:nivel - 1) (:longitud / 3)
FIN

PONRUMBO 90
KOCH 3 240`,
  },
  cubo3d: {
    name: "Tortuga 3D · Cubo de líneas",
    outcome: "Dibuja doce aristas a dos alturas y gira la cámara para ver el cubo desde otro ángulo.",
    source: `; X e Y forman el plano de la base. Z es la altura.
; Cambia alto de :lado a 2 * :lado para convertir el cubo en una torre.
HAZ "lado 110
HAZ "mitad :lado / 2
HAZ "alto :lado

PARA CUADRADOZ :altura
  SUBELÁPIZ
  PONXYZ (-:mitad) (-:mitad) :altura
  BAJALÁPIZ
  PONXYZ :mitad (-:mitad) :altura
  PONXYZ :mitad :mitad :altura
  PONXYZ (-:mitad) :mitad :altura
  PONXYZ (-:mitad) (-:mitad) :altura
FIN

PARA ARISTA :x :y
  SUBELÁPIZ
  PONXYZ :x :y 0
  BAJALÁPIZ
  PONXYZ :x :y :alto
FIN

MODO3D
COLORLÁPIZ "#76f2bf
GROSORLÁPIZ 2
CUADRADOZ 0

COLORLÁPIZ "#ffc36b
GROSORLÁPIZ 4
CUADRADOZ :alto

COLORLÁPIZ "#c5a6ff
GROSORLÁPIZ 2
ARISTA (-:mitad) (-:mitad)
ARISTA :mitad (-:mitad)
ARISTA :mitad :mitad
ARISTA (-:mitad) :mitad
SUBELÁPIZ
PONXYZ 0 0 0`,
  },
  rampa3d: {
    name: "Tortuga 3D · Subida y bajada",
    outcome: "Dibuja una subida, un tramo horizontal y una bajada usando AVANZA a tres inclinaciones distintas.",
    source: `; La inclinación positiva sube y la negativa baja. Prueba 45 grados en lugar de 30.
HAZ "pendiente 30
MODO3D
PONRUMBO 90

COLORLÁPIZ "#76f2bf
SUBENARIZ :pendiente
AVANZA 80

COLORLÁPIZ "#ffc36b
BAJANARIZ :pendiente
AVANZA 55

COLORLÁPIZ "#c5a6ff
BAJANARIZ :pendiente
AVANZA 80
SUBENARIZ :pendiente`,
  },
  alabeo3d: {
    name: "Tortuga 3D · Alabeo e inclinación",
    outcome: "Dibuja una subida, un giro a la derecha a la misma altura y una bajada. La aleta dorada muestra cómo gira la tortuga sobre su eje.",
    source: `; Cambia 30 por 45 y compara la subida y el giro horizontal.
HAZ "angulo 30
MODO3D
PONRUMBO 90

; Sube con la tortuga recta y luego nivela la nariz.
COLORLÁPIZ "#76f2bf
SUBENARIZ :angulo
AVANZA 80
BAJANARIZ :angulo

; Tras un cuarto de vuelta de alabeo, subir la nariz cambia el rumbo.
ALABEADERECHA 90
ESPERA 500
SUBENARIZ :angulo
COLORLÁPIZ "#ffc36b
AVANZA 80

; Endereza la tortuga y vuelve a la altura inicial.
ALABEAIZQUIERDA 90
ESPERA 500
BAJANARIZ :angulo
COLORLÁPIZ "#c5a6ff
AVANZA 80`,
  },
  cubocolor3d: {
    name: "Tortuga 3D · Cubo de caras de colores",
    outcome: "Construye seis caras rellenas, cada una de un color. Gira y baja la cámara para descubrir las que quedan ocultas.",
    source: `; Cambia el alto a 160 y convierte el cubo en una torre.
HAZ "lado 100
HAZ "alto :lado

; Cada vértice es una lista [x y z].
PARA VERTICE :x :y :z
  DEVUELVE PONULTIMO :z LISTA :x :y
FIN

PARA PANEL :tinta :a :b :c :d
  COLORLÁPIZ :tinta
  CARA3D PONULTIMO :d PONULTIMO :c LISTA :a :b
FIN

HAZ "a [0 0 0]
HAZ "b VERTICE :lado 0 0
HAZ "c VERTICE :lado :lado 0
HAZ "d VERTICE 0 :lado 0
HAZ "e VERTICE 0 0 :alto
HAZ "f VERTICE :lado 0 :alto
HAZ "g VERTICE :lado :lado :alto
HAZ "h VERTICE 0 :lado :alto

MODO3D
PANEL "#df6377 :a :b :c :d
PANEL "#ffe075 :e :f :g :h
PANEL "#638ff0 :a :b :f :e
PANEL "#52c7af :b :c :g :f
PANEL "#ffad66 :c :d :h :g
PANEL "#b88aec :d :a :e :h`,
  },
};
