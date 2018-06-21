
var fs = require('fs');
var plotlyUsername = 'brandon.sorgdrager';
var plotlyAPIKey = 'yew7eIPYfdLhAv2tgkk5';
var filePath = '\/home\/wytdev\/viki\/logs\/chart.png';
var plotly = require('plotly')(plotlyUsername, plotlyAPIKey);


var ALERTS, Alert, createNewAlert, cronAlert, cryptoCoins, cryptoPrice, cryptoSummary, difference, filterBy, formatCurrency, getBaseQuote, handleNewAlert, registerNewAlert, registerNewAlertFromBrain, sendGraph, storeAlertToBrain, syncAlerts, toTitleCase, unregisterAlert, updateAlertTimezone,
  hasProp = {}.hasOwnProperty,
  slice = [].slice;

cronAlert = require('cron').CronJob;

ALERTS = {};

createNewAlert = function(robot, pattern, room, user, message) {
  var alert, id;
  while ((id == null) || ALERTS[id]) {
    id = Math.floor(Math.random() * 1000000);
  }
  alert = registerNewAlert(robot, id, pattern, room, user, message);
  robot.brain.data.cronalert[id] = alert.serialize();
  return id;
};

registerNewAlertFromBrain = function(robot, id, pattern, user, channel, message, timezone) {
  return registerNewAlert(robot, id, pattern, user, channel, message, timezone);
};

storeAlertToBrain = function(robot, id, alert) {
  var envelope;
  robot.brain.data.cronalert[id] = alert.serialize();
  envelope = {
    user: alert.user,
    room: alert.room
  };
  return robot.send(envelope, "Alert " + id + " stored in brain asynchronously");
};

registerNewAlert = function(robot, id, pattern, room, user, message, timezone) {
  var alert;
  alert = new Alert(id, pattern, room, user, message, timezone);
  alert.start(robot);
  return ALERTS[id] = alert;
};

unregisterAlert = function(robot, id) {
  if (ALERTS[id]) {
    ALERTS[id].stop();
    delete robot.brain.data.cronalert[id];
    delete ALERTS[id];
    return true;
  }
  return false;
};

handleNewAlert = function(robot, msg, pattern, message) {
  var id;
  id = createNewAlert(robot, pattern, msg.message.room, msg.message.user, message);
  return msg.send("Alert " + id + " created");
};

updateAlertTimezone = function(robot, id, timezone) {
  if (ALERTS[id]) {
    ALERTS[id].stop();
    ALERTS[id].timezone = timezone;
    robot.brain.data.cronalert[id] = ALERTS[id].serialize();
    ALERTS[id].start(robot);
    return true;
  }
  return false;
};

syncAlerts = function(robot) {
  var alert, id, nonCachedAlerts, nonStoredAlerts, results;
  nonCachedAlerts = difference(robot.brain.data.cronalert, ALERTS);
  for (id in nonCachedAlerts) {
    if (!hasProp.call(nonCachedAlerts, id)) continue;
    alert = nonCachedAlerts[id];
    registerNewAlertFromBrain.apply(null, [robot, id].concat(slice.call(alert)));
  }
  nonStoredAlerts = difference(ALERTS, robot.brain.data.cronalert);
  results = [];
  for (id in nonStoredAlerts) {
    if (!hasProp.call(nonStoredAlerts, id)) continue;
    alert = nonStoredAlerts[id];
    results.push(storeAlertToBrain(robot, id, alert));
  }
  return results;
};

difference = function(obj1, obj2) {
  var alert, diff, id;
  diff = {};
  for (id in obj1) {
    alert = obj1[id];
    if (!(id in obj2)) {
      diff[id] = alert;
    }
  }
  return diff;
};



