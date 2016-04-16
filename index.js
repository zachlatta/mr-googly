'use strict';

let slack = require('@slack/client');
const RTM_EVENTS = slack.RTM_EVENTS;

let RtmClient = slack.RtmClient;
let WebClient = slack.WebClient;

const SLACK_TOKEN = process.env.SLACK_API_TOKEN || '';

let rtm = new RtmClient(SLACK_TOKEN, { logLevel: 'info' });
let web = new WebClient(SLACK_TOKEN);

// Get our user id so we can ignore messages from us in the future.
let botUserId = '';
web.auth.test()
  .then(resp => {
    botUserId = resp.user_id;

    rtm.start();
  });

rtm.on(RTM_EVENTS.MESSAGE, (msg) => {
  // Ignore if we sent the message
  if (msg.user == botUserId) {
    return;
  }

  let userId = msg.user;

  web.users.info(userId)
    .then(resp => {
      let profilePictureUrl = resp.user.profile.image_original;

      // user.profile.image_original isn't set for people using Gravatar. Use
      // image_512 instead.
      if (profilePictureUrl == undefined) {
        profilePictureUrl = resp.user.profile.image_512;
      }

      rtm.sendMessage('Your profile picture is: ' + profilePictureUrl,
                      msg.channel);
    });
});
