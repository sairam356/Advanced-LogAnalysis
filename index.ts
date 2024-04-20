import express, { Request, Response } from "express"
import * as dotevnv from "dotenv";
import cors from "cors";
import helmet from "helmet"
import { LogAnalysisService } from './LogAnalysisService';
import { StatusCodes } from "http-status-codes"
dotevnv.config()

const PORT = 9191;

const app = express()
app.use(express.json())

app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use(helmet())



app.get("/save", async (req: Request, res: Response) => {

    const serviceObj: LogAnalysisService = new LogAnalysisService();

    await serviceObj.loadAndStoreDataInVectorDB();

    return res.status(StatusCodes.OK).send({});

});

app.post("/analyze", async (req: Request, res: Response) => {

    const serviceObj: LogAnalysisService = new LogAnalysisService();
    const query = req.body.query;
    const response = await serviceObj.analyzeLogs(query);
    return res.status(StatusCodes.OK).send(response);

})
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`)
})


