const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Habilitar CORS para que el HTML pueda comunicarse con este servidor
app.use(cors());

// Esta es la ruta (API) a la que se va a conectar el Static Site
app.get('/api/estado', (req, res) => {
    res.json({
        mensaje: "¡Conexión exitosa! El Web Service está vivo y respondiendo.",
        fecha: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`Web Service corriendo en el puerto ${PORT}`);
});