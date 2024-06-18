const express = require('express');
const bodyParser = require('body-parser');
const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot');
require('dotenv').config();

const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MockAdapter = require('@bot-whatsapp/database/mock');

// Definir preguntas frecuentes
const faq = [
    { question: "Hola, ¿cómo estás?", answer: "Estoy bien, gracias. ¿Cómo puedo ayudarte hoy?" },
    { question: "¿Cuál es tu nombre?", answer: "Soy un chatbot creado para asistirte con tus consultas." },
    { question: "¿Cómo puedo sacar un turno?", answer: "Puedes decirme tu nombre, mail y motivo de consulta, para agendarte un turno." },
    // Agrega más preguntas y respuestas según sea necesario
];
// Palabras clave y respuestas
const keywords = [
    { keyword: 'hola', answer: '¡Hola! ¿Cómo puedo ayudarte hoy?' },
    { keyword: 'turno', answer: 'Para sacar un turno, por favor proporciona tu nombre, correo electrónico y motivo de consulta.' },
    { keyword: 'precio', answer: 'Los precios pueden variar según el tratamiento. Por favor, contáctanos para más información.' },
    { keyword: 'horario', answer: 'Nuestro horario de atención es de lunes a viernes de 9:00 am a 6:00 pm.' }
    // Puedes agregar más palabras clave y respuestas aquí
];
// Función para buscar en las preguntas frecuentes
const findAnswerInFAQ = (userQuestion) => {
    const faqEntry = faq.find(faqItem => faqItem.question.toLowerCase() === userQuestion.toLowerCase());
    return faqEntry ? faqEntry.answer : null;
};

const flowPrincipal = addKeyword(['hola', 'Hola', 'ole', 'alo'])
    .addAnswer('Hola bienvenido a este *Chatbot*', { capture: true }, async (ctx, { flowDynamic }) => {
        try {
            const userQuestion = ctx.body;
            
            // Busca la respuesta en las preguntas frecuentes
            const faqAnswer = findAnswerInFAQ(userQuestion);
            if (faqAnswer) {
                await flowDynamic(faqAnswer);
            } else {
                // No responder si no se encuentra en las FAQs
                console.log('No se encontró una respuesta válida para:', userQuestion);
                // Aquí no se envía ninguna respuesta al usuario
            }
        } catch (error) {
            console.error('Error handling user question:', error);
            // Aquí tampoco se envía una respuesta de error al usuario
        }
    });

const main = async () => {
    const adapterDB = new MockAdapter();
    const adapterFlow = createFlow([flowPrincipal]);
    const adapterProvider = createProvider(BaileysProvider);

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    adapterProvider.on('qr', qr => {
        console.log('Escanea este código QR para iniciar sesión:', qr);
    });

    adapterProvider.on('open', () => {
        console.log('Conexión establecida exitosamente.');
    });

    adapterProvider.on('close', ({ reason, isReconnecting }) => {
        console.log(`Conexión cerrada, razón: ${reason}. Reintentando: ${isReconnecting}`);
    });

    QRPortalWeb();
};

main();

const app = express();
app.use(bodyParser.json());

app.post('/message', async (req, res) => {
    const { message } = req.body;
    const ctx = { body: message };
    try {
        // Procesa el mensaje utilizando el flujo principal del bot
        const faqAnswer = findAnswerInFAQ(message);
        if (faqAnswer) {
            res.json({ response: faqAnswer });
        } else {
            // No responder si no se encuentra en las FAQs
            console.log('No se encontró una respuesta válida para:', message);
            res.json({ response: null });
        }
    } catch (error) {
        console.error('Error handling user question:', error);
        res.status(500).json({ error: 'Lo siento, ocurrió un error. Por favor intenta de nuevo más tarde.' });
    }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
    