module.exports = function(robot) {

  robot.respond(/graph\b\s?(.*)\b\s(.*)/i, function(msg) {
    if (msg.match[1]) {
      pair = msg.match[1].trim();
      exchange = msg.match[2].trim();
    } else {
      pair = msg.match[2].trim();
      exchange = 'bitfinex';
    }
    console.log(pair);
    getChart(msg, exchange, pair, '30min', 'scatter', function(chartData){
      console.log(chartData);
    });

  });

  getChart = function (msg, exchange, pair, period, type) {
    //beforeTime = (new Date()).getTime();
    //afterTime = (new Date()).getTime() - (24 * 60 * 60 * 1000); //24 hours ago
    //parameters = JSON.stringify({ json: '{"params": [ {"periods":3600, "before":before, "after":after}]}' })


    msg.http("https://api.cryptowat.ch/markets/" + exchange + "/" + pair + "/ohlc").header('Accept', 'application/json').get()(function(err, res, body) {

      if (err) {
        msg.send("Oops! There was an error making the request :/");
        robot.logger.error(err);
        return console.log(err);
      } else {
        apiData = (JSON.parse(body)).result;
        if (!apiData) {
          msg.send(pair + " does not exist or there was a problem with the request");
        } else {

          //succesfully retreived data do something

          //translate text period into integer period
          switch (period) {
            case '15min':
              period = '900'
              break;
            case '30min':
              period = '1800'
              break;
            case 'hourly':
              period = '3600'
              break;
            case 'daily':
              period = '86400'
              break;

          }



          var layout = {
            title: pair.toUpperCase() + " on " + toTitleCase(exchange) ,
            showlegend: false,
            xaxis: {
              rangeselector: 'none',
              title: "Period: " + period,
              titlefont: {
                family: "Courier New, monospace",
                size: 18,
                color: "#7f7f7f"
              }
            },
            yaxis: {
              title: 'USD',
              titlefont: {
                family: "Courier New, monospace",
                size: 18,
                color: "#7f7f7f"
              }
            }
          };

          chartData = {};

          switch (type) {

            case 'scatter':
              // create chartData object place holders
              chartData.x = [];
              chartData.y = [];
              chartData.type = 'scatter';
              // loop through API data to populate the chart data arary
              for (candleData in apiData[period]) {
                timestamp = (new Date(apiData[period][candleData][0]*1000));
                close = apiData[period][candleData][4]
                chartData.x.push(timestamp);
                chartData.y.push(close);
              }
              break;

            case 'candle':
              // create chartData object place holders

              chartData.x = [];
              chartData.open = [];
              chartData.high = [];
              chartData.low = [];
              chartData.close = [];
              chartData.type = 'candlestick';

              chartData.decreasing = {line: {color: '#7F7F7F'}};
              chartData.increasing = {line: {color: '#17BECF'}};
              chartData.line = {color: 'rgba(31,119,180,1)'}

              // loop through API data to populate the chart data arary
              for (candleData in apiData[period]) {
                timestamp = (new Date(apiData[period][candleData][0]*1000));
                open = apiData[period][candleData][1]
                high = apiData[period][candleData][2]
                low = apiData[period][candleData][3]
                close = apiData[period][candleData][4]
                chartData.x.push(timestamp);
                chartData.open.push(open);
                chartData.high.push(high);
                chartData.low.push(low);
                chartData.close.push(close);
              }
              break;

          }








          // return chart data
          // DEFINE VARIABLES

          var displayName = pair.toUpperCase() + " on " + toTitleCase(exchange) + " at " + (Date.now()).toString();

          // DEFINE BASIC GRAPH DATA

          var figure = { 'data': [chartData], layout: layout };

          // DEFINE GRAPH OPTIONS
          var imgOpts = {
              format: 'png',
              width: 1000,
              height: 500
          };

          // GET IMAGE
          plotly.getImage(figure, imgOpts, function (error, imageStream) {
            if (error) return console.log (error);

            // OPEN FILE AND WRITE STREAM TO IT
            var fileStream = fs.createWriteStream(filePath);
            imageStream.pipe(fileStream);

            // UPLOAD FILE WHEN ITS FINISHED WRITING
            fileStream.on('finish', function () {

              // DEFINE UPLOAD OPTIONS
              var streamOpts = {
                file: fs.createReadStream(filePath),
                channels: msg.message.room,
                title: displayName
              };

              // UPLOAD FILE FROM DEFINE OPTIONS
              robot.adapter.client.web.files.upload(displayName, streamOpts, function(err, res) {
                if (err) {
                    msg.send('```' + err + '```');
                } else {
                    //console.log(res); // Uncomment to see API response
                }

              });

            });

          });

        }
      }
    });

  }







  var base1;
  (base1 = robot.brain.data).cronalert || (base1.cronalert = {});
  robot.brain.on('loaded', (function(_this) {
    return function() {
      return syncAlerts(robot);
    };
  })(this));
  robot.respond(/alert (.*?)$/i, function(msg) {
    if (!msg.message.user.is_admin) {
      return msg.send('You don\'t have permission to do that. :closed_lock_with_key:');
    } else {
      return handleNewAlert(robot, msg, "0 */15 * * * *", msg.match[1]);
    }
  });
  robot.respond(/(?:new|add) alert "(.*?)" (.*)$/i, function(msg) {
    if (!msg.message.user.is_admin) {
      return msg.send('You don\'t have permission to do that. :closed_lock_with_key:');
    } else {
      return handleNewAlert(robot, msg, msg.match[1], msg.match[2]);
    }
  });
  robot.respond(/(?:new|add) alert (.*) "(.*?)" *$/i, function(msg) {
    if (!msg.message.user.is_admin) {
      return msg.send('You don\'t have permission to do that. :closed_lock_with_key:');
    } else {
      return handleNewAlert(robot, msg, msg.match[1], msg.match[2]);
    }
  });
  robot.respond(/(?:new|add) alert (.*?) say (.*?) *$/i, function(msg) {
    if (!msg.message.user.is_admin) {
      return msg.send('You don\'t have permission to do that. :closed_lock_with_key:');
    } else {
      return handleNewAlert(robot, msg, msg.match[1], msg.match[2]);
    }
  });
  robot.respond(/(?:list|ls) alerts?/i, function(msg) {
    var alert, id, room, text;
    if (!msg.message.user.is_admin) {
      return msg.send('You don\'t have permission to do that. :closed_lock_with_key:');
    } else {
      text = '';
      for (id in ALERTS) {
        alert = ALERTS[id];
        room = alert.room;
        text += id + ": @" + room + " \"" + alert.message + "\"\n";
      }
      if (text.length > 0) {
        return msg.send(text);
      } else {
        return msg.send("No alerts were found.");
      }
    }
  });
  robot.respond(/(?:rm|remove|del|delete) alert (\d+)/i, function(msg) {
    var id;
    if (!msg.message.user.is_admin) {
      return msg.send('You don\'t have permission to do that. :closed_lock_with_key:');
    } else {
      if ((id = msg.match[1]) && unregisterAlert(robot, id)) {
        return msg.send("Alert " + id + " deleted");
      } else {
        return msg.send("Alert " + id + " does not exist");
      }
    }
  });
  robot.respond(/(?:tz|timezone) alert (\d+) (.*)/i, function(msg) {
    var id, timezone;
    if (!msg.message.user.is_admin) {
      return msg.send('You don\'t have permission to do that. :closed_lock_with_key:');
    } else {
      if ((id = msg.match[1]) && (timezone = msg.match[2]) && updateAlertTimezone(robot, id, timezone)) {
        return msg.send("Alert " + id + " updated to use " + timezone);
      } else {
        return msg.send("Alert " + id + " does not exist");
      }
    }
  });
  robot.respond(/coins$/i, function(msg) {
    var myCoins;
    if (robot.brain.get('myCoins') === null) {
      return msg.send("No coins stored, refer to bot help to add coins to coins list in the brain");
    } else {
      myCoins = robot.brain.get('myCoins');
      console.log("myCoins: " + myCoins);
      return cryptoCoins(robot, msg, myCoins);
    }
  });
  robot.respond(/coins purge$/i, function(msg) {
    return robot.brain.set('myCoins', null);
  });
  robot.respond(/coins raw$/i, function(msg) {
    return msg.send(JSON.stringify(robot.brain.get('myCoins')));
  });
  robot.respond(/coins add\b\s?(.*)\b\s(.*)/i, function(msg) {
    var coins, exchange, pair, slug;
    if (msg.match[1]) {
      pair = msg.match[1].trim();
      exchange = msg.match[2].trim();
    } else {
      pair = msg.match[2].trim();
      exchange = 'bitfinex';
    }
    slug = exchange + ":" + pair;
    coins = robot.brain.get('myCoins');
    if (coins === null) {
      coins = [];
      coins.push(slug);
    } else {
      coins.push(slug);
    }
    robot.brain.set('myCoins', coins);
    return msg.send("\"" + pair + " " + exchange + "\" was added to coins");
  });
  robot.respond(/coins remove\b\s?(.*)\b\s(.*)/i, function(msg) {
    var coinToRemove, coins, exchange, pair, removedItem, slug;
    if (!msg.match[1]) {
      pair = msg.match[2].trim();
      return msg.send("You must specify the exchange..");
    } else {
      pair = msg.match[1].trim();
      exchange = msg.match[2].trim();
      slug = exchange + ":" + pair;
      coins = robot.brain.get('myCoins');
      coinToRemove = coins.indexOf(slug);
      if (coinToRemove === -1) {
        return msg.send("Could not find \"" + pair + " " + exchange + "\" to remove");
      } else {
        removedItem = coins.splice(coinToRemove, 1);
        return msg.send("\"" + pair + " " + exchange + "\" was removed from coins");
      }
    }
  });
  robot.respond(/crypto api allowance/i, function(msg) {
    if (!msg.message.user.is_admin) {
      return msg.send('You don\'t have permission to do that. :closed_lock_with_key:');
    } else {
      return msg.http("https://api.cryptowat.ch").header('Accept', 'application/json').get()(function(err, res, body) {
        var data;
        if (err) {
          console.log(err);
          return msg.send('there was an error, check the logs..');
        } else {
          data = JSON.parse(body);
          if (!data.error) {
            return msg.send(JSON.stringify(data.allowance.remaining) + " (" + ((data.allowance.remaining / 8000000000) * 100).toFixed(2) + "% remaining)");
          }
        }
      });
    }
  });
  robot.respond(/price\b\s?(.*)\b\s(.*)/i, function(msg) {
    var exchange, pair;
    if (msg.match[1]) {
      pair = msg.match[1].trim();
      exchange = msg.match[2].trim();
    } else {
      pair = msg.match[2].trim();
      exchange = 'bitfinex';
    }
    cryptoPrice(robot, msg, pair, exchange, function(){

    });
    getChart(msg, exchange, pair, '30min', 'candle');

  });

  robot.respond(/pricesum\s(.*)/i, function(msg) {
    var pair;
    pair = msg.match[1].trim();
    return cryptoSummary(robot, msg, pair);
  });


};


