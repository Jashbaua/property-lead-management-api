import 'dotenv/config'; 
import express, { Request, Response } from 'express';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import propertyRoutes from './routes/property.routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/auth', authRoutes);
app.use('/properties', propertyRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello world');
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});