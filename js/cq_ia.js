// cq_ia.js — IA para Cinquillo

function cqDecidirCarta(mano, mesa) {
  const legales = cqCartasLegales(mano, mesa);
  if (legales.length === 0) return null; // pasa

  // 1. Jugar un 5 que abra un palo nuevo (prioridad alta)
  const cincos = legales.filter(c => c.valor === 5);
  if (cincos.length > 0) {
    // Abrir el palo donde tengamos más cartas
    return cincos.reduce((best, c) => {
      const misPalos = mano.filter(x => x.palo === c.palo).length;
      const bestPalo = mano.filter(x => x.palo === best.palo).length;
      return misPalos > bestPalo ? c : best;
    });
  }

  // 2. Preferir cartas extremas (As o Rey) que ya no pueden bloquearse
  const extremas = legales.filter(c => c.valor === 1 || c.valor === 12);
  if (extremas.length > 0) return extremas[0];

  // 3. Preferir el palo donde tenemos más cartas (para vaciarlo antes)
  return legales.reduce((best, c) => {
    const misPalo   = mano.filter(x => x.palo === c.palo).length;
    const bestPalo  = mano.filter(x => x.palo === best.palo).length;
    return misPalo > bestPalo ? c : best;
  });
}
