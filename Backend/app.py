from flask import Flask, request, jsonify
import requests
from flask_cors import CORS
import openai
from msal import ConfidentialClientApplication
import os

app = Flask(__name__)
CORS(app)

# Power BI API base URL
power_bi_api_url = "https://api.powerbi.com/v1.0/myorg/"

# Power BI Dataset ID (replace with your dataset ID)
dataset_id = "7dc5bc3a-f114-425b-b52d-6687e0a5309f"

# Database schema
database_schema = """
Table Name: Orders
Column Names:
- Row ID
- Order ID
- Order Date
- Ship Date
- Ship Mode
- Customer ID
- Customer Name
- Segment
- Postal Code
- City
- State
- Country
- Region
- Market
- Product ID
- Category
- Sub-Category
- Product Name
- Sales
- Quantity
- Discount
- Profit
- Shipping Cost
- Order Priority
==================================================
Table Name: DateTableTemplate_63c0bf72-9990-4bd5-9b82-4fa0de5f9d85
Column Names:
- Date
- Year
- MonthNo
- Month
- QuarterNo
- Quarter
- Day
==================================================
Table Name: LocalDateTable_7cbdfdb1-9886-4947-94fd-d2e397639e1e
Column Names:
- Date
- Year
- MonthNo
- Month
- QuarterNo
- Quarter
- Day
==================================================
Table Name: People
Column Names:
- Person
- Region
==================================================
Table Name: Returns
Column Names:
- Returned
- Order ID
- Region
==================================================
Table Name: Parameter
Column Names:
- Parameter
- Parameter Fields
- Parameter Order
==================================================
Table Name: Dates
Column Names:
- Date
==================================================
Table Name: LocalDateTable_a71237d4-872e-405d-8be0-1044d381b37d
Column Names:
- Date
- Year
- MonthNo
- Month
- QuarterNo
- Quarter
- Day
==================================================
Table Name: Report KPI
Column Names:
==================================================

"""


def fetch_access_token():
    # Service principal configuration
    cid = os.getenv("CLIENT_ID")
    csecret = os.getenv("CLIENT_SECRET")
    tid = os.getenv("TENANT_ID")
    auth = f"https://login.microsoftonline.com/{tid}"

    app = ConfidentialClientApplication(
        client_id=cid, client_credential=csecret, authority=auth
    )

    scopes = ["https://analysis.windows.net/powerbi/api/.default"]

    result = app.acquire_token_for_client(scopes=scopes)
    access_token = result.get("access_token")
    print(access_token)
    return access_token


# Initialize chat history
chat_history = []


# Function to execute a query in Power BI dataset
def execute_query(query, access_token):
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}",
    }

    # Specify the dataset ID and the query
    url = f"{power_bi_api_url}datasets/{dataset_id}/executeQueries"

    # Define the request body
    request_body = {"queries": [{"query": query}]}

    # Send the POST request with the request body
    response = requests.post(url, headers=headers, json=request_body)

    if response.status_code == 200:
        result = response.json()
        return result
    else:
        return {"error": f"Error {response.status_code}: {response.text}"}


def intentclassifier(user_input):
    global chat_history
    openai.api_type = "azure"
    openai.api_base = "https://maqbotpoc.openai.azure.com/"
    openai.api_version = "2024-04-01-preview"
    openai.api_key = os.getenv("AZURE_OPEN_AI_INTENT_CLASSIFIER")

    message_text = [
        {
            "role": "system",
            "content": f"You need to identify the visual requested by the user from the user's question. If there is any visual requested by the user then respond with the appropriate visual ID from the below list else simply respond 0.\nList of charts:\n1. Area Chart = 1\n2. Bar Chart = 2\n3. Line Chart = 3\n4. Pie Charts = 4\n\nFor examples:\nUser: Show me the profit based on categories  \nAssistant: 0\n\nUser: Show me the profit based on categories in a pie chart\nAssistant: 4",
        },
        *chat_history,
        {"role": "user", "content": user_input},
    ]

    completion = openai.ChatCompletion.create(
        engine="PMMCalendar",
        messages=message_text,
        temperature=0.7,
        max_tokens=800,
        top_p=0.95,
        frequency_penalty=0,
        presence_penalty=0,
        stop=None,
    )

    # Add user message to chat history
    chat_history.append({"role": "user", "content": user_input})

    # Extract the content from the completion response
    content = completion["choices"][0]["message"]["content"]

    # Add assistant message to chat history
    chat_history.append({"role": "assistant", "content": content})

    return content


