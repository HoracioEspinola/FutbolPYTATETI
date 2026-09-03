export function ModalBusqueda({ nombreActual, busqueda, setBusqueda, listaFiltrada, validarJugador, setCeldaActiva }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="text-xl font-light tracking-widest text-gray-300 mb-6 uppercase" style={{ fontSize: '1.25rem', fontWeight: 300, letterSpacing: '0.1em', color: '#d1d5db', marginBottom: '1.5rem', textTransform: 'uppercase' }}>Turno de {nombreActual}</h2>
        <div className="input-container">
          <span className="text-gray-400 text-xl" style={{ color: '#9ca3af' }}>🔍</span>
          <input type="text" placeholder="Buscar jugador..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="input-field" autoFocus />
        </div>
        <div className="max-h-56 overflow-y-auto flex flex-col mb-6" style={{ maxHeight: '14rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', marginBottom: '1.5rem' }}>
          {listaFiltrada.slice(0, 15).map((j, i) => (
            <button key={i} onClick={() => validarJugador(j)} className="text-left p-4 border-b border-gray-800 hover:bg-gray-800 text-base text-gray-300 transition" style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid #1f2937', fontSize: '1rem', color: '#d1d5db', transition: 'background-color 0.15s' }}>
              {j.nombre}
            </button>
          ))}
        </div>
        <button onClick={() => setCeldaActiva(null)} className="btn-primario text-lg" style={{ fontSize: '1.125rem' }}>CANCELAR</button>
      </div>
    </div>
  );
}