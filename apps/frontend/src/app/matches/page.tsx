'use client';

export default function MatchesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Matches</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Visualiza el historial completo de tus partidas competitivas y las de la comunidad.
      </p>

      <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-800">
        <div className="text-5xl mb-6">🎮</div>
        <h2 className="text-2xl font-bold mb-2">No hay partidas registradas aún</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Las partidas aparecerán aquí una vez que los administradores de tus grupos las registren en el sistema.
        </p>
        <button className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">
          Organizar una Partida
        </button>
      </div>
    </div>
  );
}
