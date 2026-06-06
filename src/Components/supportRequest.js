export async function sendSupportRequest(payload) {
  const response = await fetch("/api/support", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "No se pudo enviar la solicitud.");
  }

  return data;
}
