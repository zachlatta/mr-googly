'use strict';

let slack = require('@slack/client');
let fetch = require('node-fetch');
let fs = require('fs');
let url = require('url');
let path = require('path');

let SlackUploadClient = require('node-slack-upload');
let RtmClient = slack.RtmClient;
let WebClient = slack.WebClient;

const RTM_EVENTS = slack.RTM_EVENTS;
const SLACK_TOKEN = process.env.SLACK_API_TOKEN || '';

let rtm = new RtmClient(SLACK_TOKEN, { logLevel: 'info' });
let web = new WebClient(SLACK_TOKEN);
let upload = new SlackUploadClient(SLACK_TOKEN);

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

      return fetch(profilePictureUrl);
    })
    .then(resp => {
      let parsedUrl = url.parse(resp.url);
      let fileName = path.basename(parsedUrl.pathname);
      let f = fs.createWriteStream(fileName);

      return new Promise((resolve, reject) => {
        resp.body.pipe(f);

        resp.body.on('end', () => resolve(f));
        f.on('error', err => reject(err));
      });
    })
    .then(file => {
      return new Promise((resolve, reject) => {
        upload.uploadFile({
          file: fs.createReadStream(file.path),
          channels: msg.channel
        }, err => {
          if (err != undefined) {
            return reject(err);
          }

          return resolve();
        });
      });
    });
});
