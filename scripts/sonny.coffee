# Description:
#   Collection of random responses for 'sonny' bot
#
# Dependencies:
#   None
#
# Configuration:
#   None
#
# Commands:
#   see source.
#
# Notes:
#   None
#
# Author:
#   Brandon Sorgdrager


module.exports = (robot) ->
  #robot.adapter.client.web.chat.postMessage("C6YDZ8W3Z", "Technically I was never alive, but I appreciate your concern.", {as_user: true, unfurl_links: false})

  robot.hear /:wink:/i, (res) ->
    robot.adapter.client.web.chat.postMessage(res.message.room, "What does this action signify? :wink:", {as_user: true, unfurl_links: false})


  robot.respond /test/i, (res) ->
    robot.adapter.client.web.chat.postMessage(res.message.room, "Yes, detective?", {as_user: true, unfurl_links: false})

  robot.respond /(.*) make me a sandwich/i, (res) ->
    query = res.match[1].toUpperCase()
    idTimeStamp = res.message.id
    chanName = res.message.room
    console.log(JSON.stringify(idTimeStamp))
    console.log(JSON.stringify(chanName))
    robot.adapter.client.web.reactions.add('sandwich', {channel: chanName, timestamp: idTimeStamp})

  robot.hear /trust/i, (res) ->
    robot.adapter.client.web.chat.postMessage(res.message.room, ":wink:", {as_user: true, unfurl_links: false})

  robot.respond /buttme/i, (res) ->
    msgResponse =
      "text": "Would you like to play a game?",
      "as_user": true,
      "unfurl_links":false,
      "attachments": [
          {
              "fallback": "Required plain-text summary of the attachment.",
              "color": "#36a64f",
              "author_name": "Bobby Tables",
              "author_link": "http://flickr.com/bobby/",
              "author_icon": "http://flickr.com/icons/bobby.jpg",
              "title": "Slack API Documentation",
              "title_link": "https://api.slack.com/",
              "text": "Optional text that appears within the attachment",
              "fields": [
                  {
                      "title": "Priority",
                      "value": "High",
                      "short": false
                  }
              ],
              "image_url": "http://my-website.com/path/to/image.jpg",
              "thumb_url": "http://example.com/path/to/thumb.png",
              "footer": "Slack API",
              "footer_icon": "https://platform.slack-edge.com/img/default_application_icon.png",
              "ts": 123456789
          },
          {
              "fallback": "Required plain-text summary of the attachment.",
              "color": "#36a64f",
              "pretext": "Optional text that appears above the attachment block",
              "author_name": "Bobby Tables",
              "author_link": "http://flickr.com/bobby/",
              "author_icon": "http://flickr.com/icons/bobby.jpg",
              "title": "Slack API Documentation",
              "title_link": "https://api.slack.com/",
              "text": "Optional text that appears within the attachment",
              "fields": [
                  {
                      "title": "Priority",
                      "value": "High",
                      "short": false
                  }
              ],
              "image_url": "http://my-website.com/path/to/image.jpg",
              "thumb_url": "http://example.com/path/to/thumb.png",
              "footer": "Slack API",
              "footer_icon": "https://platform.slack-edge.com/img/default_application_icon.png",
              "ts": 123456789
          }
      ]

    robot.adapter.client.web.chat.postMessage(res.message.room, 'Would you like to click', msgResponse)

  robot.respond /deltest/i, (res) ->
    robot.adapter.client.web.chat.delete('1522264139.000648',res.message.room)



formatDate = (date) ->
  timeStamp = [date.getFullYear(), (date.getMonth() + 1), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()].join(" ")
  RE_findSingleDigits = /\b(\d)\b/g
  timeStamp = timeStamp.replace( RE_findSingleDigits, "0$1" )
  timeStamp.replace /\s/g, ""
