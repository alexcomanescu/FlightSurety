const http = require("http");
const app = require("./server");

let port = 3000;

app.app.listen(port, () => {
  console.log(`Server app listening at http://localhost:${port}`);
});
