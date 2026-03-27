import 'dotenv/config'; 
import express, { Request, Response } from 'express';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import { authenticate } from './middleware/auth.middleware';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/auth', authRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello world');
});

app.get('/test-auth', authenticate, (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Protected route',
    user: req.user 
  });
});


app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});