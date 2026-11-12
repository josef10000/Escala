import { Prestador } from '../types';

export function exportPrestadoresToCSV(prestadores: Prestador[], filename = 'prestadores_dr_monitora.csv') {
  const headers = ['Código', 'Nome', 'Região / Base', 'Telefone', 'Cor', 'Observações'];

  const rows = prestadores.map((p) => [
    `"${(p.codigo || '').replace(/"/g, '""')}"`,
    `"${(p.nome || '').replace(/"/g, '""')}"`,
    `"${(p.regiao || '').replace(/"/g, '""')}"`,
    `"${(p.telefone || '').replace(/"/g, '""')}"`,
    `"${(p.cor || '').replace(/"/g, '""')}"`,
    `"${(p.observacao || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
