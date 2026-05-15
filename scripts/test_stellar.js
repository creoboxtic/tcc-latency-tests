/**
 * ============================================================================
 *  TCC — Integração Blockchain · DLT · ISO 20022
 *  Universidade Anhembi Morumbi — Engenharia da Computação — 2026
 * ----------------------------------------------------------------------------
 *  TESTE DE LATÊNCIA — STELLAR TESTNET
 *
 *  Metodologia (alinhada com a Seção 9 da monografia):
 *    1. Conecta ao Stellar Testnet via Horizon (horizon-testnet.stellar.org)
 *    2. Gera duas contas via Friendbot oficial (XLM de teste, sem valor real)
 *    3. Envia N transações Payment sequenciais com memo TEXT (UETR ISO 20022)
 *    4. Mede para cada tx: t_submit → t_confirmed (em ms)
 *    5. Calcula estatísticas: p50, p90, p95, p99, média, desvio-padrão
 *    6. Exporta resultados em CSV
 *
 *  Referência técnica:
 *    https://developers.stellar.org/docs/learn/fundamentals/transactions/
 * ============================================================================
 */

const StellarSdk = require('@stellar/stellar-sdk');
const fs = require('fs');
const path = require('path');

// --- CONFIGURAÇÃO -------------------------------------------------------
const CONFIG = {
  HORIZON_URL: 'https://horizon-testnet.stellar.org',
  FRIENDBOT_URL: 'https://friendbot.stellar.org',
  NETWORK_PASSPHRASE: StellarSdk.Networks.TESTNET,
  NUM_TRANSACTIONS: parseInt(process.env.NUM_TRANSACTIONS, 10) || 50,
  AMOUNT_PER_TX_XLM: '10',  // 10 XLM por tx (testnet, sem valor real)
  BASE_FEE: StellarSdk.BASE_FEE,  // 100 stroops = 0.00001 XLM
  OUTPUT_CSV: path.join(__dirname, '..', 'results', `resultados_stellar${process.env.RODADA ? `_r${process.env.RODADA}` : ''}.csv`),
};

// --- ESTATÍSTICAS -------------------------------------------------------
const percentile = (arr, p) => {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.max(0, Math.ceil((p / 100) * s.length) - 1)];
};
const mean = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
const stdev = arr => {
  const m = mean(arr);
  return Math.sqrt(mean(arr.map(x => (x - m) ** 2)));
};

// --- FRIENDBOT (financiar conta de teste) -------------------------------
async function fundAccount(publicKey) {
  const url = `${CONFIG.FRIENDBOT_URL}?addr=${publicKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Friendbot falhou (HTTP ${res.status}): ${await res.text()}`);
  }
  return res.json();
}

// --- MAIN ---------------------------------------------------------------
async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  TESTE DE LATÊNCIA — STELLAR TESTNET');
  console.log('  TCC Anhembi Morumbi — Engenharia da Computação — 2026');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log(`▶ Conectando: ${CONFIG.HORIZON_URL}`);
  const server = new StellarSdk.Horizon.Server(CONFIG.HORIZON_URL);
  console.log('✓ Conectado.\n');

  // Gerar e financiar carteiras
  console.log('▶ Gerando carteiras de teste...');
  const senderKeys = StellarSdk.Keypair.random();
  const receiverKeys = StellarSdk.Keypair.random();
  console.log(`  → Ordenante:    ${senderKeys.publicKey()}`);
  console.log(`  → Beneficiário: ${receiverKeys.publicKey()}`);

  console.log('\n▶ Financiando carteiras via Friendbot...');
  await fundAccount(senderKeys.publicKey());
  await fundAccount(receiverKeys.publicKey());
  console.log('✓ Carteiras financiadas com 10.000 XLM (testnet).\n');

  // Aguardar 2s para o Horizon indexar as contas recém-criadas
  await new Promise(r => setTimeout(r, 2000));

  // Loop de transações
  console.log(`▶ Executando ${CONFIG.NUM_TRANSACTIONS} transações sequenciais...\n`);
  console.log('  #  | Hash (12 chars) | Latência (ms) | Ledger | Status');
  console.log('  ---|-----------------|---------------|--------|--------');

  const results = [];

  for (let i = 1; i <= CONFIG.NUM_TRANSACTIONS; i++) {
    try {
      // Carrega a conta do ordenante (necessário para sequência)
      const senderAccount = await server.loadAccount(senderKeys.publicKey());

      // Constrói a transação com memo UETR (ISO 20022)
      const tx = new StellarSdk.TransactionBuilder(senderAccount, {
        fee: CONFIG.BASE_FEE,
        networkPassphrase: CONFIG.NETWORK_PASSPHRASE,
      })
        .addOperation(StellarSdk.Operation.payment({
          destination: receiverKeys.publicKey(),
          asset: StellarSdk.Asset.native(),
          amount: CONFIG.AMOUNT_PER_TX_XLM,
        }))
        .addMemo(StellarSdk.Memo.text(`TCC-UAM-TX${String(i).padStart(4, '0')}`))
        .setTimeout(60)
        .build();

      tx.sign(senderKeys);

      const tSubmit = Date.now();
      const txResult = await server.submitTransaction(tx);
      const tConfirmed = Date.now();

      const latencyMs = tConfirmed - tSubmit;
      const txHash = txResult.hash;
      const ledger = txResult.ledger;
      const success = txResult.successful !== false;

      results.push({
        index: i,
        hash: txHash,
        latencyMs,
        ledgerIndex: ledger,
        status: success ? 'success' : 'failed',
        success,
      });

      const flag = success ? '✓' : '✗';
      console.log(
        `  ${String(i).padStart(2)} | ${txHash.substring(0, 16)} | ` +
        `${String(latencyMs).padStart(13)} | ${String(ledger).padStart(6)} | ${flag}`
      );
    } catch (err) {
      const errMsg = err.response?.data?.extras?.result_codes
        ? JSON.stringify(err.response.data.extras.result_codes)
        : err.message;
      console.log(`  ${String(i).padStart(2)} | ERROR           | -             | -      | ✗ ${errMsg}`);
      results.push({
        index: i,
        hash: 'ERROR',
        latencyMs: null,
        ledgerIndex: null,
        status: errMsg,
        success: false,
      });
    }
  }

  console.log('\n✓ Testes concluídos.\n');

  // Estatísticas
  const successful = results.filter(r => r.success);
  const latencies = successful.map(r => r.latencyMs);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ESTATÍSTICAS DESCRITIVAS — STELLAR TESTNET');
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
    console.log('  Nota: TPS sequencial observado pelo cliente;');
    console.log('  a capacidade teórica da Stellar é ~1.000-2.032 TPS');
    console.log('  (https://stellar.org/faq, jun 2025).');
  }
  console.log('═══════════════════════════════════════════════════════════════\n');

  // CSV
  fs.mkdirSync(path.dirname(CONFIG.OUTPUT_CSV), { recursive: true });
  const csv = [
    'rede,tx_index,tx_hash,latency_ms,ledger_index,status,success,timestamp_iso',
    ...results.map(r =>
      `STELLAR,${r.index},${r.hash},${r.latencyMs ?? ''},${r.ledgerIndex ?? ''},${r.status},${r.success},${new Date().toISOString()}`
    ),
  ].join('\n');

  fs.writeFileSync(CONFIG.OUTPUT_CSV, csv);
  console.log(`✓ Resultados salvos em: ${CONFIG.OUTPUT_CSV}\n`);
}

main().catch(err => {
  console.error('\n✗ ERRO FATAL:', err);
  process.exit(1);
});
