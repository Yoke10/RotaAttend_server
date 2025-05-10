import express  from 'express';
import cors from 'cors';
import 'dotenv/config'
import { connection } from './DB/mongo.js';
import { router } from './routes/Routes.js';
const app=express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));
connection();
app.listen(5000,()=>{
    console.log('sever is runnig on port 5000');
    
})

app.get('/',(req,res)=>{
    res.send('server is running good');
})

app.use('/',router)

