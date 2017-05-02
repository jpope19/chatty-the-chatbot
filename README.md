# chatty-the-chatbot

Steps to get working:
1. npm install
2. Update settings.js with your app's tokens
3. Update weights folder with yolo.weights found: http://pjreddie.com/media/files/yolo.weights
4. Add following permissions in slack:

## Slack-bot permissions
#### OTHER
Add a bot user with the username @chatty.
View user's Slack team name.
Post to specific channels in Slack.

##### CHAT
Send messages as Chatty.

##### FILES
Access the team's files, comments, and associated information.
Upload and modify files as user.

##### TEAM
Access information about your team.

##### USERS
View email addresses of people on this team.

5. Add **AWS_ACCESS_KEY_ID** & **AWS_SECRET_ACCESS_KEY** to settings.js
