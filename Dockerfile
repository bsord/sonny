# Base
FROM ubuntu:18.04 as base
ENV NODE=ENV=production
ENV TINI_VERSION v0.18.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini
RUN apt-get update; apt-get install curl redis git git-core -y
RUN curl --silent -o- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash
ENV NVM_DIR /usr/local/.nvm
ENV NODE_VERSION 10.16.3
RUN . $HOME/.nvm/nvm.sh && nvm install $NODE_VERSION && nvm alias default $NODE_VERSION && nvm use default
ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH
RUN useradd -ms /bin/bash node
RUN mkdir -p /app/logs && chown -R node:node /app
WORKDIR /app
USER node
COPY --chown=node:node package*.json ./
RUN npm install --no-optional --silent && npm cache clean --force > "/dev/null" 2>&1

# Development ENV
FROM base as dev
ENV NODE_ENV=development
ENV PATH=/app/node_modules/.bin:$PATH
RUN npm install --only=development --no-optional --silent && npm cache clean --force > "/dev/null" 2>&1
ENTRYPOINT ["/tini", "--"]
CMD ["sh", "-c", "./bin/hubot --adapter slack" ]

# Source
FROM base as source
COPY --chown=node:node . .

# Test ENV
FROM source as test
ENV NODE_ENV=development
ENV PATH=/app/node_modules/.bin:$PATH
COPY --from=dev /app/node_modules /app/node_modules
# RUN eslint . // Disabled pending Lint setup

# Audit ENV
FROM test as audit
USER root
RUN npm audit --audit-level critical
ARG MICROSCANNER_TOKEN
ADD https://get.aquasec.com/microscanner /
RUN chmod +x /microscanner
RUN /microscanner $MICROSCANNER_TOKEN --continue-on-failure

# Production ENV
FROM source as prod
ENTRYPOINT ["/tini", "--"]
CMD ["sh", "-c", "./bin/hubot --adapter slack" ]

