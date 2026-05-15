FROM node:20-alpine
LABEL maintainer="Grupo TCC — UAM 2026"
WORKDIR /app
COPY package*.json ./
RUN npm install --production && npm cache clean --force
COPY scripts/ ./scripts/
COPY README.md ./
RUN mkdir -p /app/results
CMD ["npm", "run", "full"]
