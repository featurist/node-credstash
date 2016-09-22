const AWS = require('aws-sdk');
const async = require('async');
const https = require('https');

const agent = new https.Agent({
  rejectUnauthorized: true,
  keepAlive: true,
  ciphers: 'ALL',
  secureProtocol: 'TLSv1_method'
});

function find(table, name, options, done) {
  var params = {
    TableName: table || 'credential-store',
    ConsistentRead: true,
    Limit: options.limit,
    ScanIndexForward: false,
    KeyConditions: {
      name: {
        ComparisonOperator: 'EQ',
        AttributeValueList: [{
          S: name
        }]
      }
    }
  };

  return new AWS.DynamoDB({
    httpOptions: { agent: agent }
  }).query(params, done);
}

function list(table, options, done) {
  var params = {
    TableName: table || 'credential-store',
    ConsistentRead: true,
  };

  return new AWS.DynamoDB({
    httpOptions: { agent: agent }
  }).scan(params, done);
}

function mapSingle(name, data, done) {
  if (!data.Items || data.Items.length === 0) {
    return done(new Error('secret not found: ' + name));
  }

  var result = data.Items.map(item => ({
    key: item.key.S,
    hmac: item.hmac.S,
    contents: item.contents.S
  }));

  return done(null, result);
}

function map(data, done) {
  if (!data.Items || data.Items.length === 0) {
    return done(new Error('secret not found: ' + name));
  }

  var result = data.Items.map(item => ({
    name: item.name.S,
    key: item.key.S,
    hmac: item.hmac.S,
    contents: item.contents.S
  }));

  return done(null, result);
}

module.exports = {
  get: (table, name, options, done) => {
    return async.waterfall([
      async.apply(find, table, name, options),
      async.apply(mapSingle, name),
    ], done);
  },

  list: (table, options, done) => {
    return async.waterfall([
      async.apply(list, table, options),
      async.apply(map),
    ], done);
  }
};
