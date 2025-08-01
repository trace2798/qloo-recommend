# Rec & Sight

Rec & Sight is a web application that offers recommendations and indepth insight based on Qloo's data.

## Features

Recommendation: Get recommendation of based on Qloo's data with LLM.
Insight: Get indepth Analysis of an Qloo Entity. 
Places: Discover places theat local loves. 

## Technologies Used

Frontend: Next.js 15.
Backend: Modus hosted on Hypermode for a robust backend infrastructure.
Data Sources:
Qloo APIs.
AI Model: Meta Llama 3.3 and Llama 4 to generate response to users. 

## Installation

Clone the Repository

```code
git clone https://github.com/trace2798/qloo-recommend.git
```

Navigate to the Project Directory

```code
cd qloo-recommend
```

## Install Dependencies

```code
npm install
```

Set Up Environment Variables

Create a .env file in the root directory and add the following:

```code

QLOO_API_KEY=""
QLOO_BASE_URL=""
OPENROUTER_API_KEY=""

TURSO_DATABASE_URL=""
TURSO_AUTH_TOKEN=""
BETTER_AUTH_SECRET=""
BETTER_AUTH_URL="http://localhost:3000" 


GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

```
After adding all the endpoints. Run the following command to set the DB
```code

npx drizzle-kit generate
nox drizzle-kit migrate

```


Run the Application

```code
    npm run dev
```

## Access the Application

Open your browser and navigate to http://localhost:3000.

Usage
After login you will be redirected to the dashboard. From there click on any of the 3 options to test it out.

License

This project is licensed under the MIT License.
