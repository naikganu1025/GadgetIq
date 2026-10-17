/**
 * Client for interacting with deployed Neon Functions
 */
export async function invokeNeonHelloFunction() {
  const baseUrl = process.env.NEON_FUNCTION_HELLO_BASE_URL || "https://br-restless-bonus-b5lv55fi-hello.compute.c-7.us-east-2.aws.neon.tech";
  const url = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "text/plain, application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Neon Function returned status ${res.status}: ${res.statusText}`);
  }

  const text = await res.text();
  return {
    status: res.status,
    url,
    output: text.trim(),
  };
}
