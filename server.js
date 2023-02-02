const express = require('express');
const app = express();
const { FAKE_SERVER_PORT = 5000 } = process.env;
const fakeData = require('./index');

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept'
    );
    next();
});

app.use((req, res) => {
    if (!req.query.fields) {
        req.query.fields = [
            'timestamp',
            'region:US,EU,RU',
            'email:internet.email',
            'ip:internet.ip',
            'browser:internet.userAgent',
        ];
    }

    const data = fakeData(req.query);

    res.send(data);
    res.end();
});

app.listen(FAKE_SERVER_PORT, (err) => {
    if (err) {
    }
});
