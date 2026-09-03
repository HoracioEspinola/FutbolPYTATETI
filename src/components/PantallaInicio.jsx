export function PantallaInicio({ nombreJ1, setNombreJ1, nombreJ2, setNombreJ2, iniciarJuego }) {
  return (
    <div className="layout-principal">
      <div className="w-full max-w-lg p-8">
        <h1 className="titulo-principal whitespace-nowrap">FOOTY TIC-TAC-TOE</h1>
        <div className="input-container">
          <input type="text" placeholder="Jugador 1" value={nombreJ1} onChange={(e) => setNombreJ1(e.target.value)} className="input-field" autoFocus />
        </div>
        <div className="input-container">
          <input type="text" placeholder="Jugador 2" value={nombreJ2} onChange={(e) => setNombreJ2(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && iniciarJuego()} className="input-field" />
        </div>
        <button onClick={iniciarJuego} disabled={!nombreJ1.trim() || !nombreJ2.trim()} className="btn-primario" style={{ marginTop: '2.5rem' }}>JUGAR</button>
      </div>
    </div>
  );
}