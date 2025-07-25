import { generateText, tool } from 'ai';
import { togetherai } from '@ai-sdk/togetherai';
import { z } from 'zod';
 
export async function getWeather() {
  const { text } = await generateText({
    model: togetherai('meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8'),
    prompt: 'What is the weather in San Francisco?',
    maxSteps: 2,
    tools: {
      weather: tool({
        description: 'Get the weather in a location',
        parameters: z.object({
          location: z.string().describe('The location to get the weather for'),
        }),
        execute: async ({ location }) => ({
          location,
          temperature: 72 + Math.floor(Math.random() * 21) - 10,
        }),
      }),
      activities: tool({
        description: 'Get the activities in a location',
        parameters: z.object({
          location: z
            .string()
            .describe('The location to get the activities for'),
        }),
        execute: async ({ location }) => ({
          location,
          activities: ['hiking', 'swimming', 'sightseeing'],
        }),
      }),
    },
  });
  console.log(text);
}