def azureopenaicall(user_input):
    global chat_history
    openai.api_type = "azure"
    openai.api_base = "https://pmmworkspace.openai.azure.com/"
    openai.api_version = "2024-05-01-preview"
    openai.api_key = os.getenv("AZURE_OPEN_AI_DAX_QUERY_GENERATOR")

    message_text = [
        {
            "role": "system",
            "content": f"You are a DAX query generator. Only generate the DAX query without any additional characters\n You can make use the expressions used by various measures to understand the data and it's underlying working more clearly. \nRemove all the ' ' before generating the DAX query. Do not add \ while generating the DAX queries. \n Remember to use EVALUATE while generating the DAX query as it is going to be executed via a POWER BI REST API call. \n Only use the tables and the columns provided to you. \n\n {database_schema}",
        },
        *chat_history,
        {"role": "user", "content": user_input},
    ]

    completion = openai.ChatCompletion.create(
        engine="PMMWorkspace",
        messages=message_text,
        temperature=0,
        max_tokens=800,
        top_p=0.95,
        frequency_penalty=0,
        presence_penalty=0,
        stop=None,
    )

    # Add user message to chat history
    chat_history.append({"role": "user", "content": user_input})

    # Extract the content from the completion response
    content = completion["choices"][0]["message"]["content"]

    # Add assistant message to chat history
    chat_history.append({"role": "assistant", "content": content})

    return content


