// Marca de la app: una porción de torta (un cuarto de círculo), como una
// birla del gráfico de la Home. Mismo verde de acento y fondo oscuro que el
// resto de la app — solo cambia la forma. Se arma recortando un círculo
// dentro de un contenedor más chico (overflow hidden) en vez de un path SVG
// con arcos o un truco de bordes: Satori (el motor que renderiza estos
// íconos) no soporta bien ninguna de esas dos cosas, pero sí border-radius
// + overflow, que es lo único que usa esta forma.
const FONDO = '#0b0f14';
const VERDE = '#10b981';

export function IconMark({ size }: { size: number }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: FONDO,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          overflow: 'hidden',
          display: 'flex',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: -size,
            top: 0,
            width: size * 2,
            height: size * 2,
            borderRadius: '50%',
            background: VERDE,
          }}
        />
      </div>
    </div>
  );
}
