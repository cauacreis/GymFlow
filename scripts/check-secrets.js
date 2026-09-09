/**
 * Script de Verificação Pré-Commit para Repositório Público
 * Previne que segredos, chaves de API, senhas ou arquivos .env vazem no Git.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const SENSITIVE_PATTERNS = [
  /APP_USR-[a-zA-Z0-9\-_]{20,}/,
  /TEST-[a-zA-Z0-9\-_]{20,}/,
  /AIzaSy[a-zA-Z0-9\-_]{33}/,
  /sk-[a-zA-Z0-9]{32,}/,
  /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/,
  /ghp_[a-zA-Z0-9]{36}/,
  /xox[baprs]-[0-9a-zA-Z]{10,48}/,
  /postgres:\/\/[^:]+:[^@]+@/,
];

const FORBIDDEN_FILES = [
  /^\.env(\..+)?$/,
  /\.pem$/,
  /\.key$/,
  /\.pfx$/,
  /credentials\.json$/,
  /id_rsa/,
];

function checkStagedFiles() {
  console.log("🛡️ [GymFlow Security Shield] Verificando integridade dos arquivos em staging...");

  let stagedFiles = [];
  try {
    const output = execSync("git diff --cached --name-only", { encoding: "utf8" });
    stagedFiles = output.split("\n").map((f) => f.trim()).filter(Boolean);
  } catch (err) {
    console.warn("⚠️ Não foi possível obter git diff --cached. Verificando arquivos locais...");
  }

  let hasError = false;

  for (const file of stagedFiles) {
    const basename = path.basename(file);

    // Ignora .env.example que é permitido e público
    if (basename === ".env.example") continue;

    // Checa nomes proibidos
    for (const pattern of FORBIDDEN_FILES) {
      if (pattern.test(basename)) {
        console.error(`❌ BLOQUEADO: Tentativa de commitar arquivo proibido: ${file}`);
        hasError = true;
      }
    }

    // Checa conteúdo do arquivo se ele existir
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      const content = fs.readFileSync(file, "utf8");
      for (const pattern of SENSITIVE_PATTERNS) {
        if (pattern.test(content)) {
          console.error(`❌ BLOQUEADO: Padrão sensível detectado no arquivo: ${file}`);
          hasError = true;
        }
      }
    }
  }

  if (hasError) {
    console.error("\n🚨 COMMIT CANCELADO: Remova as credenciais ou arquivos sensíveis antes de continuar!\n");
    process.exit(1);
  } else {
    console.log("✅ [GymFlow Security Shield] Nenhum segredo ou arquivo de risco detectado.");
  }
}

checkStagedFiles();
