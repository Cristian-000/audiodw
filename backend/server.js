const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/generar-mp3', (req, res) => {
    const { texto, idioma } = req.body;
    if (!texto) return res.status(400).json({ error: "Falta texto" });

    // La clave es el parámetro 'tl' (Target Language)
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${idioma}&q=${encodeURIComponent(texto)}`;

    const opciones = {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' }
    };

    https.get(url, opciones, (googleRes) => {
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `attachment; filename="audio_${idioma}_${Date.now()}.mp3"`);
        googleRes.pipe(res);
    }).on('error', (e) => res.status(500).send(e.message));
});

app.listen(process.env.PORT || 3000);