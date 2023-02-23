FROM node:16-bullseye-slim

RUN apt-get update --no-install-recommends && \
    apt-get install -y --no-install-recommends  curl=7.74.0-1.3+deb11u5 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /home/node
ENV NODE_ENV production
COPY --chown=node:node . .

USER node
EXPOSE 5000
HEALTHCHECK --interval=10s --start-period=5s CMD curl --fail http://localhost:5000/api/v1/health || exit 1
ENTRYPOINT [ "node", "dist/main/main" ]
