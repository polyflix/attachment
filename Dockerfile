FROM node:16-bullseye-slim

ARG GITLAB_REGISTRY_TOKEN=oPzeRwQ2XxoMnDm67NCe

RUN apt-get update --no-install-recommends && \
    apt-get install -y --no-install-recommends  curl=7.74.0-1.3+deb11u3 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /home/node
ENV NODE_ENV production
COPY --chown=node:node . .

RUN npm config set \
    @polyflix:registry https://gitlab.polytech.umontpellier.fr/api/v4/projects/1343/packages/npm/ && \
    npm config set -- \
    '//gitlab.polytech.umontpellier.fr/api/v4/projects/1343/packages/npm/:_authToken' \
    "${GITLAB_REGISTRY_TOKEN}" && \
    npm install && \
    rm -rf ~/.npm ~/.npmrc

USER node
EXPOSE 5000
HEALTHCHECK --interval=10s --start-period=5s CMD curl --fail http://localhost:5000/api/v1/health || exit 1
ENTRYPOINT [ "node", "dist/main/main" ]
