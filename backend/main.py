from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from langchain import hub
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from stripe_agent_toolkit.langchain.toolkit import StripeAgentToolkit
import logging

logger = logging.getLogger(__name__)

app = FastAPI()

# Enable CORS for all origins in development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables
load_dotenv()

# Initialize LangChain components
llm = ChatOpenAI(
    model="gpt-3.5-turbo",
    api_key=os.getenv("OPENAI_API_KEY"),
)

stripe_agent_toolkit = StripeAgentToolkit(
    secret_key=os.getenv("STRIPE_SECRET_KEY"),
    configuration={
        "actions": {
            "payment_links": {
                "create": True,
                "name": "create_payment_link"
            },
            "products": {
                "create": True,
                "name": "create_product",
                "description": True,
                "metadata": True
            },
            "prices": {
                "create": True,
                "name": "create_price",
                "currency": True,
                "unit_amount": True
            }
        }
    },
)

# Initialize tools array and modify tool names
tools = []
temp_tools = stripe_agent_toolkit.get_tools()

for tool in temp_tools:
    if tool.name == 'Create Product':
        tool.name = 'create_product'
    elif tool.name == 'Create Price':
        tool.name = 'create_price'
    elif tool.name == 'Create Payment Link':
        tool.name = 'create_payment_link'
    tools.append(tool)

# Replace the agent creation (around line 68) with this:
prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a helpful assistant that creates Stripe payment links.
    When given a request, always follow these steps in order:
    1. Create a product using create_product with a clear name and description
    2. Create a price using create_price with the specified amount
    3. Create a payment link using create_payment_link
    Return only the final payment link URL."""),
    ("human", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad"),
])

agent = create_openai_functions_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools)

class PaymentRequest(BaseModel):
    message: str

@app.post("/generate-payment-link")
async def generate_payment_link(request: PaymentRequest):
    try:
        logger.info(f"Starting payment link generation for request: {request.message}")
        
        result = agent_executor.invoke({
            "input": f"""Create a payment link for this request: {request.message}
            Follow these steps exactly:
            1. Create a product based on the request
            2. Create a price for that product
            3. Create and return a payment link
            
            Return ONLY the payment link URL."""
        })
        
        if isinstance(result, dict) and "output" in result:
            payment_link = result["output"].strip()
            logger.info(f"Successfully generated payment link: {payment_link}")
            return {"success": True, "link": payment_link}
        
        raise ValueError("Invalid response format from agent")
        
    except Exception as e:
        logger.error(f"Error generating payment link: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# For local development
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)