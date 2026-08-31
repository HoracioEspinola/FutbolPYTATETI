import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import datosRaw from './data/jugadores.json';

const TIEMPO_POR_TURNO = 60;
const FILAS = ["Arsenal", "Spain", "Blackburn Rovers"];
const COLUMNAS = ["UE Cornellà", "England", "Arsenal"];

function verificarGanador(tablero) {
  const lineas = [[[0,0],[0,1],[0,2]], [[1,0],[1,1],[1,2]], [[2,0],[2,1],[2,2]], [[0,0],[1,0],[2,0]], [[0,1],[1,1],[2,1]], [[0,2],[1,2],[2,2]], [[0,0],[1,1],[2,2]], [[0,2],[1,1],[2,0]]];
  for (const linea of lineas) {
    const [a, b, c] = linea;
    const va = tablero[a[0]][a[1]];
    const vb = tablero[b[0]][b[1]];
    const vc = tablero[c[0]][c[1]];
    if (va && va === vb && vb === vc) return va;
  }
  if (tablero.every(fila => fila.every(c => c !== null))) return 'empate';
  return null;
}

export default function App() {
  const [fase, setFase] = useState('inicio');
  const [nombreJ1, setNombreJ1] = useState('');
  const [nombreJ2, setNombreJ2] = useState('');
  const [tablero, setTablero] = useState(Array(3).fill(null).map(() => Array(3).fill(null)));
  const [jugadorActual, setJugadorActual] = useState(1);
  const [tiempo, setTiempo] = useState(TIEMPO_POR_TURNO);
  const [cronometroActivo, setCronometroActivo] = useState(true);
  const [celdaActiva, setCeldaActiva] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [marcador, setMarcador] = useState({ 1: 0, 2: 0 });
  const [resultado, setResultado] = useState(null);

  const intervaloRef = useRef(null);
  const turnoInicioRef = useRef(Date.now());

  const listaJugadores = useMemo(() => {
    if (!datosRaw || !datosRaw.teams) return [];
    return datosRaw.teams.flatMap(equipo =>
      (equipo.players || []).map(p => ({
        id: p.name, nombre: p.name, nacionalidades: p.nationality || [],
        clubes: [equipo.team, ...(p.career || []).map(c => c.club)].filter(Boolean)
      }))
    );
  }, []);

  const listaFiltrada = useMemo(() => {
    if (busqueda.trim() === '') return [];
    return listaJugadores.filter(j => j.nombre.toLowerCase().includes(busqueda.toLowerCase()));
  }, [listaJugadores, busqueda]);

  const reiniciarTurno = useCallback((nuevoJugador) => {
    clearInterval(intervaloRef.current);
    setCronometroActivo(false); setTiempo(TIEMPO_POR_TURNO); setJugadorActual(nuevoJugador);
    setCeldaActiva(null); setBusqueda(''); turnoInicioRef.current = Date.now();
    setTimeout(() => setCronometroActivo(true), 50);
  }, []);

  useEffect(() => {
    if (fase !== 'juego' || !cronometroActivo) return;
    intervaloRef.current = setInterval(() => {
      const restante = Math.max(0, TIEMPO_POR_TURNO - Math.floor((Date.now() - turnoInicioRef.current) / 1000));
      setTiempo(restante);
      if (restante <= 0) reiniciarTurno(jugadorActual === 1 ? 2 : 1);
    }, 250);
    return () => clearInterval(intervaloRef.current);
  }, [fase, cronometroActivo, jugadorActual, reiniciarTurno]);

  useEffect(() => {
    if (fase !== 'juego') return;
    const ganador = verificarGanador(tablero);
    if (ganador) {
      clearInterval(intervaloRef.current); setCronometroActivo(false);
      setResultado(ganador); setFase('resultado');
    }
  }, [tablero, fase]);

  const iniciarJuego = () => { if (nombreJ1.trim() && nombreJ2.trim()) { setFase('juego'); reiniciarTurno(1); } };

  const validarJugador = (jugador) => {
    const { f, c } = celdaActiva;
    const critFila = FILAS[f].toLowerCase(); const critCol = COLUMNAS[c].toLowerCase();
    
    const cumpleFila = jugador.nacionalidades.some(n => n.toLowerCase() === critFila) || jugador.clubes.some(c => c.toLowerCase().includes(critFila));
    const cumpleCol = jugador.nacionalidades.some(n => n.toLowerCase() === critCol) || jugador.clubes.some(c => c.toLowerCase().includes(critCol));

    if (cumpleFila && cumpleCol) {
      const nuevoTablero = tablero.map(row => [...row]);
      nuevoTablero[f][c] = { nombre: jugador.nombre, jugador: jugadorActual };
      setTablero(nuevoTablero);
      setMarcador(prev => ({ ...prev, [jugadorActual]: prev[jugadorActual] + 1 }));
      reiniciarTurno(jugadorActual === 1 ? 2 : 1);
    } else {
      alert('El jugador no cumple ambas condiciones.');
    }
  };

  const nombreActual = jugadorActual === 1 ? nombreJ1 : nombreJ2;

  // ESTILOS ESTÉTICOS (Basados en tu imagen de referencia)
  const inputContainerStyle = "flex items-center gap-4 mb-8 border-b border-gray-400 pb-3";
  const inputStyle = "flex-1 bg-transparent text-gray-200 placeholder-gray-500 focus:outline-none font-light text-lg";
  const btnStyle = "w-full border border-gray-400 text-gray-200 py-3 uppercase tracking-widest text-sm font-semibold hover:bg-gray-200 hover:text-black transition-colors duration-300";

  if (fase === 'inicio') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1c1c1c] to-[#121212] flex flex-col items-center justify-center font-sans">
        <div className="w-full max-w-md p-8">
          <h1 className="text-3xl font-light text-gray-300 tracking-widest text-center mb-16">
            FOOTY TIC-TAC-TOE
          </h1>

          <div className={inputContainerStyle}>
            <span className="text-gray-400 text-xl">✉</span>
            <input
              type="text"
              placeholder="Jugador 1"
              value={nombreJ1}
              onChange={(e) => setNombreJ1(e.target.value)}
              className={inputStyle}
              autoFocus
            />
          </div>

          <div className={inputContainerStyle}>
            <span className="text-gray-400 text-xl">🔒</span>
            <input
              type="text"
              placeholder="Jugador 2"
              value={nombreJ2}
              onChange={(e) => setNombreJ2(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && iniciarJuego()}
              className={inputStyle}
            />
          </div>

          <div className="flex justify-between items-center text-xs text-gray-400 mb-10 font-light px-1">
             <span>✓ Modo Clásico</span>
             <span className="italic">¿Reglas?</span>
          </div>

          <button onClick={iniciarJuego} disabled={!nombreJ1.trim() || !nombreJ2.trim()} className={`${btnStyle} disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-200`}>
            JUGAR
          </button>
        </div>
      </div>
    );
  }

  // --- LAS OTRAS PANTALLAS TAMBIÉN ADAPTADAS AL DISEÑO ---
  if (fase === 'resultado') {
    const esEmpate = resultado === 'empate';
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1c1c1c] to-[#121212] flex flex-col items-center justify-center font-sans text-gray-200">
        <div className="w-full max-w-md p-8 text-center">
          <h2 className="text-3xl font-light tracking-widest mb-12">
            {esEmpate ? 'EMPATE' : `${resultado === 1 ? nombreJ1 : nombreJ2} GANA`}
          </h2>
          <div className="flex justify-center gap-12 mb-12 font-light">
            <div className="text-center"><p className="text-gray-400 mb-2">{nombreJ1}</p><p className="text-4xl">{marcador[1]}</p></div>
            <div className="text-center"><p className="text-gray-400 mb-2">{nombreJ2}</p><p className="text-4xl">{marcador[2]}</p></div>
          </div>
          <button onClick={() => { setTablero(Array(3).fill(null).map(() => Array(3).fill(null))); setFase('juego'); reiniciarTurno(1); }} className={btnStyle}>REVANCHA</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1c1c1c] to-[#121212] flex flex-col items-center justify-center font-sans text-gray-200 p-4">
      <h1 className="text-2xl font-light text-gray-300 tracking-widest mb-8">FOOTY TIC-TAC-TOE</h1>

      <div className="flex items-center gap-12 mb-8 font-light tracking-wider">
        <div className={`text-center ${jugadorActual === 1 ? 'text-white' : 'text-gray-600'}`}>{nombreJ1} <span className="block text-2xl">{marcador[1]}</span></div>
        <div className="text-amber-500 font-mono text-2xl">00:{String(tiempo).padStart(2, '0')}</div>
        <div className={`text-center ${jugadorActual === 2 ? 'text-white' : 'text-gray-600'}`}>{nombreJ2} <span className="block text-2xl">{marcador[2]}</span></div>
      </div>

      <div className="p-1 border border-gray-700 w-full max-w-2xl mb-8">
        <div className="grid grid-cols-4 gap-1">
          <div className="h-20"></div>
          {COLUMNAS.map((col, i) => <div key={i} className="flex items-center justify-center text-center text-xs tracking-wider text-gray-400 uppercase">{col}</div>)}
          {FILAS.map((fila, fIndex) => (
            <React.Fragment key={fIndex}>
              <div className="flex items-center justify-center text-center text-xs tracking-wider text-gray-400 uppercase">{fila}</div>
              {COLUMNAS.map((_, cIndex) => {
                const celda = tablero[fIndex][cIndex];
                return (
                  <button key={cIndex} onClick={() => { if (!celda && cronometroActivo) setCeldaActiva({f: fIndex, c: cIndex}) }} className="h-24 border border-gray-700 hover:bg-gray-800 transition flex flex-col items-center justify-center">
                    {celda ? <span className="text-4xl font-light">{celda.jugador === 1 ? 'X' : 'O'}</span> : null}
                    {celda && <span className="text-[9px] uppercase text-gray-500 mt-2">{celda.nombre}</span>}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {celdaActiva && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="border border-gray-600 p-8 w-full max-w-md bg-[#121212]">
            <h2 className="text-lg font-light tracking-widest text-gray-300 mb-6 uppercase">Turno de {nombreActual}</h2>
            <div className={inputContainerStyle}>
               <span className="text-gray-400">🔍</span>
               <input type="text" placeholder="Buscar jugador..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className={inputStyle} autoFocus />
            </div>
            <div className="max-h-40 overflow-y-auto flex flex-col mb-6">
              {listaFiltrada.slice(0, 15).map((j, i) => (
                <button key={i} onClick={() => validarJugador(j)} className="text-left p-3 border-b border-gray-800 hover:bg-gray-800 text-sm text-gray-300 transition">{j.nombre}</button>
              ))}
            </div>
            <button onClick={() => setCeldaActiva(null)} className={btnStyle}>CANCELAR</button>
          </div>
        </div>
      )}
    </div>
  );
}