FROM node:20-alpine

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8787 \
    DB_PATH=/data/portal.db

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

# DB SQLite is written into /data;
RUN mkdir -p /data && chown -R node:node /data /app
USER 1000:1000

EXPOSE 8787
CMD ["npm", "start"]
