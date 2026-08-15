import { useState } from 'react';
import jugadores from './data/jugadores.json';

export default function App() {
  // --- CONFIGURACIÓN DEL JUEGO ---
  // Estos son los criterios de prueba (equipos/nacionalidades/competencias)
  const filasCriterios = ["FC Barcelona", "Argentina", "Champions League"];
  const columnasCriterios = ["Real Madrid", "Brasil", "Paris Saint-Germain"];

  // --- ESTADO DEL JUEGO ---
  // Tablero 3x3 que guarda el nombre del jugador en cada celda { f, c }
  const [tablero, setTablero] = useState(
    Array(3).fill(null).map(() => Array(3).fill(null))
  );

  // Controla qué celda se está editando y qué está tipeando el usuario
  const [celdaActiva, setCeldaActiva] = useState(null); // { f: index, c: index }
  const [busqueda, setBusqueda] = useState('');

  // --- LÓGICA DEL JUEGO ---

  const seleccionarCelda = (fIndex, cIndex) => {
    if (!tablero[fIndex][cIndex]) {
      setCeldaActiva({ f: fIndex, c: cIndex });
      setBusqueda('');
    }
  };

  const validarJugador = (jugador) => {
    const { f, c } = celdaActiva;
    const filtroFila = filasCriterios[f];
    const filtroCol = columnasCriterios[c];

    // Validación flexible: busca en clubes, nacionalidad o títulos
    const cumpleFila = 
      jugador.clubes?.includes(filtroFila) || 
      jugador.nacionalidad === filtroFila || 
      jugador.titulos?.includes(filtroFila);

    const cumpleCol = 
      jugador.clubes?.includes(filtroCol) || 
      jugador.nacionalidad === filtroCol || 
      jugador.titulos?.includes(filtroCol);

    if (cumpleFila && cumpleCol) {
      const nuevoTablero = tablero.map(row => [...row]);
      nuevoTablero[f][c] = jugador.nombre;
      setTablero(nuevoTablero);
      setCeldaActiva(null);
    } else {
      alert(`❌ ${jugador.nombre} no cumple ambas condiciones: ${filtroFila} + ${filtroCol}.`);
    }
  };

  // Filtrado de la lista según la búsqueda del usuario (solo si el JSON tiene data)
  const listaFiltrada = busqueda.trim() === '' ? [] : jugadores.filter(j =>
    j.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8 text-emerald-400">Footy Tic-Tac-Toe</h1>

      {/* --- Grilla Principal Remodelada --- */}
      {/* Usamos grid-cols-4 para tener una columna extra para los encabezados laterales */}
      <div className="grid grid-cols-4 gap-2 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
        
        {/* Esquina superior izquierda vacía */}
        <div></div>

        {/* Encabezados de Columnas (Superiores) */}
        {columnasCriterios.map((col, i) => (
          <div key={i} className="flex items-center justify-center font-extrabold text-center text-sm text-slate-300 p-3 h-16 w-28 uppercase tracking-wider">
            {col}
          </div>
        ))}

        {/* Filas con su encabezado e intersecciones */}
        {filasCriterios.map((fila, fIndex) => (
          <div key={fIndex} className="contents">
            {/* Encabezado de Fila (Lateral) */}
            <div className="flex items-center justify-center font-extrabold text-center text-sm text-slate-300 p-3 w-28 uppercase tracking-wider">
              {fila}
            </div>

            {/* 3 Celdas por fila */}
            {columnasCriterios.map((_, cIndex) => (
              <button
                key={cIndex}
                onClick={() => seleccionarCelda(fIndex, cIndex)}
                className="w-28 h-28 bg-slate-700 hover:bg-slate-600 rounded-lg border border-slate-600 flex items-center justify-center text-center p-3 font-semibold text-xs transition-all duration-150 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {tablero[fIndex][cIndex] ? (
                  <span className="text-emerald-300 text-lg">{tablero[fIndex][cIndex]}</span>
                ) : (
                  <span className="text-slate-500 text-3xl font-light">+</span>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* --- Modal / Popup de Búsqueda de Jugador --- */}
      {/* Solo aparece si hay una celda activa. Se superpone sobre la grilla */}
      {celdaActiva && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm z-50">
          <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-3">Elegí un jugador</h2>
            <p className="text-sm text-slate-400 mb-6 pb-2 border-b border-slate-700">
              Debe haber jugado en: <br />
              <span className="text-emerald-400 font-semibold">{filasCriterios[celdaActiva.f]}</span> + <span className="text-emerald-400 font-semibold">{columnasCriterios[celdaActiva.c]}</span>
            </p>

            <input
              type="text"
              placeholder="Ej: Messi, Ronaldo, Ronaldinho..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white mb-5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              autoFocus
            />

            {/* Lista de resultados filtrados */}
            <div className="max-h-56 overflow-y-auto flex flex-col gap-1 mb-6 pr-2">
              {listaFiltrada.map((jugador) => (
                <button
                  key={jugador.id}
                  onClick={() => validarJugador(jugador)}
                  className="text-left p-3 hover:bg-slate-700 rounded-lg text-sm transition-all duration-100 flex items-center gap-3"
                >
                  <span className="text-slate-500 font-mono text-xs">#{jugador.id}</span>
                  {jugador.nombre}
                </button>
              ))}
              {busqueda && listaFiltrada.length === 0 && (
                <p className="text-slate-500 text-sm p-3 text-center">No se encontraron jugadores en tu JSON.</p>
              )}
            </div>

            <button
              onClick={() => setCeldaActiva(null)}
              className="w-full bg-slate-700 hover:bg-slate-600 p-3 rounded-lg text-sm transition font-semibold"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}