FROM ubuntu:18.04

# Create app directory
WORKDIR /usr/src/hubot

# INSTALL DEPENDENCIES
RUN apt-get update; apt-get install nodejs npm git git-core redis-server -y

# CLONE APP AND RUN NPM INSTALL
RUN git clone https://github.com/bsord/sonny ../hubot

CMD ["sh", "-c", "./bin/hubot --adapter slack" ]
