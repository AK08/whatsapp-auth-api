require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// async function sendTemplateMessage() {
//     const response = await axios({
//         url: 'https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages',
//         method: 'post',
//         headers: {
//             'Authorization' : `Bearer ${process.env.WHATSAPP_TOKEN}`,
//             'Content-Type' : 'application/json'
//         },
//         data: JSON.stringify({
//             messaging_product: 'whatsapp',
//             to: process.env.WHATSAPP_PHONE,
//             type: 'template',
//             template:{
//                 name: 'discount',
//                 language: {
//                     code: 'en_US'
//                 }
//             }
//         })
//     })
//     console.log(response.data)
// }

// sendTemplateMessage()

// app.post('/test', async (req, res) => {
//     try {
//         await sendTemplateMessage();
//         res.status(200).send({ message: 'successfully!' });
//     } catch (error) {
//         res.status(500).send({ error: 'Failed.' });
//     }
// });


const otpStore = {};

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000); 
}

// Send Authentication template to WhatsApp Number
async function sendWhatsAppOTP(phoneNumber, otp) {
    try {
        const response = await axios({
            url: `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
            method: 'post',
            headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json',
            },
            data: JSON.stringify({
                messaging_product: 'whatsapp',
                to: phoneNumber,
                type: 'template',
                template: {
                    name: 'auth', 
                    language: { code: 'en' },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: otp.toString() }, 
                            ],
                        },
                        {
                            type: 'button',
                            sub_type: 'url', 
                            index: 0, 
                            parameters: [
                                { type: 'text', text: otp.toString() }, 
                            ],
                        },
                    ],
                },
            }),
        });
        return response.data;
    } catch (error) {
        console.error('Error sending WhatsApp message:', error.response?.data || error.message);
        throw new Error('Failed to send OTP.');
    }
}

// Endpoint to request OTP
app.post('/send-otp', async (req, res) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
        return res.status(400).send({ error: 'Phone number is required.' });
    }

    const otp = generateOTP(); 
    otpStore[phoneNumber] = otp; 

    try {
        await sendWhatsAppOTP(phoneNumber, otp);
        res.status(200).send({ message: 'OTP sent successfully!' });
    } catch (error) {
        res.status(500).send({ error: 'Failed to send OTP.' });
    }
});

// Endpoint to verify OTP
app.post('/verify-otp', (req, res) => {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
        return res.status(400).send({ error: 'Phone number and OTP are required.' });
    }

    const storedOTP = otpStore[phoneNumber];
    if (storedOTP && storedOTP === parseInt(otp)) {
        delete otpStore[phoneNumber]; 
        return res.status(200).send({ message: 'OTP verified successfully!' });
    }

    res.status(400).send({ error: 'Invalid OTP.' });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
