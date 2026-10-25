"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function bootstrap() {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        throw new Error('Configure JWT_SECRET com pelo menos 32 caracteres antes de iniciar a API.');
    }
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    app.enableCors({
        origin: allowedOrigins,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🚀 ERP PME Backend em execução na porta: ${port}`);
    console.log(`📡 Endpoints disponíveis sob o prefixo: http://localhost:${port}/api/v1`);
}
bootstrap();
//# sourceMappingURL=main.js.map