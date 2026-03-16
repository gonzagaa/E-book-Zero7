export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { nome, email, telefone, tempo } = req.body || {};

    if (!nome || !email || !telefone || !tempo) {
      return res.status(400).json({
        error: "Campos obrigatórios ausentes",
      });
    }

    const payload = {
      event_type: "CONVERSION",
      event_family: "CDP",
      payload: {
        conversion_identifier: "LP - E-book Day Trade",
        name: nome,
        email,
        personal_phone: telefone,
        cf_tempo_operando_day_trade: tempo,
      },
    };

    // Observação:
    // O endpoint oficial é /platform/conversions.
    // Se sua conta estiver usando autenticação por API Key nessa rota,
    // valide no painel/docs do RD se a chave entra por query string
    // ou pelo formato específico de autenticação da conta.
    const rdResponse = await fetch(
      `https://api.rd.services/platform/conversions?api_key=${encodeURIComponent(process.env.RD_STATION_API_KEY)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const text = await rdResponse.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!rdResponse.ok) {
      return res.status(rdResponse.status).json({
        error: "RD Station retornou erro",
        details: data,
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Erro interno",
      details: error.message,
    });
  }
}