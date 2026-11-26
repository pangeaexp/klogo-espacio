// Units that group the lessons in the Ejemplo menu, in the order of
// lessons.js. Every lesson belongs to exactly one unit.
export const lessonUnits = [
  { id: "tortuga", name: "Tortuga y bucles",
    lessons: ["tortuga", "bucles", "poligonos", "variables", "argumentos", "desde", "aleatorio"] },
  { id: "color", name: "Color y trazo",
    lessons: ["colores", "rosetaColores", "grosores", "rotulos", "arcos", "relleno", "art"] },
  { id: "numeracion", name: "Números", lessons: ["paquetesDeDiez", "mismasCifras", "saltaEnLaRecta", "cuentaLasHuellas",
    "cartasDePuntos", "paquetesDeDos", "cuentaConLuces", "cerosYUnos"] },
  { id: "listas", name: "Palabras y listas",
    lessons: ["palabras", "frases", "listas", "extremos", "eligeFicha", "fichasRepetidas", "mensaje", "pilas"] },
  { id: "logica", name: "Procedimientos y lógica", lessons: ["recursion", "devuelve", "circulo", "rosa"] },
  { id: "interaccion", name: "Teclado, ratón y música", lessons: ["baliza", "clics", "melodia", "piano"] },
  { id: "avanzado", name: "Fractales y 3D", lessons: ["fractales", "cubo3d", "rampa3d", "alabeo3d", "cubocolor3d"] },
];

// The units that have some of these lessons, keeping the path's lesson order.
export function groupByUnit(keys) {
  return lessonUnits
    .map(unit => ({ ...unit, lessons: keys.filter(key => unit.lessons.includes(key)) }))
    .filter(unit => unit.lessons.length > 0);
}
