import os
import json
import base64
from typing import Dict, Optional, List
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from langchain.agents import AgentExecutor, create_react_agent
from langchain.tools import tool
from langchain_aws import ChatBedrock
from langchain_aws.retrievers import AmazonKnowledgeBasesRetriever
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser
from langchain import hub

import boto3
from database.database import get_dynamodb_resource

load_dotenv()

KNOWLEDGE_BASE_ID = os.getenv("KNOWLEDGE_BASE_ID")
AWS_REGION = os.getenv("AWS_REGION")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

if not all([KNOWLEDGE_BASE_ID, AWS_REGION, S3_BUCKET_NAME]):
    raise ValueError("One or more required environment variables are missing.")

bedrock_runtime = boto3.client("bedrock-runtime", region_name=AWS_REGION)
s3_client = boto3.client("s3", region_name=AWS_REGION)

llm = ChatBedrock(
    model_id="amazon.nova-pro-v1:0", 
    client=bedrock_runtime,
    model_kwargs={"temperature": 0.3, "maxTokenCount": 512}, 
)

# --- helper function to filter by S3 folder ---
def _filter_docs_by_source(retrieved_docs, source_type: Optional[str]):
    if not source_type:
        return retrieved_docs
    filtered = []
    for doc in retrieved_docs:
        s3_uri = doc.metadata.get("location", {}).get("s3Uri", "")
        if source_type == "textbook" and "textbook/" in s3_uri:
            filtered.append(doc)
        elif source_type == "exam_paper" and "exam_paper/" in s3_uri:
            filtered.append(doc)
    return filtered


# --- 2. Define Agent Tools ---

@tool
def query_study_material(query: str) -> Dict:
    """
    Use this tool to answer general questions or explain topics.
    Based on both textbooks and exam papers.
    """
    print(f"--- Calling Study Material Tool with query: {query} (textbook + exam_paper) ---")

    retriever = AmazonKnowledgeBasesRetriever(
        knowledge_base_id=KNOWLEDGE_BASE_ID,
        retrieval_config={"vectorSearchConfiguration": {"numberOfResults": 5}},  # fetch a bit more
    )
    retrieved_docs = retriever.invoke(query)

    # Use all docs (textbook + exam_paper), no filtering
    resources = []
    for doc in retrieved_docs:
        loc = doc.metadata.get("location", {})
        s3_uri = loc.get("s3Uri", "Unknown")
        resources.append({
            "content": doc.page_content,
            "metadata": doc.metadata,
            "s3Uri": s3_uri
        })

    text_context = "\n\n".join([doc.page_content for doc in retrieved_docs])

    if not text_context:
        return {
            "agent": "study_material",
            "response": {"text": "No relevant textbook or exam paper material found.", "resources": []}
        }

    prompt_template = PromptTemplate(
        template=(
            "Answer the user's question based on the following textbook and exam paper context.\n\n"
            "Context:\n{context}\n\nQuestion: {question}\n\n"
            "IMPORTANT: Reply ONLY in English or Bahasa Melayu."
        ),
        input_variables=["context", "question"],
    )

    rag_chain = prompt_template | llm | StrOutputParser()
    text_response = rag_chain.invoke({"context": text_context, "question": query})

    return {
        "agent": "study_material",
        "response": {"text": text_response, "resources": resources},
    }




@tool
def create_quiz(subject: str) -> Dict:
    """Create a NEW exam-style quiz based on subject, using both textbook and exam paper context.
    The quiz should always be exam-style but with rephrased/new questions.
    """
    print(f"--- Calling Quiz Tool with subject: {subject} ---")

    retriever = AmazonKnowledgeBasesRetriever(
        knowledge_base_id=KNOWLEDGE_BASE_ID,
        retrieval_config={"vectorSearchConfiguration": {"numberOfResults": 4}},
    )
    retrieved_docs = retriever.invoke(subject)

    context = "\n\n".join([doc.page_content for doc in retrieved_docs])

    if not context:
        return {"agent": "quiz_creator", "response": {"error": "No relevant material found."}}

    parser = JsonOutputParser()
    prompt = PromptTemplate(
        template=(
            "You are a quiz generator.\n\n"
            "Reference material (from textbooks and exam papers):\n{context}\n\n"
            "Task: Create a 3-question multiple-choice quiz for subject: {subject}.\n\n"
            "Rules:\n"
            "- Always mimic EXAM STYLE (formal, testing knowledge).\n"
            "- Do NOT copy directly; rephrase into NEW questions.\n"
            "- Each question must have 4 options (A–D).\n"
            "- Clearly indicate the correct answer.\n"
            "- Return ONLY valid JSON.\n\n"
            "{format_instructions}"
        ),
        input_variables=["context", "subject"],
        partial_variables={"format_instructions": parser.get_format_instructions()},
    )

    quiz_chain = prompt | llm | parser
    quiz = quiz_chain.invoke({"context": context, "subject": subject})

    return {"agent": "quiz_creator", "response": {"quiz": quiz}}


@tool
def generate_image(prompt: str) -> Dict:
    """Use this tool when a user asks for a NEW diagram, picture, or image of something."""
    print(f"--- Calling Image Tool with prompt: {prompt} ---")
    full_prompt = f"Educational diagram, {prompt}. Clean, simple, high quality."

    request_body = json.dumps({
        "text_prompts": [{"text": full_prompt}],
        "cfg_scale": 10,
        "steps": 50,
    })
    response = bedrock_runtime.invoke_model(
        body=request_body, modelId="stability.stable-diffusion-xl-v1"
    )
    response_body = json.loads(response.get("body").read())
    base64_image = response_body.get("artifacts")[0].get("base64")

    return {"agent": "image_generator", "response": base64_image}


# --- 3. Create the Agent and Agent Executor ---
tools = [query_study_material, create_quiz, generate_image]
agent_prompt = hub.pull("hwchase17/react")
agent = create_react_agent(llm, tools, agent_prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True, handle_parsing_errors=True)


# --- 4. FastAPI Application ---
app = FastAPI()

class OrchestratorRequest(BaseModel):
    query: str

@app.post("/api/orchestrator")
async def handle_orchestration(request: OrchestratorRequest):
    try:
        instruction = (
            "IMPORTANT: Reply ONLY in English or Bahasa Melayu.\n\n"
            f"User query: {request.query}"
        )
        response = agent_executor.invoke({"input": instruction})
        return {"success": True, "output": response["output"]}
    except Exception as e:
        print(f"An error occurred: {e}")  
        raise HTTPException(status_code=500, detail=str(e))

