/**
 * ============================================================================
 *  TCC — Integração Blockchain · DLT · ISO 20022
 *  Universidade Anhembi Morumbi — Engenharia da Computação — 2026
 * ----------------------------------------------------------------------------
 *  TESTE DE LATÊNCIA — XRP LEDGER TESTNET
 *
 *  Metodologia (alinhada com a Seção 9 da monografia):
 *    1. Conecta ao XRPL Testnet via WebSocket (wss://s.altnet.rippletest.net)
 *    2. Gera duas carteiras via faucet oficial (XRP de teste, sem valor real)
 *    3. Envia N transações Payment sequenciais com memo UETR (ISO 20022)
 *    4. Mede para cada tx: t_submit → t_validated (em ms)
 *    5. Calcula estatísticas descritivas: p50, p90, p95, p99, média, dp
 *    6. Exporta resultados em CSV para análise no Excel/Python/R
 *
 *  Referência técnica: https://xrpl.org/docs/concepts/transactions/
 * ============================================================================
 */

const xrpl = require('xrpl');
const fs = require('fs');
const path = require('path');

// --- CONFIGURAÇÃO DO EXPERIMENTO ----------------------------------------
const CONFIG = {
  TESTNET_URL: 'wss://s.altnet.rippletest.net:51233', // endpoint oficial XRPL Testnet
  NUM_TRANSACTIONS: parseInt(process.env.NUM_TRANSACTIONS, 10) || 50, // número de transações a medir
  AMOUNT_PER_TX_XRP: '1',                              // valor por tx (em testnet, sem valor real)
  OUTPUT_CSV: path.join(__dirname, '..', 'results', `resultados_xrpl${process.env.RODADA ? `_r${process.env.RODADA}` : ''}.csv`),
};

// --- UTILIDADES ESTATÍSTICAS --------------------------------------------
const percentile = (arr, p) => {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.max(0, Math.ceil((p / 100) * s.length) - 1)];
};
const mean = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
const stdev = arr => {
  const m = mean(arr);
  return Math.sqrt(mean(arr.map(x => (x - m) ** 2)));
};

