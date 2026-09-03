import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import datosRaw from './data/jugadores.json';
import requisitosRaw from './data/requisitos.json';

// Importamos los nuevos módulos limpios
import { PantallaInicio } from './components/PantallaInicio';
import { Marcador } from './components/Marcador';
import { ModalBusqueda } from './components/ModalBusqueda';

const TIEMPO_POR_TURNO = 60;

function cumpleRequisito(jugador, req) {
  const v = req.valor.toLowerCase();
  if (req.tipo === 'nacionalidad') return (jugador.nacionalidades || []).some(n => n.toLowerCase() === v);
  if (req.tipo === 'club') return (jugador.clubes || []).some(c => c.toLowerCase().includes(v));
  return false;
}

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
  const [mensajeError, setMensajeError] = useState('');
  const [marcador, setMarcador] = useState({ 1: 0, 2: 0 });
  const [resultado, setResultado] = useState(null);
  const [filas, setFilas] = useState([]);
  const [columnas, setColumnas] = useState([]);

  const intervaloRef = useRef(null);
  const turnoInicioRef = useRef(Date.now());

  const listaJugadores = useMemo(() => {
    if (!datosRaw || !datosRaw.players) return [];
    return datosRaw.players.map(p => ({
      id: p.id, nombre: p.name, nacionalidades: p.nationality || [],
      clubes: p.clubs || []
    }));
  }, []);

  const matrizCompat = useMemo(() => {
    const pool = requisitosRaw?.requisitos || [];
    const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const viable = pool.filter(r => listaJugadores.some(j => cumpleRequisito(j, r)));
    if (viable.length < 6) return { pool, shuffle, viable: [] };
    const candSets = new Map();
    for (const r of viable) {
      const s = new Set();
      for (let i = 0; i < listaJugadores.length; i++) if (cumpleRequisito(listaJugadores[i], r)) s.add(i);
      candSets.set(r.id, s);
    }
    const comparte = (a, b) => {
      if (a.tipo === 'nacionalidad' && b.tipo === 'nacionalidad') return false;
      const A = candSets.get(a.id), B = candSets.get(b.id);
      const [small, big] = A.size <= B.size ? [A, B] : [B, A];
      for (const i of small) if (big.has(i)) return true;
      return false;
    };
    const compatibles = new Map();
    const grados = [];
    for (const r of viable) {
      const set = new Set();
      for (const o of viable) if (o !== r && comparte(r, o)) set.add(o.id);
      compatibles.set(r.id, set);
      grados.push(set.size);
    }
    return { pool, shuffle, viable, compatibles, grados, totalGrado: grados.reduce((a, b) => a + b, 0) };
  }, [listaJugadores]);

  const seleccionarTablero = useCallback(() => {
    const { pool, shuffle, viable, compatibles, grados, totalGrado } = matrizCompat;
    if (viable.length < 6) return;
    const elegirPesado = (k) => {
      const idx = [];
      const usados = new Set();
      while (idx.length < k) {
        let t = Math.random() * totalGrado;
        let i = 0;
        for (i = 0; i < viable.length; i++) { t -= grados[i]; if (t <= 0) break; }
        if (!usados.has(i)) { usados.add(i); idx.push(i); }
      }
      return idx;
    };
    for (let intento = 0; intento < 300; intento++) {
      const fs = elegirPesado(3).map(i => viable[i]);
      const cols = viable.filter(c => !fs.includes(c) && fs.every(f => compatibles.get(f.id).has(c.id)));
      if (cols.length >= 3) { setFilas(fs); setColumnas(shuffle(cols).slice(0, 3)); return; }
    }
    setFilas(shuffle(pool).slice(0, 3));
    setColumnas(shuffle(pool).slice(0, 3));
  }, [matrizCompat]);

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

  const iniciarJuego = () => { if (nombreJ1.trim() && nombreJ2.trim()) { setTablero(Array(3).fill(null).map(() => Array(3).fill(null))); seleccionarTablero(); setFase('juego'); reiniciarTurno(1); } };

  const validarJugador = (jugador) => {
    const { f, c } = celdaActiva;
    const reqFila = filas[f]; const reqCol = columnas[c];
    
    if (cumpleRequisito(jugador, reqFila) && cumpleRequisito(jugador, reqCol)) {
      const nuevoTablero = tablero.map(row => [...row]);
      nuevoTablero[f][c] = { nombre: jugador.nombre, jugador: jugadorActual };
      setTablero(nuevoTablero);
      setMarcador(prev => ({ ...prev, [jugadorActual]: prev[jugadorActual] + 1 }));
      setMensajeError(''); // Limpiamos el error si acierta
      reiniciarTurno(jugadorActual === 1 ? 2 : 1);
    } else {
      setMensajeError('El jugador no cumple ambas condiciones');
      setCeldaActiva(null); // Cerramos el buscador para que vea el mensaje
      
      // Borramos el mensaje de error automáticamente después de 3 segundos
      setTimeout(() => setMensajeError(''), 3000);
    }
  };

  const nombreActual = jugadorActual === 1 ? nombreJ1 : nombreJ2;

  // Fase 1: Pantalla de inicio modularizada
  if (fase === 'inicio') {
    return (
      <PantallaInicio 
        nombreJ1={nombreJ1} setNombreJ1={setNombreJ1}
        nombreJ2={nombreJ2} setNombreJ2={setNombreJ2}
        iniciarJuego={iniciarJuego}
      />
    );
  }

  // Fase 2: Pantalla de resultado
  if (fase === 'resultado') {
    const esEmpate = resultado === 'empate';
    return (
      <div className="layout-principal">
        <div className="w-full max-w-md p-8 text-center">
          <h2 className="text-4xl font-light tracking-widest mb-12">
            {esEmpate ? 'EMPATE' : `${resultado === 1 ? nombreJ1 : nombreJ2} GANA`}
          </h2>
          <div className="flex justify-center gap-16 mb-12 font-light">
            <div className="text-center"><p className="text-gray-400 mb-4 text-xl">{nombreJ1}</p><p className="text-6xl">{marcador[1]}</p></div>
            <div className="text-center"><p className="text-gray-400 mb-4 text-xl">{nombreJ2}</p><p className="text-6xl">{marcador[2]}</p></div>
          </div>
          <button onClick={() => { setTablero(Array(3).fill(null).map(() => Array(3).fill(null))); seleccionarTablero(); setFase('juego'); reiniciarTurno(1); }} className="btn-primario text-lg">
            REVANCHA
          </button>
        </div>
      </div>
    );
  }

  // Fase 3: Pantalla Principal del Juego
  return (
    <div className="layout-principal w-full flex flex-col justify-center">
      
      {/* Cabecera: Quitamos el margen inferior (mb-0) y reducimos el superior (mt-1) */}
      <div className="w-full max-w-[85rem] flex justify-between items-start px-8 mb-0 mt-1">
        
        {/* Marcador Jugador 1 */}
        <div className={`text-center ${jugadorActual === 1 ? 'text-white' : 'text-gray-600'}`}>
          <div className="text-xl uppercase tracking-widest">{nombreJ1}</div>
          <div className="text-6xl mt-1 font-light">{marcador[1]}</div>
        </div>

        {/* Centro: Título y Cronómetro */}
        <div className="flex flex-col items-center">
          <h1 className="text-sm font-light text-gray-500 tracking-widest mb-1">FOOTY TIC-TAC-TOE</h1>
          <div className="text-white font-mono text-2xl tracking-widest">
            00:{String(tiempo).padStart(2, '0')}
          </div>
        </div>

        {/* Marcador Jugador 2 */}
        <div className={`text-center ${jugadorActual === 2 ? 'text-white' : 'text-gray-600'}`}>
          <div className="text-xl uppercase tracking-widest">{nombreJ2}</div>
          <div className="text-6xl mt-1 font-light">{marcador[2]}</div>
        </div>
        
      </div>

      {/* Mensaje de error: Reducimos la altura de h-8 a h-5, achicamos un poco el texto y quitamos márgenes */}
      <div className="h-5 flex items-center justify-center mb-0">
        {mensajeError && (
          <p className="text-red-500 font-semibold tracking-widest uppercase text-xs animate-pulse">
            {mensajeError}
          </p>
        )}
      </div>

      {/* Contenedor de la grilla compactado hacia arriba */}
      <div className="w-full mb-0" style={{ width: '100%', maxWidth: '56rem' }}>
        <div className="grid gap-1" style={{ display: 'grid', gridTemplateColumns: '10rem repeat(3, minmax(0, 1fr)) 10rem', gap: '0.25rem' }}>
          
          <div></div>
          
          {columnas.map((col, i) => (
            <div key={i} className="flex items-end justify-center text-center tracking-wider text-gray-400 uppercase pb-2 px-2" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', textAlign: 'center', fontSize: '0.85rem', letterSpacing: '0.05em', color: '#9ca3af', textTransform: 'uppercase', paddingBottom: '0.5rem' }}>
              {col.etiqueta}
            </div>
          ))}
          
          <div></div>
          
          {filas.map((fila, fIndex) => (
            <React.Fragment key={fIndex}>
              <div className="flex items-center justify-end text-right tracking-wider text-gray-400 uppercase pr-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', textAlign: 'right', fontSize: '0.85rem', letterSpacing: '0.05em', color: '#9ca3af', textTransform: 'uppercase', paddingRight: '1rem' }}>
                {fila.etiqueta}
              </div>
              
              {columnas.map((_, cIndex) => {
                const celda = tablero[fIndex][cIndex];
                return (
                  <button 
                    key={cIndex} 
                    onClick={() => { if (!celda && cronometroActivo) setCeldaActiva({f: fIndex, c: cIndex}) }} 
                    className="celda-juego w-full"
                    style={{ aspectRatio: '1 / 1' }} 
                  >
                    {celda ? <span className="font-light" style={{ fontSize: '4rem', fontWeight: 300 }}>{celda.jugador === 1 ? 'X' : 'O'}</span> : null}
                    {celda && <span className="uppercase text-gray-400 mt-1" style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#9ca3af', marginTop: '0.25rem' }}>
                      {celda.nombre}
                    </span>}
                  </button>
                );
              })}
              
              <div></div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Modal buscador */}
      {celdaActiva && (
        <ModalBusqueda 
          nombreActual={nombreActual}
          busqueda={busqueda} setBusqueda={setBusqueda}
          listaFiltrada={listaFiltrada}
          validarJugador={validarJugador}
          setCeldaActiva={setCeldaActiva}
        />
      )}
    </div>
  );
}