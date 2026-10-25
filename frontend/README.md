# CAFE ERP — Interface

Aplicação React + Vite. Para executar, instale as dependências (`npm ci`) e rode `npm run dev` com a API disponível em `http://localhost:3000/api/v1`.

Configure `VITE_API_URL` para apontar a interface a outra URL de API. O login usa `/auth/login`; o seletor de centros carrega os centros autorizados e envia o centro selecionado no cabeçalho `X-Center-ID`. A área de administração permite gerenciar usuários, papéis, centros e atribuições.

As telas operacionais ainda usam dados demonstrativos locais em memória; suas alterações não são persistidas no backend.
