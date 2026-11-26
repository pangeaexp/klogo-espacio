export const initialMandelbrotView = { izquierda: -2.25, arriba: 1.21875, anchoplano: 3.25, altoplano: 2.4375 };

// Rewrites the four view variables of the Mandelbrot program.
export function withMandelbrotView(source, view) {
  return source.replace(/^HAZ "(izquierda|arriba|anchoplano|altoplano) .+$/gm,
    (_, variable) => `HAZ "${variable} ${view[variable].toFixed(15)}`);
}

// Examples outside the lessons, listed under «Otros ejemplos».
export const examples = {
  roseta: {
    name: "Roseta",
    source: `PARA ROMBO :lado
  REPITE 2 [
    AV :lado GD 60
    AV :lado GD 120
  ]
FIN

REPITE 12 [
  ROMBO 90
  GD 30
]`,
  },
  cuadrado: {
    name: "Cuadrado",
    source: `PARA CUADRADO :lado
  REPITE 4 [
    AVANZA :lado
    GIRADERECHA 90
  ]
FIN

CUADRADO 120`,
  },
  espiral: {
    name: "Espiral",
    source: `HAZ "paso 4
REPITE 36 [
  AV :paso
  GD 91
  HAZ "paso :paso + 3
]`,
  },
};

// Gallery cards of «Ejemplos»: what each one is about and, for those that
// need input or do not draw with the turtle, the symbol in place of a thumbnail.
export const exampleCards = {
  roseta: { description: "Doce rombos girados forman una flor. Cambia el lado del rombo o el giro." },
  cuadrado: { description: "Un procedimiento con un argumento, el lado. Prueba otros tamaños." },
  espiral: { description: "Cada tramo es un poco más largo. Cambia el giro de 91 y mira qué pasa." },
  wordle: { symbol: "Aa", description: "Adivina una palabra de cuatro letras en seis intentos." },
  hanoi: { symbol: "≡", description: "Mueve los tres discos de A a C, o escribe AUTO para que se resuelva." },
  orbital: { symbol: "✦", description: "Defiende la estación de los marcianitos durante tres oleadas." },
  mandelbrot: { symbol: "◉", description: "Un fractal píxel a píxel. Marca una zona del dibujo para acercarte." },
  eliza: { symbol: "¿?", description: "Conversa con una adaptación de ELIZA, el programa de 1966." },
};
