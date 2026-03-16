async function refreshAccessToken() {
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

  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(
      `Falha ao renovar token RD (${response.status} ${response.statusText}): ${text || "resposta vazia"}`
    );
  }

  return data;
}

async function sendConversionToRD(accessToken, rdBody) {
  const response = await fetch("https://api.rd.services/platform/events?event_type=conversion", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "accept": "application/json",
      "Authorization": `Bearer ${accessToken}`
    },
    body: JSON.stringify(rdBody)
  });

  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    data
  };
}

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
    const { nome, email, telefone, tempo } = req.body || {};

    if (!nome || !email || !telefone || !tempo) {
      return res.status(400).json({
        error: "Dados obrigatórios ausentes"
      });
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const telefoneLimpo = String(telefone).replace(/\D/g, "");

    if (!emailValido) {
      return res.status(400).json({ error: "E-mail inválido" });
    }

    if (telefoneLimpo.length < 10) {
      return res.status(400).json({ error: "Telefone inválido" });
    }

    const rdBody = {
      event_type: "CONVERSION",
      event_family: "CDP",
      payload: {
        conversion_identifier: process.env.RD_CONVERSION_IDENTIFIER,
        email: email.trim(),
        name: nome.trim(),
        mobile_phone: telefoneLimpo,
        cf_tempo_operando_day_trade: tempo
      }
    };

    // 1) tenta com o access token atual
    let rdResult = await sendConversionToRD(process.env.RD_ACCESS_TOKEN, rdBody);

    // 2) se token expirou / auth falhou, tenta renovar e reenviar
    if (!rdResult.ok && (rdResult.status === 401 || rdResult.status === 403)) {
      const refreshed = await refreshAccessToken();

      if (!refreshed.access_token) {
        return res.status(500).json({
          error: "RD renovou o token, mas não retornou access_token",
          details: refreshed
        });
      }

      rdResult = await sendConversionToRD(refreshed.access_token, rdBody);

      // opcional: expõe o novo token só para você ver no log/inspecionar
      // não mostrar isso no frontend em produção aberta
      if (!rdResult.ok) {
        return res.status(rdResult.status).json({
          error: "Erro ao enviar lead para o RD mesmo após renovar token",
          rd_status: rdResult.status,
          rd_status_text: rdResult.statusText,
          details: rdResult.data
        });
      }

      return res.status(200).json({
        success: true,
        refreshed_token_used: true,
        new_access_token: refreshed.access_token,
        new_refresh_token: refreshed.refresh_token || null,
        rd: rdResult.data
      });
    }

    if (!rdResult.ok) {
      return res.status(rdResult.status).json({
        error: "Erro ao enviar lead para o RD Station",
        rd_status: rdResult.status,
        rd_status_text: rdResult.statusText,
        details: rdResult.data
      });
    }

    return res.status(200).json({
      success: true,
      refreshed_token_used: false,
      rd: rdResult.data
    });
  } catch (error) {
    return res.status(500).json({
      error: "Erro interno no servidor",
      details: error.message
    });
  }
}