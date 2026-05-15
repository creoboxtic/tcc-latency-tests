/**
 * ============================================================================
 *  TCC — Gerador de relatório consolidado
 * ----------------------------------------------------------------------------
 *  Lê os CSVs de resultados (XRPL + Stellar) e gera um relatório em Markdown
 *  com tabelas comparativas, pronto para ser anexado à monografia do TCC.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const RESULTS_DIR = path.join(__dirname, '..', 'results');
const SUFFIX = process.env.RODADA ? `_r${process.env.RODADA}` : '';
const OUTPUT_FILE = path.join(RESULTS_DIR, `relatorio_final${SUFFIX}.md`);

// --- ESTATÍSTICAS ---
const percentile = (arr, p) => {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.max(0, Math.ceil((p / 100) * s.length) - 1)];
};
const mean = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
const stdev = arr => {
  const m = mean(arr);
  return Math.sqrt(mean(arr.map(x => (x - m) ** 2)));
};

// --- CSV parser simples ---
function parseCSV(filepath) {
  if (!fs.existsSync(filepath)) return null;
  const lines = fs.readFileSync(filepath, 'utf8').trim().split('\n');
  const header = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return Object.fromEntries(header.map((k, i) => [k, values[i]]));
  });
}

function computeStats(rows) {
  const ok = rows.filter(r => r.success === 'true');
  const latencies = ok.map(r => Number(r.latency_ms)).filter(n => !isNaN(n));

  if (latencies.length === 0) return null;

  const totalSeconds = latencies.reduce((a, b) => a + b, 0) / 1000;

  return {
    total: rows.length,
    successful: ok.length,
    successRate: ((ok.length / rows.length) * 100).toFixed(1),
    min: Math.min(...latencies),
    max: Math.max(...latencies),
    mean: mean(latencies).toFixed(2),
    stdev: stdev(latencies).toFixed(2),
    p50: percentile(latencies, 50),
    p90: percentile(latencies, 90),
    p95: percentile(latencies, 95),
    p99: percentile(latencies, 99),
    tps: (ok.length / totalSeconds).toFixed(2),
  };
}

// --- MAIN ---
function main() {
  const xrplData = parseCSV(path.join(RESULTS_DIR, `resultados_xrpl${SUFFIX}.csv`));
  const stellarData = parseCSV(path.join(RESULTS_DIR, `resultados_stellar${SUFFIX}.csv`));

  const xrpl = xrplData ? computeStats(xrplData) : null;
  const stellar = stellarData ? computeStats(stellarData) : null;

  const now = new Date().toISOString().split('T')[0];

  let md = `# Relatório de Testes Empíricos de Latência\n\n`;
  md += `**TCC — Integração de Blockchain e DLT com o Padrão ISO 20022**  \n`;
  md += `**Universidade Anhembi Morumbi — Engenharia da Computação — 2026**  \n`;
  md += `**Data da execução:** ${now}\n\n`;
  md += `---\n\n`;
  md += `## 1. Metodologia\n\n`;
  md += `Os testes foram realizados nas redes públicas de teste (Testnet) do XRP Ledger e da Stellar, `;
  md += `utilizando os SDKs oficiais (\`xrpl\` v4.6.0 e \`@stellar/stellar-sdk\` v15.1.0). `;
  md += `Cada transação é uma operação Payment com memo carregando uma referência UETR (Unique End-to-End Transaction Reference), `;
  md += `compatível com o padrão ISO 20022.\n\n`;
  md += `A latência é medida em milissegundos como a diferença entre o timestamp de submissão da transação `;
  md += `e o timestamp de confirmação no ledger (validação consensual).\n\n`;
  md += `**Limitações reconhecidas:**\n`;
  md += `- Testes em Testnet podem apresentar latência ligeiramente superior à mainnet devido a menor número de validadores ativos.\n`;
  md += `- Transações sequenciais (não paralelas) — o TPS observado é limitado pelo cliente, não pela rede.\n`;
  const sampleSize = xrpl?.total ?? stellar?.total ?? '—';
  md += `- Amostra de ${sampleSize} transações por rede.\n\n`;
  md += `---\n\n`;
  md += `## 2. Resultados Consolidados\n\n`;

  md += `### Tabela 1 — Estatísticas descritivas comparativas\n\n`;
  md += `| Métrica | XRP Ledger Testnet | Stellar Testnet |\n`;
  md += `|---|---:|---:|\n`;
  md += `| Transações enviadas | ${xrpl?.total ?? '—'} | ${stellar?.total ?? '—'} |\n`;
  md += `| Transações com sucesso | ${xrpl?.successful ?? '—'} | ${stellar?.successful ?? '—'} |\n`;
  md += `| Taxa de sucesso | ${xrpl?.successRate ?? '—'}% | ${stellar?.successRate ?? '—'}% |\n`;
  md += `| Latência mínima (ms) | ${xrpl?.min ?? '—'} | ${stellar?.min ?? '—'} |\n`;
  md += `| Latência máxima (ms) | ${xrpl?.max ?? '—'} | ${stellar?.max ?? '—'} |\n`;
  md += `| Latência média (ms) | ${xrpl?.mean ?? '—'} | ${stellar?.mean ?? '—'} |\n`;
  md += `| Desvio padrão (ms) | ${xrpl?.stdev ?? '—'} | ${stellar?.stdev ?? '—'} |\n`;
  md += `| **p50 (mediana)** | **${xrpl?.p50 ?? '—'} ms** | **${stellar?.p50 ?? '—'} ms** |\n`;
  md += `| p90 | ${xrpl?.p90 ?? '—'} ms | ${stellar?.p90 ?? '—'} ms |\n`;
  md += `| p95 | ${xrpl?.p95 ?? '—'} ms | ${stellar?.p95 ?? '—'} ms |\n`;
  md += `| p99 | ${xrpl?.p99 ?? '—'} ms | ${stellar?.p99 ?? '—'} ms |\n`;
  md += `| TPS sequencial observado | ${xrpl?.tps ?? '—'} | ${stellar?.tps ?? '—'} |\n\n`;
  md += `*Fonte: Elaborado pelos autores a partir de testes empíricos realizados em ${now}.*\n\n`;

  md += `---\n\n`;
  md += `## 3. Comparação com benchmarks oficiais\n\n`;
  md += `| Rede | TPS observado (sequencial) | TPS teórico oficial | Fonte |\n`;
  md += `|---|---:|---:|---|\n`;
  md += `| XRP Ledger | ${xrpl?.tps ?? '—'} | 1.500 (commodity hw) | xrpl.org/blog/2017 |\n`;
  md += `| Stellar | ${stellar?.tps ?? '—'} | 2.032 (teórico, jun/2025) | stellar.org/faq |\n\n`;
  md += `**Análise:** O TPS sequencial observado nestes testes é inferior à capacidade teórica das redes `;
  md += `porque os testes não exploram paralelismo. O objetivo principal aqui é medir **latência por transação**, `;
  md += `não throughput máximo. Os valores de p50/p95 são as métricas mais relevantes para avaliar a viabilidade `;
  md += `das redes em sistemas de pagamento em tempo real.\n\n`;

  md += `---\n\n`;
  md += `## 4. Próximas etapas\n\n`;
  md += `1. Expandir a amostra para 100+ transações para análise inferencial (intervalos de confiança).\n`;
  md += `2. Testar paralelismo com pool de carteiras para medir TPS máximo realista.\n`;
  md += `3. Repetir testes em janelas horárias distintas para avaliar variação por carga da rede.\n`;
  md += `4. Comparar com benchmarks oficiais publicados pelas fundações (RippleX e SDF).\n\n`;

  md += `---\n\n`;
  md += `*Relatório gerado automaticamente por \`scripts/generate_report.js\`.*\n`;

  fs.writeFileSync(OUTPUT_FILE, md);
  console.log(`\n✓ Relatório gerado: ${OUTPUT_FILE}\n`);
  console.log('Próximo passo: abrir o arquivo no VS Code ou converter para PDF/DOCX.\n');
}

main();
