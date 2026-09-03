export function Marcador({ nombreJ1, nombreJ2, jugadorActual, marcador, tiempo }) {
  return (
    <div className="flex items-center gap-12 mb-6 font-light tracking-wider" style={{ display: 'flex' }}>
      <div className={`text-center text-sm ${jugadorActual === 1 ? 'text-white' : 'text-gray-600'}`}>
        {nombreJ1}
        <span className="block text-3xl mt-1" style={{ display: 'block' }}>{marcador[1]}</span>
      </div>
      <div className="text-white font-mono text-3xl">00:{String(tiempo).padStart(2, '0')}</div>
      <div className={`text-center text-sm ${jugadorActual === 2 ? 'text-white' : 'text-gray-600'}`}>
        {nombreJ2}
        <span className="block text-3xl mt-1" style={{ display: 'block' }}>{marcador[2]}</span>
      </div>
    </div>
  );
}