def react_component_ai(user_input):

    global chat_history
    openai.api_type = "azure"
    openai.api_base = "https://maqbotpoc.openai.azure.com/"
    openai.api_version = "2024-04-01-preview"
    openai.api_key = os.getenv("AZURE_OPEN_AI_REACT_COMPONENT_GENERATOR")

    message_text = [
        {
            "role": "system",
            "content": 'You are a ReactJS Expert, you need to create a static component with proper labeling based on the data received from the JSON input and the user question given to you by the user.\nYour output should **ONLY** be the labels and datasets fields for each react component provided below. You need to identify the JSON data and generate the labels and the datasets fields accordingly.\n\n### COMPONENT ID MAPPING ###\nList of charts:\n1. Area Chart = 1\n2. Bar Chart = 2\n3. Line Chart = 3\n4. Pie Charts = 4\n\nRemember you might need to dynamically change the below components based on the data used to.\n### AREA CHART REACT COMPONENT ###\nlabels: data.map((item) => truncateLabel(`<Based on the input JSON>`)),\ndatasets: [\n{\n        label:  <Based on the input JSON>,\n        data: data.map((item) => item.<Based on the input JSON>),\n        fill: true,\n        backgroundColor: "rgba(75, 192, 192, 0.2)",\n        borderColor: "rgba(75, 192, 192, 1)",\n        tension: 0.1,\n      },\n    ],\n\n### BAR CHART REACT COMPONENT ###\nlabels: data.map((item) =>  truncateLabel(`<Based on the input JSON>`)),\n    datasets: [\n        {\n        label: `<Based on the input JSON>`,\n        data: data.map((item) => item.<Based on the input JSON>),\n        backgroundColor: \'rgba(75, 192, 192, 0.2)\',\n        borderColor: \'rgba(75, 192, 192, 1)\',\n        borderWidth: 1,\n        },\n    ],\n\n### LINE CHART REACT COMPONENT ###\n    labels: data.map((item) =>  truncateLabel(`<Based on the input JSON>`)),\n    datasets: [\n      {\n        label: <Based on the input JSON>,\n        data: data.map((item) => item.<Based on the input JSON>),\n        borderColor: "rgba(75, 192, 192, 1)",\n        backgroundColor: "rgba(75, 192, 192, 0.2)",\n        borderWidth: 1,\n        tension: 0.4,\n      },\n    ],\n\n### PIE CHART REACT COMPONENT ###\nlabels:  truncateLabel(`<Based on the input JSON>`)),\ndatasets: [\n    {\n    label: <Based on the input JSON>,\n    data: data.map((item) => item.<Based on the input JSON>),\n    backgroundColor: [\n        \'rgba(255, 99, 132, 0.2)\',\n        \'rgba(54, 162, 235, 0.2)\',\n        \'rgba(255, 206, 86, 0.2)\',\n        \'rgba(75, 192, 192, 0.2)\',\n        \'rgba(153, 102, 255, 0.2)\',\n        \'rgba(255, 159, 64, 0.2)\',\n    ],\n    borderColor: [\n        \'rgba(255, 99, 132, 1)\',\n        \'rgba(54, 162, 235, 1)\', \n        \'rgba(255, 206, 86, 1)\',\n        \'rgba(75, 192, 192, 1)\',\n        \'rgba(153, 102, 255, 1)\',\n        \'rgba(255, 159, 64, 1)\',\n    ],\n    borderWidth: 1,\n    },\n],\n\nYou will receive a JSON object in the below structure with the component ID.\n{\n    "daxquery": "EVALUATE TOPN(5, SUMMARIZECOLUMNS(Orders[Country], \\"Total Profit\\", SUM(Orders[Profit])), [Total Profit], DESC)",\n    "result": {\n        "results": [\n            {\n                "tables": [\n                    {\n                        "rows": [\n                            {\n                                "Orders[Country]": "France",\n                                "[Total Profit]": 109029.003\n                            },\n                            {\n                                "Orders[Country]": "India",\n                                "[Total Profit]": 129050.595\n                            },\n                            {\n                                "Orders[Country]": "United Kingdom",\n                                "[Total Profit]": 111900.15\n                            },\n                            {\n                                "Orders[Country]": "United States",\n                                "[Total Profit]": 286397.0217\n                            },\n                            {\n                                "Orders[Country]": "China",\n                                "[Total Profit]": 150683.085\n                            }\n                        ]\n                    }\n                ]\n            }\n        ]\n    }\n}\n\n\n\nOutput:\n\n labels: data.map((item) => truncateLabel(item["Orders[Country]"])),  \n    datasets: [  \n      {  \n        label: "Total Profit",  \n        data: data.map((item) => item["[Total Profit]"]),  \n        borderColor: "rgba(75, 192, 192, 1)",  \n        backgroundColor: "rgba(75, 192, 192, 0.2)",  \n        borderWidth: 1,  \n        tension: 0.4,  \n      },  \n    ],  \n',
        },
        {
            "role": "user",
            "content": 'User question: Show me the top 5 profit based on countries    \nData:    \n{    \n    "daxquery": "EVALUATE TOPN(5, SUMMARIZECOLUMNS(Orders[Country], \\"Total Profit\\", SUM(Orders[Profit])), [Total Profit], DESC)",    \n    "result": {    \n        "results": [    \n            {    \n                "tables": [    \n                    {    \n                        "rows": [    \n                            {    \n                                "Orders[Country]": "France",    \n                                "[Total Profit]": 109029.003    \n                            },    \n                            {    \n                                "Orders[Country]": "India",    \n                                "[Total Profit]": 129050.595    \n                            },    \n                            {    \n                                "Orders[Country]": "United Kingdom",    \n                                "[Total Profit]": 111900.15    \n                            },    \n                            {    \n                                "Orders[Country]": "United States",    \n                                "[Total Profit]": 286397.0217    \n                            },    \n                            {    \n                                "Orders[Country]": "China",    \n                                "[Total Profit]": 150683.085    \n                            }    \n                        ]    \n                    }    \n                ]    \n            }    \n        ]    \n    }    \n}',
        },
        {
            "role": "assistant",
            "content": "labels: data.map((item) => truncateLabel(item[\"Orders[Country]\"])),  \ndatasets: [  \n  {  \n    label: \"Total Profit\",  \n    data: data.map((item) => item[\"[Total Profit]\"]),  \n    backgroundColor: [\n        'rgba(255, 99, 132, 0.2)',\n        'rgba(54, 162, 235, 0.2)',\n        'rgba(255, 206, 86, 0.2)',\n        'rgba(75, 192, 192, 0.2)',\n        'rgba(153, 102, 255, 0.2)',\n        'rgba(255, 159, 64, 0.2)',\n    ],\n    borderColor: [\n        'rgba(255, 99, 132, 1)',\n        'rgba(54, 162, 235, 1)', \n        'rgba(255, 206, 86, 1)',\n        'rgba(75, 192, 192, 1)',\n        'rgba(153, 102, 255, 1)',\n        'rgba(255, 159, 64, 1)',\n    ],\n    borderWidth: 1,\n  },  \n],",
        },
        {"role": "user", "content": user_input},
    ]

    completion = openai.ChatCompletion.create(
        engine="PMMCalendar",
        messages=message_text,
        temperature=0,
        max_tokens=4096,
        top_p=0.95,
        frequency_penalty=0,
        presence_penalty=0,
        stop=None,
    )

    # Extract the content from the completion response
    content = completion["choices"][0]["message"]["content"]

    return content


@app.route("/api", methods=["POST"])
def execute_query_route():
    # Extract user input from the request body
    user_input = request.get_json().get("message")
    access_token = fetch_access_token()
    print("AccessToken", access_token)
    intent_classifier = intentclassifier(user_input)
    daxquery = azureopenaicall(user_input)
    daxquery = daxquery.replace("\\", "")
    print(daxquery)
    result = execute_query(daxquery, access_token)
    print(result)
    if intent_classifier != "0":
        react_component = react_component_ai(str(result))
    else:
        react_component = ""

    return jsonify(
        {
            "result": result,
            "daxquery": daxquery,
            "react_component": react_component,
            "intent_classifier": intent_classifier,
        }
    )


# Route for the root URL
@app.route("/")
def index():
    return "Web App with Python Flask!"


if __name__ == "__main__":
    app.run(debug=True)