Alert = (function() {
  function Alert(id, pattern, room, user, message, timezone) {
    this.id = id;
    this.pattern = pattern;
    this.room = room;
    this.user = user;
    this.message = message;
    this.timezone = timezone;
  }

  Alert.prototype.start = function(robot) {
    this.cronalert = new cronAlert(this.pattern, (function(_this) {
      return function() {
        return _this.sendMessage(robot);
      };
    })(this), null, false, this.timezone);
    return this.cronalert.start();
  };

  Alert.prototype.stop = function() {
    return this.cronalert.stop();
  };

  Alert.prototype.serialize = function() {
    return [this.pattern, this.room, this.user, this.message, this.timezone];
  };

  Alert.prototype.sendMessage = function(robot) {
    var envelope, id, lastAlertKey, marketExchange, pair, percentAlert, room;
    envelope = {
      user: this.user,
      room: this.room
    };
    pair = this.message.split(" ")[0];
    percentAlert = this.message.split(" ")[1];
    marketExchange = this.message.split(" ")[2];
    room = this.room;
    id = this.id;
    lastAlertKey = pair + percentAlert + marketExchange + room;
    return robot.http("https://api.cryptowat.ch/markets/" + marketExchange + "/" + pair + "/summary").header('Accept', 'application/json').get()(function(err, res, body) {
      var MINUTE, d1, d2, data, minutes_passed, msgResponse;
      if (err) {
        //robot.send(envelope, "'''" + err + "'''");
        robot.logger.error(err);
        return console.log(err);
      } else {
        data = JSON.parse(body);
        if (!data.result) {
          return robot.send(envelope, pair + " not found on " + exchange + " or there was a problem with the request");
        } else {
          console.log("pair: " + pair);
          console.log("percentAlert: " + percentAlert);
          console.log('exchange: ' + marketExchange);
          console.log(pair + " Price: " + formatCurrency(data.result.price.last) + ", Change: " + ((data.result.price.change.percentage * 100).toFixed(1)) + "%, Volume: " + data.result.volume);
          if (data.result.price.change.percentage > (percentAlert / 100) | data.result.price.change.percentage < -(percentAlert / 100)) {
            MINUTE = 1000 * 60;
            d1 = new Date(robot.brain.get(lastAlertKey));
            d2 = new Date();
            minutes_passed = Math.round((d2.getTime() - d1.getTime()) / MINUTE);
            console.log("last trigger: " + robot.brain.get(lastAlertKey));
            console.log(pair + ". minutes_passed: " + minutes_passed);
            msgResponse = {
              "text": "",
              "as_user": true,
              "unfurl_links": false,
              "attachments": [
                {
                  "fallback": "*Price:* " + (formatCurrency(data.result.price.last, 'USD')) + " " + ('USD'.toUpperCase()) + ", *Percent Change (24hr):* " + ((data.result.price.change.percentage * 100).toFixed(2)) + "%",
                  "color": (data.result.price.change.percentage * 100).toFixed(1) > 0 ? "good" : "danger",
                  "title": (pair.toUpperCase()) + " on " + (toTitleCase(marketExchange)),
                  "title_link": "https://cryptowat.ch/" + marketExchange + "/" + pair,
                  "fields": [
                    {
                      "title": "Price",
                      "value": (formatCurrency(data.result.price.last, 'USD')) + " " + ('USD'.toUpperCase()),
                      "short": true
                    }, {
                      "title": "Change (24hr)",
                      "value": ((data.result.price.change.percentage * 100).toFixed(2)) + "%",
                      "short": true
                    }
                  ],
                  "footer": "This is an automated price change alert " + id
                }
              ]
            };
            if (robot.brain.get(lastAlertKey) === null) {
              robot.send(envelope, msgResponse);
              return robot.brain.set(lastAlertKey, Date.now());
            } else {
              if (minutes_passed > 720) {
                robot.send(envelope, msgResponse);
                return robot.brain.set(lastAlertKey, Date.now());
              } else {

              }
            }
          } else {

          }
        }
      }
    });
  };

  return Alert;

})();

