'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function RankingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Rankings Globales</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Mira quién domina la competencia en todos los grupos y comunidades.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-8">
        <aside className="md:col-span-1 space-y-6">
          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Filtrar por Grupo</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg font-bold border border-blue-500/20">
                ⭐ Global (Top 100)
              </button>
              <button className="w-full text-left px-4 py-2 hover:bg-white/5 text-gray-400 rounded-lg transition-colors">
                Unirse a un grupo...
              </button>
            </div>
          </section>
        </aside>

        <main className="md:col-span-3">
          <Card>
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-center">
                <CardTitle>Top Jugadores</CardTitle>
                <div className="text-xs text-gray-500 font-medium">Última actualización: Hoy, 19:22</div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 text-left text-xs text-gray-500 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">#</th>
                      <th className="px-6 py-4">Jugador</th>
                      <th className="px-6 py-4">Elo / Puntos</th>
                      <th className="px-6 py-4">Winrate</th>
                      <th className="px-6 py-4">Partidas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    <tr className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 font-black text-xl text-yellow-500">1</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-600 font-bold">L</div>
                          <span className="font-bold">Luan</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-blue-500">1250 pts</td>
                      <td className="px-6 py-4 text-green-500 font-medium">85%</td>
                      <td className="px-6 py-4 text-gray-500">20</td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-black text-lg text-gray-400">2</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-500/20 flex items-center justify-center text-gray-400 font-bold">A</div>
                          <span className="font-bold text-gray-300">Admin</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-400">1100 pts</td>
                      <td className="px-6 py-4 text-gray-400 font-medium">50%</td>
                      <td className="px-6 py-4 text-gray-400">10</td>
                    </tr>
                    {/* Placeholder filas vacías */}
                    {[...Array(3)].map((_, i) => (
                      <tr key={i} className="opacity-30">
                        <td className="px-6 py-6" colSpan={5}>
                          <div className="h-4 bg-gray-700/50 rounded-full animate-pulse"></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
