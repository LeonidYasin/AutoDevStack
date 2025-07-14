import { InferenceClient } from "@huggingface/inference";

async function main() {
  const token = process.env.HF_TOKEN;
  console.log('HF_TOKEN:', token?.slice(0, 8) + '...' + token?.slice(-4));

  const client = new InferenceClient(token);

  // Попробуем получить провайдера через chatCompletion (SDK сам пишет в stdout, но добавим явный вывод)
  const chatCompletion = await client.chatCompletion({
    model: "deepseek-ai/DeepSeek-V3-0324",
    messages: [
      {
        role: "user",
        content: "How many 'G's in 'huggingface'?",
      },
    ],
  });

  // SDK пишет провайдера в stdout, но если появится поле provider — выведем
  if ((chatCompletion as any).provider) {
    console.log('Provider:', (chatCompletion as any).provider);
  }

  console.log(chatCompletion.choices[0].message);
}

main(); 