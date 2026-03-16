export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const rdResponse = await fetch("https://api.rd.services/auth/token", {
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

    const responseText = await rdResponse.text();

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = { raw: responseText };
    }

    if (!rdResponse.ok) {
      return res.status(rdResponse.status).json({
        error: "Erro ao renovar token da RD",
        rd_status: rdResponse.status,
        rd_status_text: rdResponse.statusText,
        details: parsed
      });
    }

    return res.status(200).json({
      success: true,
      message: "Token renovado com sucesso",
      rd: parsed
    });
  } catch (error) {
    return res.status(500).json({
      error: "Erro interno ao renovar token",
      details: error.message
    });
  }
}