formatCurrency = function(num, currency) {
  var cents, i;
  switch (currency) {
    case "USD":
      num = num.toString().replace(/\$|\,/g, '');
      if (isNaN(num)) {
        num = '0';
      }
      num = Math.floor(num * 100 + 0.50000000001);
      cents = num % 100;
      num = Math.floor(num / 100).toString();
      if (cents < 10) {
        cents = '0' + cents;
      }
      i = 0;
      while (i < Math.floor((num.length - (1 + i)) / 3)) {
        num = num.substring(0, num.length - (4 * i + 3)) + ',' + num.substring(num.length - (4 * i + 3));
        i++;
      }
      return '$' + num + '.' + cents;
    default:
      num = num.toString().replace(/\$|\,/g, '');
      if (isNaN(num)) {
        num = '0';
      }
      num = Math.floor(num * 100 + 0.50000000001);
      cents = num % 100;
      num = Math.floor(num / 100).toString();
      if (cents < 10) {
        cents = '0' + cents;
      }
      i = 0;
      while (i < Math.floor((num.length - (1 + i)) / 3)) {
        num = num.substring(0, num.length - (4 * i + 3)) + ',' + num.substring(num.length - (4 * i + 3));
        i++;
      }
      return num + '.' + cents;
  }
};

cryptoPrice = function(robot, msg, pair, exchange) {
  return msg.http("https://api.cryptowat.ch/pairs/" + (pair.toLowerCase())).header('Accept', 'application/json').get()(function(err, res, body) {
    var base, data, quote;
    if (err) {
      msg.send("Oops! There was an error making the request :/");
      robot.logger.error(err);
      return console.log(err);
    } else {
      data = JSON.parse(body);
      if (!data.result) {
        return msg.send(pair + " does not exist or there was a problem with the request");
      } else {
        base = data.result.base.symbol.toUpperCase();
        quote = data.result.quote.symbol.toUpperCase();
        return msg.http("https://api.cryptowat.ch/markets/" + (exchange.toLowerCase()) + "/" + (pair.toLowerCase()) + "/summary").header('Accept', 'application/json').get()(function(err, res, body) {
          var msgResponse;
          if (err) {
            msg.send("Oops! There was an error making the request :/");
            robot.logger.error(err);
            return console.log(err);
          } else {
            data = JSON.parse(body);
            if (!data.result) {
              return msg.send(pair + " not found on " + exchange + " or there was a problem with the request");
            } else {
              msgResponse = {
                "text": "",
                "as_user": true,
                "unfurl_links": false,
                "attachments": [
                  {
                    "fallback": "*Price:* " + (formatCurrency(data.result.price.last, 'USD')) + " " + ('USD'.toUpperCase()) + ", *Percent Change (24hr):* " + ((data.result.price.change.percentage * 100).toFixed(2)) + "%",
                    "color": (data.result.price.change.percentage * 100).toFixed(1) > 0 ? "good" : "danger",
                    "title": (pair.toUpperCase()) + " on " + (toTitleCase(exchange)),
                    "title_link": "https://cryptowat.ch/" + exchange + "/" + pair,
                    "fields": [
                      {
                        "title": "Price",
                        "value": (formatCurrency(data.result.price.last, quote)) + " " + (quote.toUpperCase()),
                        "short": true
                      }, {
                        "title": "Change (24hr)",
                        "value": ((data.result.price.change.percentage * 100).toFixed(1)) + "%",
                        "short": true
                      }
                    ]
                  }
                ]
              };
              return msg.send(msgResponse);

            }
          }
        });
      }
    }
  });
};

