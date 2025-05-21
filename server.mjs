import express from "express";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import path from "path";
import session from "express-session";
import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Inicializa dotenv
dotenv.config();

// Para __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cliente de Turso (SQLite remoto)
const db = createClient({
  url: process.env.TURSO_URL ?? "",
  authToken: process.env.TURSO_TOKEN ?? ""
})

const port = process.env.PORT ?? 3000
const app = express()

// Configurar sesión
app.use(session({
  secret: "clave-secreta-segura",
  resave: false,
  saveUninitialized: false,
}))

// Middleware para proteger bienvenido.html
app.use((req, res, next) => {
  if (req.path === "/bienvenido.html" && !req.session.usuario) {
    return res.redirect("/index.html")
  }
  next()
})

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

// Registro
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);

  try {
    await db.execute({
      sql: "INSERT INTO users (username, password) VALUES (?, ?)",
      args: [username, hash],
    });
    res.redirect("/bienvenido.html");
  } catch (err) {
    res.status(500).send("Error al registrar: " + err.message)
  }
})

// Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body

  try {
    const result = await db.execute({
      sql: "SELECT * FROM users WHERE username = ?",
      args: [username],
    })

    const user = result.rows[0]
    if (!user) return res.status(401).send("Usuario no encontrado")

    const valid = await bcrypt.compare(password, user.password)
    if (valid) {
      req.session.usuario = username
      res.redirect("/bienvenido.html")
    } else {
      res.status(401).send("Contraseña incorrecta")
    }
  } catch (err) {
    res.status(500).send("Error al iniciar sesión")
  }
})

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/index.html")
  })
})

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor en http://localhost: ${port}`)
})