// --- MAIN ----------------------------------------------------------------
async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  TESTE DE LATÊNCIA — XRP LEDGER TESTNET');
  console.log('  TCC Anhembi Morumbi — Engenharia da Computação — 2026');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log(`▶ Conectando: ${CONFIG.TESTNET_URL}`);
  const client = new xrpl.Client(CONFIG.TESTNET_URL);
  await client.connect();
  console.log('✓ Conectado.\n');

  // Gera duas carteiras com fundos do faucet
  console.log('▶ Gerando carteiras de teste via faucet...');
  const { wallet: sender } = await client.fundWallet();
  const { wallet: receiver } = await client.fundWallet();
  console.log(`  → Ordenante:    ${sender.address}`);
  console.log(`  → Beneficiário: ${receiver.address}\n`);

  // Loop de transações com medição
  console.log(`▶ Executando ${CONFIG.NUM_TRANSACTIONS} transações sequenciais...\n`);
  console.log('  #  | Hash (12 chars) | Latência (ms) | Validated Ledger | Status');
  console.log('  ---|-----------------|---------------|------------------|--------');

  const results = [];

  for (let i = 1; i <= CONFIG.NUM_TRANSACTIONS; i++) {
    const tx = {
      TransactionType: 'Payment',
      Account: sender.address,
      Amount: xrpl.xrpToDrops(CONFIG.AMOUNT_PER_TX_XRP),
      Destination: receiver.address,
      // Memo carregando referência UETR (Unique End-to-End Transaction Reference)
      // — campo crítico do padrão ISO 20022
      Memos: [{
        Memo: {
          MemoType: Buffer.from('UETR', 'utf8').toString('hex').toUpperCase(),
          MemoData: Buffer.from(
            `TCC-UAM-2026-TX${String(i).padStart(4, '0')}`,
            'utf8'
          ).toString('hex').toUpperCase(),
        },
      }],
    };

    try {
      const prepared = await client.autofill(tx);
      const signed = sender.sign(prepared);

      const tSubmit = Date.now();
      const txResult = await client.submitAndWait(signed.tx_blob);
      const tValidated = Date.now();

      const latencyMs = tValidated - tSubmit;
      const txHash = txResult.result.hash;
      const ledgerIndex = txResult.result.ledger_index;
      const txStatus = txResult.result.meta?.TransactionResult || 'unknown';
      const success = txStatus === 'tesSUCCESS';

      results.push({
        index: i,
        hash: txHash,
        latencyMs,
        ledgerIndex,
        status: txStatus,
        success,
      });

      const flag = success ? '✓' : '✗';
      console.log(
        `  ${String(i).padStart(2)} | ${txHash.substring(0, 16)} | ` +
        `${String(latencyMs).padStart(13)} | ${String(ledgerIndex).padStart(16)} | ${flag} ${txStatus}`
      );
    } catch (err) {
      console.log(`  ${String(i).padStart(2)} | ERROR           | -             | -                | ✗ ${err.message}`);
      results.push({
        index: i,
        hash: 'ERROR',
        latencyMs: null,
        ledgerIndex: null,
        status: err.message,
        success: false,
      });
    }
  }

  await client.disconnect();
  console.log('\n✓ Desconectado do XRPL Testnet.\n');

  // Estatísticas
  const successful = results.filter(r => r.success);
  const latencies = successful.map(r => r.latencyMs);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ESTATÍSTICAS DESCRITIVAS — XRP LEDGER TESTNET');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Transações enviadas:    ${results.length}`);
  console.log(`  Transações com sucesso: ${successful.length} (${((successful.length / results.length) * 100).toFixed(1)}%)`);

  if (latencies.length > 0) {
    console.log('');
    console.log(`  Latência mínima:        ${Math.min(...latencies)} ms`);
    console.log(`  Latência máxima:        ${Math.max(...latencies)} ms`);
    console.log(`  Latência média:         ${mean(latencies).toFixed(2)} ms`);
    console.log(`  Desvio padrão:          ${stdev(latencies).toFixed(2)} ms`);
    console.log('');
    console.log(`  Percentil p50 (mediana): ${percentile(latencies, 50)} ms`);
    console.log(`  Percentil p90:           ${percentile(latencies, 90)} ms`);
    console.log(`  Percentil p95:           ${percentile(latencies, 95)} ms`);
    console.log(`  Percentil p99:           ${percentile(latencies, 99)} ms`);
    console.log('');
    const totalSeconds = latencies.reduce((a, b) => a + b, 0) / 1000;
    console.log(`  Throughput observado:    ${(successful.length / totalSeconds).toFixed(2)} TPS (sequencial)`);
    console.log('  Nota: este é o TPS *sequencial* observado pelo cliente;');
    console.log('  a capacidade teórica do XRPL é ~1.500 TPS em hardware dedicado');
    console.log('  (https://xrpl.org/blog/2017/high-scalability-xrp-ledger).');
  }
  console.log('═══════════════════════════════════════════════════════════════\n');

  // CSV
  fs.mkdirSync(path.dirname(CONFIG.OUTPUT_CSV), { recursive: true });
  const csv = [
    'rede,tx_index,tx_hash,latency_ms,ledger_index,status,success,timestamp_iso',
    ...results.map(r =>
      `XRPL,${r.index},${r.hash},${r.latencyMs ?? ''},${r.ledgerIndex ?? ''},${r.status},${r.success},${new Date().toISOString()}`
    ),
  ].join('\n');

  fs.writeFileSync(CONFIG.OUTPUT_CSV, csv);
  console.log(`✓ Resultados salvos em: ${CONFIG.OUTPUT_CSV}\n`);
}

main().catch(err => {
  console.error('\n✗ ERRO FATAL:', err);
  process.exit(1);
});
