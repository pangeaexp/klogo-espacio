// Each pair points to code by instruction so it stays useful after lines move.
const hintsByLesson = {
  tortuga: [
    [/^\s*(?:AVANZA|AV|FORWARD|FD)\b/i, "Cada AVANZA 100 dibuja un lado. Un cuadrado tiene cuatro lados."],
    [/^\s*(?:GIRADERECHA|GD|RIGHT|RT)\b/i, "Entre dos lados, la tortuga gira con GIRADERECHA 90. Escribe debajo GIRADERECHA 90 y AVANZA 100, dos veces."],
  ],
  bucles: [
    [/^\s*(?:REPITE|REPEAT)\b/i, "Mira el número que va después de REPITE. Cada vuelta dibuja un lado."],
    [/\b(?:GIRADERECHA|GD|RIGHT|RT)\b/i, "Haz que AVANZA recorra 100. Reparte los 360° de una vuelta completa entre los tres lados y usa ese giro en cada vuelta."],
  ],
  poligonos: [
    [/^\s*REPITE\b/i, "Busca el número que indica cuántos lados dibuja REPITE."],
    [/\b(?:GIRADERECHA|GD)\b/i, "Divide 360 entre el número de lados para que la figura se cierre."],
  ],
  variables: [
    [/^\s*REPITE\b/i, "Cada vuelta de este bloque produce un trazo. Revisa cuántas vueltas pide REPITE."],
    [/^\s*HAZ\s+"paso\s+:paso\s*\+/i, "Dentro del bucle, cambia el incremento que se suma a :paso. Conserva el valor inicial y haz que cada trazo crezca 3."],
  ],
  argumentos: [
    [/^\s*POLIGONO\b/i, "Mira una llamada a POLIGONO. El primer número indica los lados y el segundo, su longitud."],
    [/^\s*PONXY\b/i, "Mueve la tortuga a un sitio libre con el lápiz subido. Bájalo y añade una llamada con cuatro lados de 60."],
  ],
  desde: [
    [/^\s*DESDE\s+"lado\b/i, "Busca los valores inicial, final y de paso del bucle DESDE."],
    [/^\s*CUADRADO\s+:lado\b/i, "Cada llamada usa el valor de :lado. Empieza en 10 y avanza de 10 en 10 hasta el valor final de 100."],
  ],
  aleatorio: [
    [/^\s*REPITE\b/i, "REPITE controla cuántas tiradas se escriben en Salida."],
    [/^\s*ESCRIBE\b/i, "Pide dos valores independientes a AZAR 6, suma 1 a cada uno y escribe la suma de los dos dados."],
  ],
  colores: [
    [/^\s*PALETA\b/i, "Busca la paleta. El índice 0 es el fondo, así que necesitas cuatro colores adicionales."],
    [/^\s*PONPIXEL\s+:columna\b/i, "En los bucles que rodean a PONPIXEL, usa cuatro franjas de 15 columnas. El ancho del lienzo sigue siendo 60."],
  ],
  rosetaColores: [
    [/^\s*HAZ\s+"tintas\b/i, "La lista de tintas determina cuántos colores alterna la roseta."],
    [/^\s*TRIANGULO\s+\S+/i, "Haz 16 vueltas en el bucle que llama a TRIANGULO y reparte 360° entre 16 para el giro de después."],
  ],
  grosores: [
    [/^\s*MUESTRA\b/i, "Mira una línea con MUESTRA. Sus tres números eligen la altura, el grosor y la tinta."],
    [/^\s*MUESTRA\s+-/i, "Añade otra línea con MUESTRA debajo de la última. Pon una altura menor y 20 como grosor."],
  ],
  rotulos: [
    [/^\s*PARADA\s+\S+/i, "Cada línea con PARADA avanza un tramo y escribe un nombre."],
    [/^\s*PARADA\b.*\bFRASE\b/i, "Añade otra línea con PARADA junto a las demás, antes del tramo del tesoro. Elige un giro, una distancia y un nombre nuevo."],
  ],
  arcos: [
    [/^\s*CIRCULO\s+\S+/i, "Busca las líneas con CIRCULO. Dibujan alrededor de donde está la tortuga."],
    [/^\s*RELLENA\b/i, "Con VE sitúa la nariz entre los ojos y la boca. Dibuja un círculo de radio pequeño, cambia de tinta y rellénalo desde su centro."],
  ],
  relleno: [
    [/^\s*REPITE\s+.*\b(?:AVANZA|AV)\b/i, "Observa cómo REPITE dibuja el contorno cerrado del cuadrado."],
    [/^\s*PINTA\s+\S+/i, "Dibuja otro cuadrado en un sitio libre. Usa PINTA con un punto interior y la tinta #c5a6ff."],
  ],
  art: [
    [/^\s*HAZ\s+"hilos\b/i, "Busca la variable que guarda el número de hilos por abanico."],
    [/^\s*REPITE\s+:hilos\b/i, "El mismo valor controla las cuatro llamadas a ABANICO. Ajusta la variable inicial para que cada una haga 10 vueltas."],
  ],
  paquetesDeDiez: [
    [/^\s*HAZ\s+"decenas\b/i, "Cada paquete vale diez. ¿Cuántos paquetes completos caben en 34?"],
    [/^\s*HAZ\s+"unidades\b/i, "Tres paquetes hacen 30. Cambia las unidades a 4 para formar 34."],
  ],
  mismasCifras: [
    [/^\s*HAZ\s+"decenas\b/i, "En 42, el 4 está en las decenas. ¿Cuántos paquetes de diez van arriba?"],
    [/^\s*HAZ\s+"unidades\b/i, "Pon 4 en decenas y 2 en unidades. El tablero de abajo ya usa esas cifras al revés."],
  ],
  saltaEnLaRecta: [
    [/^\s*REPITE\b/i, "El número tras REPITE dice cuántos saltos das. Cuenta de dos en dos desde 8 hasta 14."],
    [/^\s*SALTO\s+2\b/i, "Conserva SALTO 2 y cambia REPITE 1 a REPITE 3: 8 → 10 → 12 → 14."],
  ],
  cuentaLasHuellas: [
    [/^\s*REPITE\b/i, "Mira el número que va después de REPITE. ¿Cuántas marcas ves con ese número?"],
    [/^\s*HUELLA\s+CUENTAREP\b/i, "Cada vuelta deja una sola marca. Pon 7 después de REPITE para dibujar siete huellas."],
  ],
  palabras: [
    [/^\s*HAZ\s+"texto\b/i, "Busca dónde se guarda la palabra que se analiza."],
    [/^\s*ESCRIBE\s+LETRA\b/i, "Elige una palabra de siete letras. Para escribir la última, usa CUENTA :texto como posición de LETRA."],
  ],
  frases: [
    [/^\s*HAZ\s+"frase\b/i, "La entrada queda guardada en :frase, incluidos los espacios."],
    [/^\s*ESCRIBE\s+CUENTA\b/i, "Añade dos ESCRIBE después del recuento. Usa LETRA con la posición 1 y con la longitud de :frase."],
  ],
  listas: [
    [/^\s*HAZ\s+"giros\b/i, "Cada elemento de :giros representa un giro de la ruta."],
    [/^\s*REPITE\s+CUENTA\s+:giros\b/i, "Amplía la lista hasta ocho ángulos. CUENTA ajusta por sí sola el número de vueltas."],
  ],
  extremos: [
    [/^\s*HAZ\s+"fichas\b/i, "Busca la línea que construye :fichas y fíjate en PONPRIMERO."],
    [/^\s*ESCRIBE\s+:fichas\b/i, "Vuelve a usar PONPRIMERO con NEGRA y la lista completa. Escribe la nueva lista en Salida."],
  ],
  eligeFicha: [
    [/^\s*HAZ\s+"fichas\b/i, "Localiza la lista que contiene todas las fichas."],
    [/^\s*ESCRIBE\s+MIEMBRO\b/i, "Añade una línea de salida con PONULTIMO para poner NARANJA al final de :fichas."],
  ],
  fichasRepetidas: [
    [/^\s*HAZ\s+"sinazules\b/i, "Fíjate en cómo QUITA elimina todas las fichas de un color."],
    [/^\s*ESCRIBE\s+SINREPETIDOS\b/i, "Aplica QUITA a ROJA sobre la lista original y pasa la lista resultante a SINREPETIDOS antes de escribirla."],
  ],
  mensaje: [
    [/^\s*HAZ\s+"mensaje\b/i, "Mira cómo FRASE construye :mensaje a partir de varias palabras."],
    [/^\s*HAZ\s+"completo\b/i, "Usa FRASE con :mensaje y una lista que contenga HASTA y PRONTO por separado. Escribe el resultado."],
  ],
  pilas: [
    [/^\s*HAZ\s+"pila\s+APILA\b/i, "Cada APILA deja la ficha nueva en la cima de la pila."],
    [/^\s*MIENTRAS\b/i, "Apila AMARILLA después de las otras fichas y antes del bucle que las saca."],
  ],
  recursion: [
    [/^\s*CUENTAATRAS\s+[^\s(]/i, "Revisa el número que recibe la primera llamada a CUENTAATRAS."],
    [/^\s*CUENTAATRAS\s+\(/i, "Empieza en 10 y resta 2 en la llamada recursiva. Conserva la condición que para al llegar a cero."],
  ],
  devuelve: [
    [/^\s*ESCRIBE\s+SUMAHASTA\b/i, "Busca la línea que imprime lo que devuelve SUMAHASTA."],
    [/^\s*ESCRIBE\s+DOBLE\b/i, "Dale a DOBLE el resultado de SUMAHASTA con argumento 4. Escribe el resultado de esa expresión."],
  ],
  circulo: [
    [/^\s*HAZ\s+"puntos\b/i, "Busca la variable que guarda cuántos puntos se lanzan."],
    [/^\s*REPITE\s+:puntos\b/i, "Cambia el valor inicial de :puntos a 3000. El bucle usará ese valor sin tocar el cálculo de las coordenadas."],
  ],
  rosa: [
    [/^\s*HAZ\s+"petalos\b/i, "Localiza el número de pétalos al comienzo del programa."],
    [/^\s*HAZ\s+"r\s+100\b/i, "Ajusta :petalos a 3. El coseno usa ese valor para dibujar la rosa."],
  ],
  baliza: [
    [/^\s*HAZ\s+"mapa\b/i, "Mira el mapa del lienzo. Un atajo puede quedar oculto entre las paredes."],
    [/^\s*SI\s+:tecla\s*=\s*"ABAJO\b/i, "Desde la salida, baja tres veces antes de ir a la derecha. Busca la entrada al pasillo inferior."],
  ],
  clics: [
    [/^\s*HAZ\s+"inicio\s+LEECLIC\b/i, "El primer clic fija el inicio antes de entrar en REPITE."],
    [/^\s*REPITE\b/i, "Pide siete clics dentro del bucle para sumar ocho en total. Conserva el último VE :inicio para cerrar la figura."],
  ],
  melodia: [
    [/^\s*HAZ\s+"melodia\b/i, "Localiza la lista que guarda las cinco notas."],
    [/^\s*REPITE\s+CUENTA\s+:melodia\b/i, "Añade dos notas al final de la lista, cada una con su número (por ejemplo, RE4). El bucle dibuja y toca una vez por cada nota."],
  ],
  piano: [
    [/\bSISINO\s+:tecla\s*=\s*"R\b/i, "Busca qué tecla empieza a grabar. También puedes usarla en el panel de grabación."],
    [/^\s*HAZ\s+"melodia\s+ANEXA\b/i, "Empieza a grabar con R, toca tres notas usando el teclado o el piano y vuelve a pulsar R para terminar."],
  ],
  fractales: [
    [/^\s*KOCH\s+[^\s(]/i, "Busca la llamada inicial a KOCH. El primer argumento elige el nivel."],
    [/^\s*SI\s+:nivel\s*=\s*0\b/i, "Sube el nivel inicial de 3 a 4. Cada nivel nuevo sustituye cada tramo por cuatro."],
  ],
  cubo3d: [
    [/^\s*HAZ\s+"alto\b/i, "La variable :alto fija la altura del cuadrado superior y de las aristas."],
    [/^\s*CUADRADOZ\s+:alto\b/i, "Haz que :alto valga dos veces :lado. Deja intacta la base para conservar el ancho."],
  ],
  rampa3d: [
    [/^\s*HAZ\s+"pendiente\b/i, "Busca la inclinación que comparten la subida y la bajada."],
    [/^\s*SUBENARIZ\s+:pendiente\b/i, "Usa 45 en el valor inicial de :pendiente. Así ambos tramos toman el mismo ángulo."],
  ],
  alabeo3d: [
    [/^\s*HAZ\s+"angulo\b/i, "Busca el ángulo que se aplica a la nariz de la tortuga."],
    [/^\s*SUBENARIZ\s+:angulo\b/i, "Cambia :angulo a 45. Conserva el alabeo de 90° para mantener el giro en el plano previsto."],
  ],
  cubocolor3d: [
    [/^\s*HAZ\s+"alto\b/i, "Localiza :alto. Los vértices superiores comparten ese valor de Z."],
    [/^\s*HAZ\s+"e\s+VERTICE\b/i, "Usa 160 como altura. Conserva :lado para el ancho y la profundidad."],
  ],
};

export function locateChallengeHints(lesson, lines) {
  if (!Object.hasOwn(hintsByLesson, lesson)) return [];
  return hintsByLesson[lesson].map(([anchor, text]) => {
    const match = lines.findIndex(line => anchor.test(line.split(";", 1)[0]));
    return { text, line: match < 0 ? null : match + 1 };
  });
}
