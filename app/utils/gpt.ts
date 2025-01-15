import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function calculateTaxEstimate(
  transactions: any[],
  userProfile: {
    country: string;
    region: string;
    annual_income: number;
  }
) {
  const prompt = `
    As a tax expert, analyze these cryptocurrency transactions and provide a tax estimate.
    Country: ${userProfile.country}
    Region: ${userProfile.region}
    Annual Income: ${userProfile.annual_income}
    
    Transaction History:
    ${JSON.stringify(transactions, null, 2)}
    
    Please provide:
    1. Estimated capital gains/losses
    2. Tax implications based on the jurisdiction
    3. Potential deductions
    4. Overall tax estimate
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a cryptocurrency tax expert who provides tax estimates based on transaction history and jurisdiction."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error getting GPT tax estimate:', error);
    throw error;
  }
} 