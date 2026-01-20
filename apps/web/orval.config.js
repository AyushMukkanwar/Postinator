module.exports = {
  uploader: {
    input: {
      target: 'http://localhost:3001/docs-json',
    },
    output: {
      mode: 'tags-split',
      target: 'lib/api/generated.ts',
      schemas: 'lib/api/model',
      client: 'react-query',
      override: {
        mutator: {
          path: 'lib/api/mutator/custom-instance.ts',
          name: 'customInstance',
        },
      },
    },
  },
};
