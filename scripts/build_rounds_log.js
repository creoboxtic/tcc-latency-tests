const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const RESULTS = path.join(__dirname, '..', 'results');

function parseReport(file) {
  const md = fs.readFileSync(file, 'utf8');
  const get = (label) => {
    const re = new RegExp(`\\| ${label} \\| ([^|]+?) \\| ([^|]+?) \\|`);
    const m = md.match(re);
    if (!m) return [null, null];
    const clean = s => s.replace(/\*\*/g, '').replace(/ms|%|\s/g, '').trim();
    return [clean(m[1]), clean(m[2])];
  };
  const data = md.match(/Data da execução:\*\*\s*(\S+)/);
  return {
    data_execucao: data ? data[1] : '',
    enviadas:    get('Transações enviadas'),
    sucesso:     get('Transações com sucesso'),
    taxa:        get('Taxa de sucesso'),
    min:         get('Latência mínima \\(ms\\)'),
    max:         get('Latência máxima \\(ms\\)'),
    media:       get('Latência média \\(ms\\)'),
    dp:          get('Desvio padrão \\(ms\\)'),
    p50:         get('\\*\\*p50 \\(mediana\\)\\*\\*'),
    p90:         get('p90'),
    p95:         get('p95'),
    p99:         get('p99'),
    tps:         get('TPS sequencial observado'),
  };
}

function commitTimeForRodada(n) {
  try {
    const log = execSync(`git log --grep "Rodada ${n}" --pretty=format:"%s" -n 1`, { encoding: 'utf8' });
    const m = log.match(/Rodada \d+ — (\d{2})\/(\d{2})\/(\d{4}) (\d{2})h(\d{2}) CEST/);
    if (m) return `${m[3]}-${m[2]}-${m[1]} ${m[4]}:${m[5]} CEST`;
  } catch (_) {}
  return '';
}

const headers = [
  'rodada','data_execucao','commit_timestamp',
  'xrpl_n','xrpl_sucesso','xrpl_taxa','xrpl_min','xrpl_max','xrpl_media','xrpl_dp','xrpl_p50','xrpl_p90','xrpl_p95','xrpl_p99','xrpl_tps',
  'stellar_n','stellar_sucesso','stellar_taxa','stellar_min','stellar_max','stellar_media','stellar_dp','stellar_p50','stellar_p90','stellar_p95','stellar_p99','stellar_tps',
];

const lines = [headers.join(',')];

for (let n = 1; n <= 8; n++) {
  const file = path.join(RESULTS, `relatorio_final_r${n}.md`);
  if (!fs.existsSync(file)) { console.error(`MISSING ${file}`); continue; }
  const r = parseReport(file);
  const row = [
    `r${n}`,
    r.data_execucao,
    commitTimeForRodada(n),
    r.enviadas[0], r.sucesso[0], r.taxa[0], r.min[0], r.max[0], r.media[0], r.dp[0], r.p50[0], r.p90[0], r.p95[0], r.p99[0], r.tps[0],
    r.enviadas[1], r.sucesso[1], r.taxa[1], r.min[1], r.max[1], r.media[1], r.dp[1], r.p50[1], r.p90[1], r.p95[1], r.p99[1], r.tps[1],
  ];
  lines.push(row.join(','));
}

const out = path.join(RESULTS, 'rounds_log.csv');
fs.writeFileSync(out, lines.join('\n') + '\n', 'utf8');
console.log(`Gerado: ${out} (${lines.length - 1} rodadas)`);
