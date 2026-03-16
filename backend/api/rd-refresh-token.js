export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const response = await fetch("https://api.rd.services/auth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "accept": "application/json"
      },
      body: JSON.stringify({
        client_id: process.env.RD_CLIENT_ID,
        client_secret: process.env.RD_CLIENT_SECRET,
        refresh_token: process.env.RD_REFRESH_TOKEN
      })
    });

    const responseText = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Erro ao renovar token RD",
        rd_status: response.status,
        rd_status_text: response.statusText,
        details: responseText || "Resposta vazia do RD"
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = { raw: responseText };
    }

    return res.status(200).json({
      success: true,
      message: "Novo token gerado com sucesso",
      rd: parsed
    });

  } catch (error) {
    return res.status(500).json({
      error: "Erro interno ao renovar token",
      details: error.message
    });
  }
}