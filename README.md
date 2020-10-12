# Sonny
[![Docker Automated](https://img.shields.io/docker/automated/bsord/sonny.svg)](https://hub.docker.com/r/bsord/sonny/)
[![Docker Build](https://img.shields.io/docker/build/bsord/sonny.svg)](https://hub.docker.com/r/bsord/sonny/)
[![Docker Pulls](https://img.shields.io/docker/pulls/bsord/sonny.svg)](https://hub.docker.com/r/bsord/sonny/)

A Dockerized Slackbot running Hubot v3
<br>


### Prerequisites
A Slackbot token pre-configured for your team is required. [Checkout the Slack docs for more information](https://api.slack.com/slack-apps).


### Start the Container Headless
If you do not want to connect to the container and just want to run it, use daemon mode with **-d**:

`(sudo) docker run -d -e HUBOT_SLACK_TOKEN=<token> --name sonny bsord/sonny`


### Start and Connect to the Container for Debugging
1) To download, launch and connect to the container: 
`(sudo) docker run -it --name sonny bsord/sonny '/bin/bash'`
2) Finally, launch the bot within the container: 
`HUBOT_SLACK_TOKEN=<token> ./bin/hubot`


### Viewing Log Output
The output of hubot startup and any console.log() within your scripts is directed to container logs and can be viewed within Docker.

`(sudo) docker logs <container name>`


### Helpful Docker Commands for Removing/Updating Halbert
- To stop the container: `(sudo) docker stop sonny`
- To remove the container: `(sudo) docker rm sonny`
- To list containers: `(sudo) docker ps -a`
- To list images: `(sudo) docker images`
- To remove the old image: `(sudo) docker rmi bsord/sonnyi`


### Environment Variables
Additional ENV variables can be passed when starting Docker with the **-e** flag and then accessed within scripts as process.env.ENV_VARIABLE_NAME

`-e ENV_VARIABLE_NAME='My Variable'`


### Exposing Directories
Directories within the Docker container can be exposed to the local machine with the **-v** flag.

`-v /usr/src/hubot:/hubot (<docker path>:<local machine path>)`


### Exposing Ports
Docker ports can be exposed to extend functionality, such as with webhooks, using the **-p** flag.

`-p 8080:8080 (<External Port>:<Internal Docker Port>)`

### TODO:
- [x] Add automated semver updates and tagging
- [ ] Add Auto docker and helm publishing

