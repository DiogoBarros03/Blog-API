const { Client } = require('@elastic/elasticsearch');

const client = new Client({ node: 'http://localhost:9200' });

async function createIndex() {
  try {
    await client.indices.create({
      index: 'users',
      body: {
        mappings: {
          properties: {
            id: { type: 'integer' },
            name: { type: 'text' },
            email: { type: 'text' },
          },
        },
      },
    });
    console.log('Users index created');
  } catch (error) {
    console.error('Error creating users index:', error);
  }
}

module.exports = {
  client,
  createIndex
};
