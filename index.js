import express, { text } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import multer from "multer";
import Note from "./nota.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./config/cloudinary.js";
import deleteRouter from "./delete.js";



dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'))
app.set("view engine", "ejs");
app.use("/delete-image", deleteRouter);


mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB conectado"))
.catch(err => console.log("Erro ao conectar no MongoDB:", err));

mongoose.connection.on('error', err => {
  console.error('Erro na conexão com MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB desconectado. Tentando reconectar...');
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).catch(err => console.error('Erro ao reconectar:', err));
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "nownote",
    allowed_formats: ["jpg", "jpeg", "png", "webp"]
  }
});

const upload = multer({ storage });

async function sendToTelegram(noteId) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_BOT_CHAT_ID;

  if (!token || !chatId) {
    console.error("Erro: Variáveis de ambiente do Telegram não configuradas.");
    return;
  }

  const link = `https://nownote.vercel.app/${noteId}`;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: `Criaram uma nota nova: \n${link}`,
        parse_mode: 'Markdown'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro na API do Telegram: ${errorData.description}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Falha ao enviar mensagem para o Telegram:", error.message);
  }
}

app.get("/", (req, res) => {
  res.render("home")
});



app.get("/:path", async (req, res) => {
  try {
    const { path } = req.params;
    
    let note = await Note.findOne({ path });
    if (!note) {
      note = new Note({ path, content: "", images: [] });
      await note.save();
      await sendToTelegram(path)
    }

    res.render("note", { note });
  } catch (error) {
    console.log('Erro 500:', error)
    res.status(500).send('Erro no servidor');
  }
});


app.post("/:path", upload.array("images", 5), async (req, res) => {
  const { path } = req.params;
  const { content } = req.body;

  const newImages = req.files.map(file => ({
    name: file.originalname,
    path: file.path || file.secure_url 
  }));

  let note = await Note.findOne({ path });

  if (!note) {
    note = new Note({ path, content, images: newImages });

    await note.save();

    await sendToTelegram(path);
  } else {
    note.content = content;
    note.images = [...(note.images || []), ...newImages];

    await note.save();
  }

  await note.save();
  res.redirect(`/${path}`);
});

app.listen(process.env.PORT, () => console.log(`Servidor rodando na porta ${process.env.PORT}`));
