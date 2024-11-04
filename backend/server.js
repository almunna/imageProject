import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import imageRoutes from './routes/imageRoutes.js';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const __dirname = path.resolve();
const mongoUrl = process.env.MONGODB_URI;

console.log('MongoDB URI:', mongoUrl);  // Log the MongoDB URI for debugging
console.log('All Environment Variables:', process.env);  // Log all environment variables for debugging

if (!mongoUrl) {
    throw new Error('MONGODB_URI environment variable is not set.');
}

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? 'https://your-production-frontend.com' : 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl }),
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'Lax',
    }
}));

// Routes
app.use('/api', imageRoutes);

mongoose.connect(mongoUrl)
    .then(() => {
        console.log('MongoDB connected successfully');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });

app.use(express.static(path.join(__dirname, "/virtualPhotobooth/dist")));
app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "virtualPhotobooth", "dist", "index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error occurred:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});