cryptoSummary = function(robot, msg, pair) {
  return msg.http("https://api.cryptowat.ch/pairs/" + (pair.toLowerCase())).header('Accept', 'application/json').get()(function(err, res, body) {
    var base, data, quote;
    if (err) {
      msg.send("Oops! There was an error making the request :/");
      robot.logger.error(err);
      return console.log(err);
    } else {
      data = JSON.parse(body);
      if (!data.result) {
        msg.send(pair + " does not exist or there was a problem with the request");
      } else {

      }
      base = data.result.base.symbol.toUpperCase();
      quote = data.result.quote.symbol.toUpperCase();
      return msg.http("https://api.cryptowat.ch/markets/summaries").header('Accept', 'application/json').get()(function(err, res, body) {
        var output, row, rowCoin, rowExchange, rowPair, summaries;
        if (err) {
          msg.send("Oops! There was an error making the request :/");
          robot.logger.error(err);
          return console.log(err);
        } else {
          data = JSON.parse(body);
          summaries = data.result;
          if (!data.result) {
            msg.send(pair + " not found on " + exchange + " or there was a problem with the request");
          } else {

          }
          output = '';
          for (row in summaries) {
            rowExchange = row.toString().split(":")[0];
            rowPair = row.toString().split(":")[1];
            rowCoin = summaries[row];
            if (rowPair.match('^' + pair + '$')) {
              output = ((formatCurrency(rowCoin.price.last, quote)) + " " + quote + " (" + ((rowCoin.price.change.percentage * 100).toFixed(1)) + "%) - " + (toTitleCase(rowExchange)) + "\n") + output;
            }
          }
          return msg.send(output);
        }
      });
    }
  });
};

