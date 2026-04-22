fetch("http://localhost:3000/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: "hi", history: [] })
}).then(async r => {
  console.log(r.status);
  console.log(await r.text());
});
