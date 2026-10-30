import { createApp } from '../src/create-app';

let appPromise: ReturnType<typeof createApp> | undefined;

export default async function handler(req: any, res: any) {
  appPromise ??= createApp().then(async (app) => {
    await app.init();
    return app;
  });

  const app = await appPromise;
  app.getHttpAdapter().getInstance()(req, res);
}
