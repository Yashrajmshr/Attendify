# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## 🚀 Deployment (Cloud)

This project is configured for deployment on **Render**.

### Backend (Render Web Service)
1.  Connect GitHub Repo.
2.  Set Build Command: `npm install`
3.  Set Start Command: `node server.js`
4.  Add Environment Variables: `DATABASE_URL` (Neon PostgreSQL), `JWT_SECRET`.

### Frontend (Render Static Site)
1.  Connect GitHub Repo.
2.  Set Build Command: `npm run build`
3.  Set Publish Directory: `dist`
4.  Add Environment Variable: `VITE_API_URL` (Backend URL + `/api`).

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
