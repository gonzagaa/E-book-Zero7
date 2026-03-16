export default async function handler(req, res) {
  const { code, error, error_description } = req.query;

  if (error) {
    return res.status(400).send(`
      <h1>Erro na autorização RD</h1>
      <pre>${error}</pre>
      <pre>${error_description || ""}</pre>
    `);
  }

  return res.status(200).send(`
    <h1>Code recebido com sucesso</h1>
    <p>Copie este code:</p>
    <pre style="white-space: pre-wrap; word-break: break-all;">${code || "Nenhum code recebido"}</pre>
  `);
}