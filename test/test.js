var tape    = require('tape');
var Machete = require('../index');
var http    = require('http');
var fs      = require('fs');
var path    = require('path');

function createServer(port) {
  var server = http.createServer(function(req, res) {
    switch (req.url) {
      case '/happy':
        res.writeHead(200, { 'Content-type': 'application/json' });
        fs.createReadStream(path.join(__dirname, 'test.json')).pipe(res);
        break;
      case '/happy_html':
        res.writeHead(200, { 'Content-type': 'text/html' });
        fs.createReadStream(path.join(__dirname, 'test.html')).pipe(res);
        break;
      case '/error':
        res.writeHead(500);
        res.end();
        break;
    }
  });
  server.listen(port);
  return server;
}

tape('JSON is parsed correctly', function(test) {
  var server = createServer(9000);
  var machete = new Machete('http://localhost:9000/happy');

  test.plan(3);

  machete.on('error', function(err) {
    test.fail('error should not be emitted');
  });

  machete.on('done', function(results) {
    test.equal(results.firstname, 'brandon');
    test.equal(results.lastname, 'farmer');
    test.equal(results.company, 'hashrocket');
  });

  machete.get();

  test.on('end', function() {
    server.close();
  });
});

tape('JSON is parsed correctly with filter', function(test) {
  var server = createServer(9002);
  var machete = new Machete('http://localhost:9002/happy');

  machete.setFilter(function(data) {
    return { fullname: data.firstname + " " + data.lastname };
  });

  test.plan(1);

  machete.on('error', function(err) {
    test.fail('error should not be emitted');
  });

  machete.on('done', function(results) {
    test.deepEqual(results, { fullname: 'brandon farmer' });
  });

  machete.get();

  test.on('end', function() {
    server.close();
  });
});

tape('gets raw response', function(test) {
  var server = createServer(9001);
  var machete = new Machete('http://localhost:9001/happy_html', true);

  test.plan(1);

  machete.on('error', function(err) {
    test.fail('error should not be emitted');
  });

  machete.on('done', function(result) {
    var opts = {
      encoding: 'utf8'
    };
    test.equal(result, fs.readFileSync(path.join(__dirname, 'test.html'), opts));
  });

  machete.get();

  test.on('end', function() {
    server.close();
  });
});

tape('non responsive site returns error', function(test) {
  var machete = new Machete('http://localhost:9000');

  test.plan(1);

  machete.on('error', function(err) {
    test.ok(true, 'error was emitted');
  });

  machete.on('done', function(results) {
    test.fail('done should not be emitted');
  });

  machete.get();
});
