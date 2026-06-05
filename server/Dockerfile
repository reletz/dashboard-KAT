FROM node:20-alpine

WORKDIR /app

# install dependencies (including dev deps because runtime uses tsx)
COPY package*.json ./
RUN npm ci

# copy source
COPY . .

EXPOSE 8787
ENV PORT=8787

CMD ["npm", "start"]
