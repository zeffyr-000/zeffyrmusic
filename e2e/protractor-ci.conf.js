const config = require('./protractor.conf').config;

config.capabilities = {
    browserName: 'chrome',
    chromeOptions: {
        args: ['--headless', '--no-sandbox']
    }
};

config.baseUrl = 'https://next.zeffyrmusic.com/',

exports.config = config;