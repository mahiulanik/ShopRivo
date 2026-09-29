import ErrorHandler from "../middlewares/errorMiddleware.js";


const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [500, 1500];
const REQUEST_TIMEOUT_MS = 30000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


// Returns the successful Response, or null when every attempt failed.
const requestWithRetry = async (url, body) => {

    let lastFailure = null;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {

        if (attempt > 0) {
            await sleep(RETRY_DELAYS_MS[attempt - 1]);
        }

        let response;

        try {

            const controller = new AbortController();
            const timeout = setTimeout(
                () => controller.abort(),
                REQUEST_TIMEOUT_MS
            );

            try {
                response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body,
                    signal: controller.signal,
                });
            } finally {
                clearTimeout(timeout);
            }

        } catch (error) {
            lastFailure = error?.message || String(error);
            continue;
        }

        if (response.ok) {
            return response;
        }

        const errorData = await response.text();
        lastFailure = `HTTP ${response.status}: ${errorData}`;

        // 4xx errors (bad key, bad request) will not succeed on a retry.
        if (!RETRYABLE_STATUS_CODES.has(response.status)) {
            break;
        }
    }

    console.error(
        `Gemini API unavailable after ${MAX_ATTEMPTS} attempt(s). Last error:`,
        lastFailure
    );

    return null;
};


export const getAIRecommendation = async (
    userPrompt,
    products
) => {

    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
        throw new ErrorHandler(
            "Gemini API key is missing.",
            500
        );
    }


    if (!products?.length) {
        return [];
    }


    const URL =
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${API_KEY}`;


    const productData = products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        ratings: product.ratings,
        stock: product.stock,
    }));


    const prompt = `
You are a product recommendation system for an e-commerce website.

User request:
"${userPrompt}"

Available products:
${JSON.stringify(productData)}

Select the products that best match the user's request.

Rules:
- Recommend only products from the provided list.
- Never invent products or product IDs.
- Never modify product IDs.
- Consider name, description, category, price, rating, and stock.
- Respect the user's budget when one is specified.
- Do not recommend out-of-stock products unless the user explicitly asks for them.
- Return only the matching product IDs.
`;


    const response = await requestWithRetry(
        URL,
        JSON.stringify({
            contents: [
                {
                    parts: [
                        {
                            text: prompt,
                        },
                    ],
                },
            ],

            generationConfig: {
                responseMimeType: "application/json",

                responseSchema: {
                    type: "ARRAY",
                    items: {
                        type: "STRING",
                    },
                },
            },
        })
    );


    // Model is overloaded / unreachable: signal the caller to fall back.
    if (!response) {
        return null;
    }


    const data = await response.json();

    const aiResponse =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;


    if (!aiResponse) {
        console.error(
            "Gemini returned an empty response:",
            JSON.stringify(data)
        );
        return null;
    }


    try {

        const recommendedIds =
            JSON.parse(aiResponse);

        if (!Array.isArray(recommendedIds)) {
            return [];
        }


        const validProductIds = new Set(
            products.map(
                (product) => product.id
            )
        );


        return recommendedIds.filter(
            (id) =>
                typeof id === "string" &&
                validProductIds.has(id)
        );

    } catch (error) {

        console.error(
            "Failed to parse AI recommendation:",
            error?.message
        );

        return null;
    }
};
