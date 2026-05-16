# TCC Latency Tests — XRPL + Stellar

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-20.10+-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![XRPL](https://img.shields.io/badge/XRPL-Testnet-1A6BF6)](https://xrpl.org/)
[![Stellar](https://img.shields.io/badge/Stellar-Testnet-7D00FF)](https://stellar.org/)
[![ISO 20022](https://img.shields.io/badge/ISO%2020022-UETR-0A4D8C)](https://www.iso20022.org/)
[![TCC](https://img.shields.io/badge/TCC-UAM%202026-success)](https://www.anhembi.br/)

Testes empíricos de latência em redes DLT — Trabalho de Conclusão de Curso interdisciplinar, Faculdade de Engenharia, Anhembi Morumbi (2026).

## Quick Start

```bash
docker compose up --build
```

Funciona idêntico em **Linux** e **Windows** (com Docker Desktop). Tempo: ~10 min.

Resultados em `./results/`:
- `resultados_xrpl.csv`
- `resultados_stellar.csv`
- `relatorio_final.md` — pronto para anexar ao TCC

## Guia de execução completo

Consulte [`GUIA_EXECUCAO.md`](./GUIA_EXECUCAO.md) — instruções detalhadas de execução, validação e diagnóstico de falhas.

## Sem Docker (Linux/macOS apenas)

```bash
npm install
npm run full
```

## Comandos úteis

```bash
docker compose up                    # re-executar
docker compose up --build            # rebuild + executar
docker compose logs -f               # logs em tempo real
docker compose down                  # parar e limpar
```

## Customizar tamanho da amostra

Editar `CONFIG.NUM_TRANSACTIONS` em:
- `scripts/test_xrpl.js`
- `scripts/test_stellar.js`

Sugestões: 20 (descritivo), 100 (inferencial).

---

## 👥 Equipe

Trabalho interdisciplinar com integrantes de três cursos da Faculdade de Engenharia:

| Autor | Curso |
|---|---|
| Luis Manuel Horcajada Oliva | Engenharia da Computação |
| Lucylla Mendes Farias | Engenharia Elétrica |
| Luan Ribeiro de Souza | Engenharia Civil |
| Luiz Gustavo Gramignolli Mariano | Engenharia Civil |

**Orientador:** Prof. Diógenes Carvalho Matias
**Tutora:** Profa. Rita de Cassia Almeida de Mesquita
**Instituição:** Universidade Anhembi Morumbi · São Paulo · 2026

## Como citar (ABNT NBR 6023:2018)

> HORCAJADA OLIVA, L. M.; MENDES FARIAS, L.; RIBEIRO DE SOUZA, L.;
> GRAMIGNOLLI MARIANO, L. G. **TCC — Empirical Latency Benchmarks:
> XRP Ledger and Stellar Testnet**. São Paulo: Universidade Anhembi
> Morumbi, 2026. Disponível em: https://github.com/creoboxtic/tcc-latency-tests.
> Acesso em: [data].

---

*Grupo TCC — Faculdade de Engenharia · Universidade Anhembi Morumbi · 2026*
