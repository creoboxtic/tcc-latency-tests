param(
    [Parameter(Mandatory = $true)]
    [int]$Rodada
)

$ErrorActionPreference = 'Stop'
$repo = 'D:\OneDrive\DevOps\tcc-latency-tests'
Set-Location $repo

$logDir = Join-Path $repo 'results\logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$logFile = Join-Path $logDir "rodada_$Rodada.log"

"=== Rodada $Rodada — inicio: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz') ===" | Tee-Object -FilePath $logFile

$env:RODADA = "$Rodada"
docker compose up --build 2>&1 | Tee-Object -FilePath $logFile -Append

$csvX = Join-Path $repo "results\resultados_xrpl_r$Rodada.csv"
$csvS = Join-Path $repo "results\resultados_stellar_r$Rodada.csv"
$md   = Join-Path $repo "results\relatorio_final_r$Rodada.md"

if (-not (Test-Path $csvX) -or -not (Test-Path $csvS) -or -not (Test-Path $md)) {
    "ERRO: arquivos esperados nao foram gerados." | Tee-Object -FilePath $logFile -Append
    exit 1
}

$stamp = Get-Date -Format 'dd/MM/yyyy HH\hmm'
$msg = "data: resultados Rodada $Rodada — $stamp CEST"

git add $csvX $csvS $md 2>&1 | Tee-Object -FilePath $logFile -Append
git -c user.email=creobox.desenho@gmail.com -c user.name=creoboxtic commit -m $msg 2>&1 | Tee-Object -FilePath $logFile -Append
git push 2>&1 | Tee-Object -FilePath $logFile -Append

"=== Rodada $Rodada — fim: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz') ===" | Tee-Object -FilePath $logFile -Append
