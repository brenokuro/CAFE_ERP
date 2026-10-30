import { createApp } from './create-app';

async function bootstrap() {
  const app = await createApp();
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`ERP PME Backend em execução na porta: ${port}`);
  console.log(`Endpoints disponíveis sob o prefixo: http://localhost:${port}/api/v1`);
}

bootstrap();
