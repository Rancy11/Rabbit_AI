const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sales Insight Automator API',
      version: '1.0.0',
      description: 'Upload sales CSV/XLSX files and receive AI-generated summaries via email.',
      contact: {
        name: 'Rabbitt AI Engineering',
      },
    },
    servers: [
      {
        url: process.env.BACKEND_URL || 'http://localhost:4000',
        description: process.env.NODE_ENV === 'production' ? 'Production' : 'Local Development',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key for protected endpoints',
        },
      },
    },
  },
  apis: ['./src/routes/*.js', './src/index.js'],
};

module.exports = swaggerJsdoc(options);
