async function test() {
  const body = new URLSearchParams();
  body.append("key", "2c67ea4f797ab16122ab7344c5a0f5dd");
  body.append("action", "services");

  const response = await fetch("https://motherpanel.com/api/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString(),
  });
  const text = await response.text();
  console.log(text.substring(0, 500));
}
test();
