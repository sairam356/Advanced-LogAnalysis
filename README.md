# LogAnalysis
# LogAnalysis using open AI LLM Application


The application leverages several advanced technologies, including Pinecone for vector storage, OpenAI for embeddings, LangChain for query analysis, and the RAQ technique for optimized querying.



# Technologies Used:

 

Node.js: Core programming environment.

Pinecone DB: Vector storage for managing embeddings.

OpenAI:  Generation of embeddings for text data.

LangChain: Processing and analyzing query responses.

RAQ Technique: Enhances the querying process for efficiency.

 

# API Functionalities

# 1. Save API   Endpoint: /save     Method: POST
Description: Handles the ingestion of log data, processes the text, and stores the resultant embeddings in Pinecone DB.

# Process Flow:

Receive Logs: load the log data from text or we can implement Kibana API

Text Splitting: Utilizes a recursive text splitter to segment the input text.

Embedding: Transforms the segmented text into embeddings.
Storage: Saves the embeddings in PineconeDB for future retrieval.

  

# 2. Analyze API  Endpoint: /analyze  Method: POST

Description: Analyzes the query by embedding it and retrieving relevant data from Pinecone DB to formulate a response.

# Process Flow:Receive Query: Accepts a text query as input.

Embedding: Generates embeddings for thequery using OpenAI.

Vector Querying: Queries Pinecone DB with the generated embeddingsto retrieve related data.

Load QA Chain: Processes the retrieved data through LangChain'sloadQAStuffChain.

Response Generation: Delivers the final response based on the processedquery.

# Output ScreenShots :


<img width="511" alt="Screenshot 2024-04-21 000419" src="https://github.com/sairam356/LogAnalysis/assets/18064754/f9c63bb7-43c5-4aef-8bcb-62bc00bad224">


<img width="556" alt="Screenshot 2024-04-21 000357" src="https://github.com/sairam356/LogAnalysis/assets/18064754/b7acaeb7-d112-47cf-bb2d-ea459d69a10f">!




![output_loading_emddingInfo](https://github.com/sairam356/LogAnalysis/assets/18064754/b09ae79d-9ca5-45b6-a050-f70b13c3351f)


