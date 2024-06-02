# jnj-server-ts
JnJ Server with Typescript

# Install

```bash
# boot app
bootapp -l node -u jnjsoftko -n jnj-server-ts -d "JnJ Server with Typescript" -t bare-basic-ts

# npm install
npm i express
```

# Edit

> `src/index.ts`
```ts
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());

// ** Local
app.get('/hello', async (req, res) => {
  res.json({"hello": "world"});
})

// ** server port: 3000
app.listen(3000, () => {
  console.log('Listening on port 3000');
});
```

# build & start

```bash
yarn build

node dist/index.js
```

# check

```bash
http://localhost:3000/hello

# result
{"hello":"world"}
```

===

# Install
```bash
# 1개씩 link를 하면 마지막 것만 살아남음
npm link jnj-lib-base-ts jnj-lib-google-ts jnj-lib-notion-ts
```

# ERROR
```bash
Error [ERR_REQUIRE_ESM]: require() of ES Module C:\JnJ-soft\Developments\ModulDevelopments\Modules\Node\jnj-dev-lib-ts\builtin.js from C:\JnJ-soft\Developments\Modules\Node\jnj-server-ts\dist\index.js not supported.
Instead change the require of builtin.js in C:\JnJ-soft\Developments\Modules\Node\jnj-server-ts\dist\index.js to a dynamic import() which is available in all CommonJS modules.
```

# SOL

> tsconfig.json
```json
    "module": "esnext",
    "target": "esnext",
```