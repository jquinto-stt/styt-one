import { createApp } from './app.js'

const port = Number(process.env.PORT ?? 3001)

createApp().listen(port, () => {
  console.log(`[backend] escuchando en http://localhost:${port}`)
})
