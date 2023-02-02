const MockAdapter = require('axios-mock-adapter');
const fakeData = require('./index');
const url = require('url');
const qs = require('query-string');

const mockAxios = (axios, config) => {
    const mock = new MockAdapter(axios, config);

    mock.onGet(/\/fake-data/).reply((config) => {
        const { query } = url.parse(config.url);
        const params = qs.parse(query);
        return [200, fakeData(params)];
    });

    mock.onGet(/\/network-error/).networkError();
    mock.onGet(/\/timeout/).timeout();

    mock.onAny().passThrough();

    return mock;
};

module.exports = mockAxios;
