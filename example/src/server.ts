import { app } from './app.ts'
import { setupDb } from './seed.ts'

await setupDb()
const port = Number(process.env.PORT ?? 3000)
app.listen(port, () => console.log(`listening on http://localhost:${port}`))
