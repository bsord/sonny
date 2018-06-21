// Description:
//  Holiday Detector - Sample Hubot Script Written in JS
//
// Dependencies:
//   None
//
// Configuration:
//   Update filePath, displayName and mySlackUsername variables below.
//
// Commands:
//   logs - upload a copy of the pre-defined log file

var filePath = '\/home\/wytdev\/viki\/logs\/hubot.log'; // Special characters need to be escaped! (Ex: \/var\/log\/syslog)
var displayName = 'Sonny Logs';

var fs = require('fs');
var WebClient = require('@slack/client').WebClient;
var token = process.env.HUBOT_SLACK_TOKEN;
var streamOpts = null;

var web = new WebClient(token);

module.exports = function(robot) {
    robot.respond(/logs/i, function(msg){
        if(!msg.message.user.is_admin) {
            msg.send('You don\'t have permission to do that. :closed_lock_with_key:');
        }else {
            var streamOpts = {
                file: fs.createReadStream(filePath),
                channels: msg.message.room,
                title: displayName
            };

            web.files.upload(displayName, streamOpts, function(err, res) {
                if (err) {
                    msg.send('```' + err + '```');
                } else {
                    //console.log(res); // Uncomment to see API response
                }
            });
        }
    });
}