cryptoCoins = function(robot, msg, coins) {
  return msg.http("https://api.cryptowat.ch/markets/summaries").header('Accept', 'application/json').get()(function(err, res, body) {
    var data, results, row, rowCoin, summaries;
    if (err) {
      msg.send("Oops! There was an error making the request :/");
      robot.logger.error(err);
      return console.log(err);
    } else {
      data = JSON.parse(body);
      summaries = data.result;
      if (!data.result) {
        return msg.send(pair + " not found on " + exchange + " or there was a problem with the request");
      } else {
        results = [];
        for (row in summaries) {
          rowCoin = summaries[row];
          rowCoin.slug = row;
          rowCoin.exchange = row.toString().split(":")[0];
          rowCoin.pair = row.toString().split(":")[1];
          if (coins.indexOf(rowCoin.slug) !== -1) {
            results.push(getBaseQuote(msg, rowCoin));
          } else {
            results.push(void 0);
          }
        }
        return results;
      }
    }
  });
};

getBaseQuote = function(msg, coin) {
  var result;
  result = '';
  return msg.http("https://api.cryptowat.ch/pairs/" + (coin.pair.toLowerCase())).header('Accept', 'application/json').get()(function(err, res, body) {
    var data, msgResponse;
    if (err) {
      msg.send("Oops! There was an error making the request :/");
      robot.logger.error(err);
      return console.log(err);
    } else {
      data = JSON.parse(body);
      coin.base = data.result.base.symbol;
      coin.quote = data.result.quote.symbol;
      msgResponse = {
        "text": "",
        "as_user": true,
        "unfurl_links": false,
        "attachments": [
          {
            "fallback": coin.quote.toUpperCase() + " - *Price:* " + (formatCurrency(coin.price.last, coin.quote.toUpperCase())) + " " + (toTitleCase(coin.quote)) + ", *Percent Change (24hr):* " + ((coin.price.change.percentage * 100).toFixed(1)) + "%",
            "color": (coin.price.change.percentage * 100).toFixed(1) > 0 ? "good" : "danger",
            "title": (coin.pair.toUpperCase()) + " on " + (toTitleCase(coin.exchange)),
            "title_link": "https://cryptowat.ch/" + coin.exchange + "/" + coin.pair,
            "fields": [
              {
                "title": "Price",
                "value": (formatCurrency(coin.price.last, coin.quote.toUpperCase())) + " " + (coin.quote.toUpperCase()),
                "short": true
              }, {
                "title": "Change (24hr)",
                "value": ((coin.price.change.percentage * 100).toFixed(1)) + "%",
                "short": true
              }
            ]
          }
        ]
      };
      return msg.send(msgResponse);
    }
  });
};

filterBy = function(obj, val) {
  var result;
  result = Object.keys(obj).reduce((function(r, e) {
    if (e.toLowerCase().indexOf(val) !== -1) {
      r[e] = obj[e];
    } else {
      Object.keys(obj[e]).forEach(function(k) {
        var object;
        if (k.toLowerCase().indexOf(val) !== -1) {
          object = {};
          object[k] = obj[e][k];
          r[e] = object;
        }
      });
    }
    return r;
  }), {});
  return result;
};

toTitleCase = function(str) {
  return str.replace(/\w\S*/g, function(txt) {
    return txt[0].toUpperCase() + txt.slice(1, +(txt.length - 1) + 1 || 9e9).toLowerCase();
  });
};

// ---
// generated by coffee-script 1.9.2
