import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import datosRaw from './data/jugadores.json';

const TIEMPO_POR_TURNO = 60;

const FILAS = ["Arsenal", "Spain", "Blackburn Rovers"];
const COLUMNAS = ["UE Cornellà", "England", "Arsenal"];

function verificarGanador(tablero) {
  const lineas = [
    [[0,0],[0,1],[0,2]],
    [[1,0],[1,1],[1,2]],
    [[2,0],[2,1],[2,2]],
    [[0,0],[1,0],[2,0]],
    [[0,1],[1,1],[2,1]],
    [[0,2],[1,2],[2,2]],
    [[0,0],[1,1],[2,2]],
    [[0,2],[1,1],[2,0]],
  ];

  for (const linea of lineas) {
    const [a, b, c] = linea;
    const va = tablero[a[0]][a[1]];
    const vb = tablero[b[0]][b[1]];
    const vc = tablero[c[0]][c[1]];
    if (va && va === vb && vb === vc) {
      return va;
    }
  }

  const lleno = tablero.every(fila => fila.every(c => c !== null));
  if (lleno) return 'empate';

  return null;
}

export default function App() {
  const [fase, setFase] = useState('inicio');

  const [nombreJ1, setNombreJ1] = useState('');
  const [nombreJ2, setNombreJ2] = useState('');

  const [tablero, setTablero] = useState(
    Array(3).fill(null).map(() => Array(3).fill(null))
  );
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
        id: p.name,
        nombre: p.name,
        nacionalidades: p.nationality || [],
        clubes: [
          equipo.team,
          ...(p.career || []).map(c => c.club)
        ].filter(Boolean)
      }))
    );
  }, []);

  const listaJugadoresLower = useMemo(() => {
    return listaJugadores.map(j => ({
      ...j,
      nombreLower: j.nombre.toLowerCase()
    }));
  }, [listaJugadores]);

  const listaFiltrada = useMemo(() => {
    if (busqueda.trim() === '') return [];
    const termino = busqueda.toLowerCase();
    return listaJugadoresLower.filter(j => j.nombreLower.includes(termino));
  }, [listaJugadoresLower, busqueda]);

  const reiniciarTurno = useCallback((nuevoJugador) => {
    clearInterval(intervaloRef.current);
    setCronometroActivo(false);
    setTiempo(TIEMPO_POR_TURNO);
    setJugadorActual(nuevoJugador);
    setCeldaActiva(null);
    setBusqueda('');
    turnoInicioRef.current = Date.now();
    setTimeout(() => setCronometroActivo(true), 50);
  }, []);

  useEffect(() => {
    if (fase !== 'juego' || !cronometroActivo) return;

    intervaloRef.current = setInterval(() => {
      const elapsed = (Date.now() - turnoInicioRef.current) / 1000;
      const restante = Math.max(0, TIEMPO_POR_TURNO - Math.floor(elapsed));
      setTiempo(restante);

      if (restante <= 0) {
        clearInterval(intervaloRef.current);
        setCronometroActivo(false);
        const siguiente = jugadorActual === 1 ? 2 : 1;
        reiniciarTurno(siguiente);
      }
    }, 250);

    return () => clearInterval(intervaloRef.current);
  }, [fase, cronometroActivo, jugadorActual, reiniciarTurno]);

  useEffect(() => {
    if (fase !== 'juego') return;
    const ganador = verificarGanador(tablero);
    if (ganador) {
      clearInterval(intervaloRef.current);
      setCronometroActivo(false);
      setResultado(ganador);
      setFase('resultado');
    }
  }, [tablero, fase]);

  const iniciarJuego = () => {
    if (!nombreJ1.trim() || !nombreJ2.trim()) return;
    setFase('juego');
    reiniciarTurno(1);
  };

  const seleccionarCelda = (fIndex, cIndex) => {
    if (!tablero[fIndex][cIndex] && cronometroActivo) {
      setCeldaActiva({ f: fIndex, c: cIndex });
      setBusqueda('');
    }
  };

  const cumpleCriterio = (jugador, criterio) => {
    const critLower = criterio.toLowerCase();
    const cumpleNac = jugador.nacionalidades.some(n => n.toLowerCase() === critLower);
    const cumpleClub = jugador.clubes.some(c => c.toLowerCase().includes(critLower));
    return cumpleNac || cumpleClub;
  };

  const validarJugador = (jugador) => {
    const { f, c } = celdaActiva;
    const filtroFila = FILAS[f];
    const filtroCol = COLUMNAS[c];

    const cumpleFila = cumpleCriterio(jugador, filtroFila);
    const cumpleCol = cumpleCriterio(jugador, filtroCol);

    if (cumpleFila && cumpleCol) {
      const nuevoTablero = tablero.map(row => [...row]);
      nuevoTablero[f][c] = { nombre: jugador.nombre, jugador: jugadorActual };
      setTablero(nuevoTablero);
      setMarcador(prev => ({ ...prev, [jugadorActual]: prev[jugadorActual] + 1 }));
      setCeldaActiva(null);
      setBusqueda('');
      const siguiente = jugadorActual === 1 ? 2 : 1;
      reiniciarTurno(siguiente);
    } else {
      alert(`${jugador.nombre} no cumple ambas condiciones: ${filtroFila} + ${filtroCol}`);
    }
  };

  const skipTurno = () => {
    const siguiente = jugadorActual === 1 ? 2 : 1;
    reiniciarTurno(siguiente);
  };

  const nombreActual = jugadorActual === 1 ? nombreJ1 : nombreJ2;


  const reiniciarJuego = () => {
    setTablero(Array(3).fill(null).map(() => Array(3).fill(null)));
    setMarcador({ 1: 0, 2: 0 });
    setResultado(null);
    setFase('juego');
    reiniciarTurno(1);
  };

  if (fase === 'inicio') {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-black mb-2 text-emerald-600 uppercase tracking-wider">
          Footy Tic-Tac-Toe
        </h1>
        <p className="text-slate-500 text-sm mb-8">Dos jugadores se enfrentan</p>

        <div className="bg-slate-100 p-8 rounded-2xl border border-slate-300 w-full max-w-sm shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-black text-sm text-white">1</div>
            <input
              type="text"
              placeholder="Nombre Jugador 1"
              value={nombreJ1}
              onChange={(e) => setNombreJ1(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && nombreJ2 && document.getElementById('j2input').focus()}
              className="flex-1 p-3 rounded-lg bg-white border border-slate-300 text-black placeholder-slate-400 text-sm focus:outline-none focus:border-red-500"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-black text-sm text-white">2</div>
            <input
              id="j2input"
              type="text"
              placeholder="Nombre Jugador 2"
              value={nombreJ2}
              onChange={(e) => setNombreJ2(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && iniciarJuego()}
              className="flex-1 p-3 rounded-lg bg-white border border-slate-300 text-black placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={iniciarJuego}
            disabled={!nombreJ1.trim() || !nombreJ2.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 disabled:text-slate-500 p-3 rounded-lg text-sm font-bold text-white transition"
          >
            ¡JUGAR!
          </button>
        </div>
      </div>
    );
  }

  if (fase === 'resultado') {
    const esEmpate = resultado === 'empate';
    const ganador = esEmpate ? null : resultado;
    const nombreGanador = ganador === 1 ? nombreJ1 : nombreJ2;
    const colorGanador = ganador === 1 ? 'text-red-600' : 'text-blue-600';

    return (
      <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-4">
        <div className="bg-slate-100 p-8 rounded-2xl border-2 border-emerald-600 w-full max-w-sm shadow-2xl text-center">
          <span className="text-5xl mb-4 block">{esEmpate ? '🤝' : '🏆'}</span>
          <h2 className="text-2xl font-black mb-2 uppercase">
            {esEmpate ? (
              <span className="text-amber-600">¡Empate!</span>
            ) : (
              <span className={colorGanador}>¡{nombreGanador} gana!</span>
            )}
          </h2>

          <div className="flex justify-center gap-8 mb-6 mt-4">
            <div className="text-center">
              <div className="text-red-600 font-black text-lg">{nombreJ1}</div>
              <div className="text-3xl font-black text-red-500">{marcador[1]}</div>
            </div>
            <div className="text-slate-400 text-2xl font-bold self-center">-</div>
            <div className="text-center">
              <div className="text-blue-600 font-black text-lg">{nombreJ2}</div>
              <div className="text-3xl font-black text-blue-500">{marcador[2]}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={reiniciarJuego}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 p-3 rounded-lg text-sm font-bold text-white transition"
            >
              Revancha
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-slate-300 hover:bg-slate-400 p-3 rounded-lg text-sm font-bold text-slate-700 transition"
            >
              Nuevo juego
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-4">

      <h1 className="text-2xl font-black mb-3 text-emerald-600 uppercase tracking-wider">
        Footy Tic-Tac-Toe
      </h1>

      {/* Marcador y Jugadores */}
      <div className="flex items-center gap-6 mb-3">
        <div className={`text-center transition-all duration-300 ${jugadorActual === 1 ? 'scale-110' : 'opacity-50'}`}>
          <div className="text-xs font-bold text-slate-500 mb-0.5">JUGADOR 1</div>
          <div className={`font-black text-lg ${jugadorActual === 1 ? 'text-red-600 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]' : 'text-red-400/60'}`}>
            {nombreJ1}
          </div>
          <div className="text-2xl font-black text-red-500">{marcador[1]}</div>
        </div>

        <div className="text-slate-400 text-xl font-bold">VS</div>

        <div className={`text-center transition-all duration-300 ${jugadorActual === 2 ? 'scale-110' : 'opacity-50'}`}>
          <div className="text-xs font-bold text-slate-500 mb-0.5">JUGADOR 2</div>
          <div className={`font-black text-lg ${jugadorActual === 2 ? 'text-blue-600 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]' : 'text-blue-400/60'}`}>
            {nombreJ2}
          </div>
          <div className="text-2xl font-black text-blue-500">{marcador[2]}</div>
        </div>
      </div>

      {/* Turno actual */}
      <div className={`mb-3 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${jugadorActual === 1 ? 'bg-red-100 text-red-600 border border-red-400' : 'bg-blue-100 text-blue-600 border border-blue-400'}`}>
        Turno de {nombreActual}
      </div>

      {/* Cronómetro */}
      <div className={`mb-4 flex items-center gap-3 px-5 py-2.5 rounded-xl border-2 font-black text-2xl tracking-wider ${
        tiempo <= 10
          ? 'bg-amber-100 border-amber-500 text-amber-600 animate-pulse'
          : jugadorActual === 1
            ? 'bg-red-50 border-red-400 text-red-600'
            : 'bg-blue-50 border-blue-400 text-blue-600'
      }`}>
        <span className="text-lg">⏱</span>
        <span>{String(Math.floor(tiempo / 60)).padStart(1, '0')}:{String(tiempo % 60).padStart(2, '0')}</span>
      </div>

      {/* Grilla 4x4 */}
      <div className="grid grid-cols-4 gap-1.5 bg-emerald-800 p-2 rounded-xl border-2 border-emerald-700 shadow-2xl w-full max-w-lg">

        <div className="bg-[#2a2d7c] rounded-lg flex items-center justify-center p-2 text-center text-xs font-black text-white uppercase h-24">
          ⚽ FOOTY
        </div>

        {COLUMNAS.map((col, i) => (
          <div key={i} className="bg-emerald-700 rounded-lg flex items-center justify-center p-2 text-center text-[11px] font-extrabold uppercase text-emerald-50 h-24 leading-tight">
            {col}
          </div>
        ))}

        {FILAS.map((fila, fIndex) => (
          <div key={fIndex} className="contents">
            <div className="bg-emerald-700 rounded-lg flex items-center justify-center p-2 text-center text-[11px] font-extrabold uppercase text-emerald-50 h-24 leading-tight">
              {fila}
            </div>

            {COLUMNAS.map((_, cIndex) => {
              const celda = tablero[fIndex][cIndex];
              const esJugador1 = celda && celda.jugador === 1;

              return (
                <button
                  key={cIndex}
                  onClick={() => seleccionarCelda(fIndex, cIndex)}
                  disabled={!!celda || !cronometroActivo}
                  className={`rounded-lg h-24 flex flex-col items-center justify-center p-1 border transition-all ${
                    celda
                      ? esJugador1
                        ? 'bg-red-100 border-red-400'
                        : 'bg-blue-100 border-blue-400'
                      : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 border-emerald-400/30'
                  }`}
                >
                  {celda ? (
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                      <span className={`absolute text-6xl font-black opacity-30 ${
                        esJugador1 ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {esJugador1 ? 'X' : 'O'}
                      </span>
                      <span className={`relative font-black text-[11px] uppercase text-center px-1 z-10 ${
                        esJugador1 ? 'text-red-800' : 'text-blue-800'
                      }`}>
                        {celda.nombre}
                      </span>
                    </div>
                  ) : (
                    <>
                      <span className="text-emerald-100 text-2xl font-bold mb-0.5">+</span>
                      <span className="text-[9px] text-emerald-200 font-bold uppercase">ELEGIR</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Modal de Búsqueda */}
      {celdaActiva && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl border border-slate-300 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-3 h-3 rounded-full ${jugadorActual === 1 ? 'bg-red-500' : 'bg-blue-500'}`}></span>
              <h2 className="text-lg font-bold text-black">{nombreActual}: elegí un jugador</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Condición: <span className="text-emerald-600 font-semibold">{FILAS[celdaActiva.f]}</span> + <span className="text-emerald-600 font-semibold">{COLUMNAS[celdaActiva.c]}</span>
            </p>

            <input
              type="text"
              placeholder="Escribí un nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-black placeholder-slate-400 mb-3 text-sm focus:outline-none focus:border-emerald-500"
              autoFocus
            />

            <div className="max-h-48 overflow-y-auto flex flex-col gap-1 mb-4 pr-1">
              {listaFiltrada.map((jugador, i) => (
                <button
                  key={i}
                  onClick={() => validarJugador(jugador)}
                  className="text-left p-2 hover:bg-slate-100 rounded text-sm text-slate-700 transition"
                >
                  {jugador.nombre}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setCeldaActiva(null); setBusqueda(''); }}
                className="flex-1 bg-slate-200 hover:bg-slate-300 p-2 rounded-lg text-xs font-bold text-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={skipTurno}
                className="flex-1 bg-amber-500 hover:bg-amber-400 p-2 rounded-lg text-xs font-bold text-white transition"
              >
                Skip Turno
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
