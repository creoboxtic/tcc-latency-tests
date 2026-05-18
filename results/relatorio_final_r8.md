# Relatório de Testes Empíricos de Latência

**TCC — Integração de Blockchain e DLT com o Padrão ISO 20022**  
**Universidade Anhembi Morumbi — Engenharia da Computação — 2026**  
**Data da execução:** 2026-05-18

---

## 1. Metodologia

Os testes foram realizados nas redes públicas de teste (Testnet) do XRP Ledger e da Stellar, utilizando os SDKs oficiais (`xrpl` v4.6.0 e `@stellar/stellar-sdk` v15.1.0). Cada transação é uma operação Payment com memo carregando uma referência UETR (Unique End-to-End Transaction Reference), compatível com o padrão ISO 20022.

A latência é medida em milissegundos como a diferença entre o timestamp de submissão da transação e o timestamp de confirmação no ledger (validação consensual).

**Limitações reconhecidas:**
- Testes em Testnet podem apresentar latência ligeiramente superior à mainnet devido a menor número de validadores ativos.
- Transações sequenciais (não paralelas) — o TPS observado é limitado pelo cliente, não pela rede.
- Amostra de 50 transações por rede.

---

## 2. Resultados Consolidados

### Tabela 1 — Estatísticas descritivas comparativas

| Métrica | XRP Ledger Testnet | Stellar Testnet |
|---|---:|---:|
| Transações enviadas | 50 | 50 |
| Transações com sucesso | 50 | 50 |
| Taxa de sucesso | 100.0% | 100.0% |
| Latência mínima (ms) | 2908 | 1770 |
| Latência máxima (ms) | 8380 | 5863 |
| Latência média (ms) | 5918.54 | 4844.74 |
| Desvio padrão (ms) | 908.11 | 689.18 |
| **p50 (mediana)** | **5646 ms** | **4902 ms** |
| p90 | 7012 ms | 5697 ms |
| p95 | 7058 ms | 5707 ms |
| p99 | 8380 ms | 5863 ms |
| TPS sequencial observado | 0.17 | 0.21 |

*Fonte: Elaborado pelos autores a partir de testes empíricos realizados em 2026-05-18.*

---

## 3. Comparação com benchmarks oficiais

| Rede | TPS observado (sequencial) | TPS teórico oficial | Fonte |
|---|---:|---:|---|
| XRP Ledger | 0.17 | 1.500 (commodity hw) | xrpl.org/blog/2017 |
| Stellar | 0.21 | 2.032 (teórico, jun/2025) | stellar.org/faq |

**Análise:** O TPS sequencial observado nestes testes é inferior à capacidade teórica das redes porque os testes não exploram paralelismo. O objetivo principal aqui é medir **latência por transação**, não throughput máximo. Os valores de p50/p95 são as métricas mais relevantes para avaliar a viabilidade das redes em sistemas de pagamento em tempo real.

---

## 4. Próximas etapas

1. Expandir a amostra para 100+ transações para análise inferencial (intervalos de confiança).
2. Testar paralelismo com pool de carteiras para medir TPS máximo realista.
3. Repetir testes em janelas horárias distintas para avaliar variação por carga da rede.
4. Comparar com benchmarks oficiais publicados pelas fundações (RippleX e SDF).

---

*Relatório gerado automaticamente por `scripts/generate_report.js`.*
