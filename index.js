var hyperquest    = require('hyperquest');
var TaxCollector  = require('tax_collector');

function fallThrough(data) {
  return data;
}

function Machete(url, raw) {
  this.url = url;
  this.raw = raw;
  this.setFilter(fallThrough);
}

(require('util')).inherits(Machete, (require('events').EventEmitter));

Machete.prototype.setFilter = function(filter) {
  if (filter)
    this.filter = filter;
  return this;
}

Machete.prototype.get = function() {
  var req = hyperquest(this.url);

  req.on('error', this._errored.bind(this));
  req.on('response', function(res) {
    if (res.statusCode != 200) {
      this._errored('STATUS CODE -- ' + res.statusCode);
      return;
    }
    this._process(res);
  }.bind(this));
  return this;
}

Machete.prototype._collect = function(data) {
  if (!this.raw)
    data = JSON.parse(data);
  process.nextTick(function() {
    this.emit('done', this.filter(data));
  }.bind(this));
};

Machete.prototype._process = function(res) {
  var collector = new TaxCollector(res);
  collector.on('ready', this._collect.bind(this));
}

Machete.prototype._errored = function(err) {
  process.nextTick(function() {
    this.emit('error', 'Failed to get data -- ERROR: ' + err);
  }.bind(this));
}

module.exports = Machete;
