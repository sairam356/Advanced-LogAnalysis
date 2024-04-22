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
    return Promise.resolve({"stauts":"success"});
  }


  public async analyzeLogs(query: string): Promise<any> {

    const openAILLM = new OpenAI({ openAIApiKey: process.env.OPENAI_API_KEY });

    const pc = new Pinecone({
      apiKey: "<pincone-key>",
    });


    const indexName = 'opennote';

    const index = pc.index(indexName);

    const queryData: string = query.replace(/\n/g, " ");
    const queryEmbedding = await new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY, modelName: 'text-embedding-ada-002',stripNewLines: true }).embedQuery(queryData);

    console.log(queryEmbedding);
    let queryResponse = await index.query({
      vector: queryEmbedding,
      topK: 1,
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

  public async moreSpliting(logData: string): Promise<string> {
    const headers = ['ERROR'];  // Define your log headers here

    const data: string = headers.join('|');
    const regex = new RegExp((data), 'g');
    const parts = logData.split(regex).slice(1);

    let chunks = [];
    for (let i = 0; i < parts.length; i += 2) {
      chunks.push(parts[i] + parts[i + 1]);
    }

    const results = await Promise.all(chunks.map(chunk => this.processChunk(chunk)));
    return results.join('\n\n');
  }
  public async processChunk(chunk: string): Promise<any> {

    const embeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY, modelName: 'text-embedding-ada-002' });

    const pc = new Pinecone({
      apiKey: "<pincone-key>",
    });

    const indexName = 'opennote';

    const index = pc.index(indexName);

    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 100, chunkOverlap: 0 });

    const splittedText = await textSplitter.splitText(chunk);

    console.log(splittedText);

    const scheduleEmbeddings = await embeddings.embedDocuments(splittedText);

    console.log(scheduleEmbeddings);

    console.log("length of embeddings: " + scheduleEmbeddings.length);

    const scheduleVectors = scheduleEmbeddings.map((embedding, i) => ({
      id: splittedText[i],
      values: embedding,
      metadata: {
        text: splittedText[i],
      }
    }));

     index.upsert(scheduleVectors);

  }


}
