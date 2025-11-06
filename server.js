import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// essas duas linhas são obrigatórias pra __dirname funcionar em módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// serve os arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, "public")));

// qualquer rota desconhecida manda pro index.html (resolve 404 no frontend)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 Servidor rodando na porta ${PORT}`));
