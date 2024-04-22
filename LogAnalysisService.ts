import { OpenAI } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import * as dotevnv from "dotenv";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Pinecone } from '@pinecone-database/pinecone';
import { loadQAStuffChain } from "langchain/chains";
import * as fs from 'fs';
import { Document } from "langchain/document";

export class LogAnalysisService {


  constructor() {

  }


  public async loadAndStoreDataInVectorDB(): Promise<any> {

    const llm = new OpenAI({ openAIApiKey: process.env.OPENAI_API_KEY });

    const logData = await fs.readFileSync('log.txt', { encoding: 'utf-8' });

    await this.processChunk(logData);
    return Promise.resolve({ "stauts": "success" });
  }


  public async analyzeLogs(query: string): Promise<any> {

    const openAILLM = new OpenAI({ openAIApiKey: process.env.OPENAI_API_KEY });

    const pc = new Pinecone({
      apiKey: '<>',
    });


    const indexName = 'openote';

    const index = pc.index(indexName);

    const queryData: string = query.replace(/\n/g, " ");
    const queryEmbedding = await new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY, modelName: 'text-embedding-ada-002', stripNewLines: true }).embedQuery(queryData);

    console.log(queryEmbedding);
    let queryResponse = await index.query({
      vector: queryEmbedding,
      topK: 3,
      includeValues: true,
      includeMetadata: true,
    });

    const concatenatedText = queryResponse.matches
      .map((match) => match.metadata?.text)
      .join(" ");

    console.log(`Concatenated Text: ${concatenatedText}`);


    const chain = loadQAStuffChain(openAILLM);

    const result = await chain.call({
      input_documents: [new Document({ pageContent: concatenatedText })],
      question: query,
    });

    console.log(result);

    console.log(`Answer: ${result.text}`);

    return Promise.resolve({ "answer": result.text });
  }

  public async processChunk(chunk: string): Promise<any> {

    const embeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY, modelName: 'text-embedding-ada-002' });

    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 300, chunkOverlap: 0 });

    const splittedText = await textSplitter.splitText(chunk);

    console.log(splittedText.length);


    for (let i = 0; i < splittedText.length; i += 1000) {
      const records = splittedText.slice(i, i + 1000);
      await this.chunkBychunkEmmeding(embeddings, records);

    }

  }


  public async chunkBychunkEmmeding(embeddings: OpenAIEmbeddings, splittedText: string[]): Promise<void> {

    const pc = new Pinecone({
      apiKey: '<>',
    });

    const indexName = 'openote';

    const index = pc.index(indexName);

    for (let i = 0; i < splittedText.length; i += 500) {
      // Create a chunk by slicing the array from the current index i up to i + batchSize
      const chunk = splittedText.slice(i, i + 500);

      // Embed the documents in the current chunk
      const scheduleEmbeddings = await embeddings.embedDocuments(chunk);
      console.log(scheduleEmbeddings);
      console.log("length of embeddings: " + scheduleEmbeddings.length);

      // Map embeddings to a structure suitable for upserting into the index
      const scheduleVectors = scheduleEmbeddings.map((embedding, index) => ({
        id: chunk[index],  // Ensure the ID matches the correct document in the chunk
        values: embedding,
        metadata: {
          text: chunk[index]
        }
      }));

      //
      console.log(scheduleVectors);

      // Upsert the chunk of vectors into the index
      await index.upsert(scheduleVectors);
    }
  }


  public async preprocessdata(jsonLogString: string){
      // Parse the JSON string to an object
      let logObject = JSON.parse(jsonLogString);
  
      // Extract fields from the parsed JSON
      let timestamp = logObject.timestamp;
      let level = logObject.level;
      let uniqueReferenceCode = logObject.uniqueReferenceCode;
      let message = logObject.message;
  
      // Normalize and clean up the message for better formatting
      message = message.replace(/\s+/g, ' ').trim(); // Normalize whitespace
  
      // Build the final formatted log string using the custom delimiter '#'
      let formattedLog = `${timestamp} # loglevel:${level} # urc:${uniqueReferenceCode} #message : ${message}`;
  
      // Optional: If there's an additional 'source' field in the message, extract and append it
      let sourceMatch = message.match(/source=([A-Z]+)/);
      if (sourceMatch && sourceMatch[1]) {
          formattedLog += ` # source:${sourceMatch[1]}`;
      }
  
      return formattedLog;
  }
