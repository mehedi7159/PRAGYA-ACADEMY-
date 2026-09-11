const base64Gif = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

fetch('http://localhost:3000/api/extract-student', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ imageBase64: base64Gif, mimeType: 'image/gif' })
})
.then(async r => {
  console.log("Status:", r.status);
  console.log("Text:", await r.text());
})
.catch(e => console.error("Fetch error:", e));
