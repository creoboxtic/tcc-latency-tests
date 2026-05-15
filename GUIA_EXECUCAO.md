# Guia de Execução — Testes de Latência DLT (XRPL + Stellar)

**Universidade Anhembi Morumbi · Engenharia da Computação · 2026**

---

## 1. Pré-requisitos

Verifique que as ferramentas estão instaladas:

```bash
docker --version          # esperado: 20.10+
docker compose version    # esperado: v2+
```

Caso falte alguma, instale o Docker Desktop (Windows/macOS) ou o Docker Engine (Linux) antes de prosseguir.

---

## 2. Construção e execução

Na raiz do projeto, execute:

```bash
docker compose up --build
```

Esse comando:

1. Constrói a imagem `node:20-alpine` (~150 MB).
2. Instala as dependências `xrpl` v4.6.0 e `@stellar/stellar-sdk` v15.1.0.
3. Executa `test_xrpl.js` (~50 transações na XRPL Testnet).
4. Executa `test_stellar.js` (~50 transações na Stellar Testnet).
5. Gera `results/relatorio_final.md`.

**Tempo estimado:** 10–18 minutos.

---

## 3. Validação dos resultados

Após a execução, confirme os arquivos gerados:

```bash
ls -lh results/
```

Esperado:

- `resultados_xrpl.csv`
- `resultados_stellar.csv`
- `relatorio_final.md`

Abra `relatorio_final.md` para conferir as métricas (p50, p95, taxa de sucesso). Caso algum arquivo esteja ausente, verifique os logs do contêiner para identificar qual teste falhou.

---

## 4. Diagnóstico de falhas

| Sintoma | Causa provável | Solução |
|---|---|---|
| Faucet rate limit | Muitas requisições do mesmo IP | Aguardar 10–15 min e repetir |
| ECONNREFUSED / ETIMEDOUT | Firewall ou ausência de internet | Verificar conectividade |
| Sequence mismatch (Stellar) | Conta ainda não indexada | Aumentar `setTimeout` de 2000 → 5000 ms |
| Erros `tem_*` (XRPL) | Erro de transação | Consultar os logs |

---

## 5. Próximos passos sugeridos

1. Repetir os testes em horários distintos (manhã, tarde, noite) para avaliar variações de carga.
2. Converter `relatorio_final.md` em DOCX com `pandoc` para anexar ao Apêndice F da monografia.

---

## 6. Estrutura do projeto

```
tcc-latency-tests/
├── GUIA_EXECUCAO.md
├── README.md
├── package.json
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── scripts/
│   ├── test_xrpl.js
│   ├── test_stellar.js
│   └── generate_report.js
└── results/             ← saída
```

---

## 7. Metodologia (resumo)

- **Variável:** latência E2E em ms = `t_submit → t_validated`.
- **Amostra padrão:** 50 transações sequenciais por rede.
- **Memo:** UETR (Unique End-to-End Transaction Reference) — campo do padrão ISO 20022.
- **Estatísticas:** mínimo, máximo, média, desvio padrão, p50, p90, p95, p99.

**Limitações reconhecidas:**

- Testnet pode apresentar latência diferente da mainnet (menor número de validadores).
- Execução sequencial → TPS observado é inferior ao TPS teórico da rede.
- Amostra n = 20 → análise descritiva, não inferencial.

---

## 8. Segurança

- 100% **Testnet** — XRP e XLM sem valor monetário real.
- Carteiras geradas em tempo de execução e descartadas após o teste.
- Nenhuma credencial pessoal é utilizada.

---

## 9. Referências oficiais

- XRPL: https://xrpl.org/docs/
- XRPL Faucet: https://xrpl.org/resources/dev-tools/xrp-faucets
- Stellar: https://developers.stellar.org/docs/
- Friendbot (Stellar): https://friendbot.stellar.org
- ISO 20022 UETR: https://www.iso20022.org/

---

*Grupo TCC — Engenharia da Computação UAM 2026.*
