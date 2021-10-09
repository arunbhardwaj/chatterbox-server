const fs = require('fs');
const path = require('path');
const url = require('url');

const writeToFile = (JSONtext) => {
  fs.writeFile('./server/content/chatMessages.txt', JSONtext, (err, result) => {
    if (err) {
      console.log(err);
      return;
    }
  });
};

const getQuery = (url) => {
  var index1 = url.indexOf('?');
  var index2 = url.indexOf('=');
  const query = url.slice(index1 + 1, index2);
  const queryValue = url.slice(index2 + 1);
  // console.log('queryies', query, queryValue);
  return [query, queryValue];
};


// These headers will allow Cross-Origin Resource Sharing (CORS).
// This code allows this server to talk to websites that
// are on different domains, for instance, your chat client.
//
// Your chat client is running from a url like file://your/chat/client/index.html,
// which is considered a different domain.
//
// Another way to get around this restriction is to serve you chat
// client from this domain by setting up static file serving.
var defaultCorsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'access-control-allow-headers': 'content-type, accept, authorization',
  'access-control-max-age': 10 // Seconds.
};

const statusCodes = {
  'OK': 200,
  'ACCEPTED': 201,
  'NO_CONTENT': 204,
  'NOT_FOUND': 404,
};

const option = {
  'POST': {
    'description': 'Create a message',
    'parameters': {
      'username': {
        'type': 'string',
        'description': 'User posting message',
        'required': true,
      },
      'text': {
        'type': 'string',
        'description': 'Message body',
        'required': true,
      },
      'roomname': {
        'type': 'string',
        'description': 'Room this message should be assigned to.',
        'required': false,
      }
    },
    'example': {
      'username': 'alphakap',
      'text': 'I\'m having a problem with this.',
      'roomname': 'octocat',
    }
  }
};

let store = {
  results: [],
};

let _id = 0;

const _validRequests = ['GET', 'POST', 'OPTIONS'];

let ws = fs.createWriteStream('./server/content/chatMessages.txt');

var requestHandler = function(request, response) {
  // Request and Response come from node's http module.
  //
  // They include information about both the incoming request, such as
  // headers and URL, and about the outgoing response, such as its status
  // and content.
  //
  // Documentation for both request and response can be found in the HTTP section at
  // http://nodejs.org/documentation/api/

  // Do some basic logging.
  //
  // Adding more logging to your server can be an easy way to get passive
  // debugging help, but you should always be careful about leaving stray
  // console.logs in your code.
  const { method } = request; // Getting url from here keepts the query params

  const _url = url.parse(request.url).pathname;

  const fullURL = request.headers.referer.slice(0, -1) + request.url;

  const _urlObj = new URL(fullURL);

  console.log('Serving request type ' + method + ' for url ' + request.url);
  let headers = defaultCorsHeaders;



  ///////////////////////////////
  // OPTION
  //////////////////////////////
  if (method === 'OPTIONS') {
    headers['Content-Type'] = 'application/json';
    response.writeHead(statusCodes.OK, headers);
    response.end();
    return;



  ////////////////////////////
  // GET
  ////////////////////////////
  } else if (method === 'GET' && _url === '/classes/messages/users') {
    // response.writeHead(statusCodes.OK, headers);
    // // Handle empty responses. Is that a 202 status code?
    const user = _urlObj.searchParams.get('user');
    let output = {
      results: [],
    };
    for (let message of store.results) {
      if (message.username === user) {
        output.results.push(message);
      }
    }
    response.writeHead(statusCodes.OK, headers);
    response.end(JSON.stringify(output));
    console.log(output);
    return;


  } else if (method === 'GET' && _url === '/classes/messages') {
    // response.flushHeaders();
    response.writeHead(statusCodes.OK, headers);
    // Handle empty responses. Is that a 202 status code?
    // if (store.results.length === 0) {
    //   response.statusCode = statusCodes.NO_CONTENT;
    //   response.end();
    //   return;
    // }
    response.end(JSON.stringify(store));
    return;


  //////////////////////
  // POST
  //////////////////////
  } else if (request.method === 'POST' && _url === '/classes/messages') {
    request.setEncoding('utf8');
    request.on('error', (err) => {
      console.error(err, 'there was an error');
    }).on('data', (chunk) => { // There is not data in a GET request
      console.log('chunk', chunk);
      store.results.push(JSON.parse(chunk));
      store.results[store.results.length - 1].id = _id;
      _id++;
    }).on('end', () => {
      // Always write headers before body
      response.writeHead(statusCodes.ACCEPTED, headers);
      response.end(JSON.stringify(store));
      console.log('query', request.query);
    });
    return;


  } else if (_url !== '/classes/messages' || !_validRequests.includes(method)) {
    response.writeHead(statusCodes.NOT_FOUND, headers);
    response.end(`${method} not accepted for ${_url}`);
  }

  // PUT
  // if (request.method === 'PUT' && request.url === '/api/messages') {
  //   response.write('PUT Request');
  //   response.end();
  // }


  // The outgoing status.
  // var statusCode = 200;

  // See the note below about CORS headers.
  // var headers = defaultCorsHeaders;

  // Tell the client we are sending them plain text.
  //
  // You will need to change this if you are sending something
  // other than plain text, like JSON or HTML.
  // headers['Content-Type'] = 'text/plain';

  // .writeHead() writes to the request line and headers of the response,
  // which includes the status and all headers.
  // response.writeHead(statusCode, headers);


  // Make sure to always call response.end() - Node may not send
  // anything back to the client until you do. The string you pass to
  // response.end() will be the body of the response - i.e. what shows
  // up in the browser.
  //
  // Calling .end 'flushes' the response's internal buffer, forcing
  // node to actually send all the data over to the client.
  // response.end('Hello, World!');
  response.end();
};

module.exports.requestHandler = requestHandler;