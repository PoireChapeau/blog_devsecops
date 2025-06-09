# Multi-stage build pour optimiser l'image
FROM node:18-alpine AS base

# Installer les dépendances système nécessaires
RUN apk add --no-cache \
    wget \
    && rm -rf /var/cache/apk/*

# L'utilisateur node existe déjà dans l'image node:alpine
# On s'assure juste qu'il a les bonnes permissions

WORKDIR /app

# Changer le propriétaire du dossier de travail
RUN chown -R node:node /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Stage de développement
FROM base AS development
RUN npm ci --include=dev
COPY . .
USER node
EXPOSE 3001
CMD ["npm", "run", "dev"]

# Stage de production
FROM base AS production

# Installer seulement les dépendances de production
RUN npm ci --only=production && npm cache clean --force

# Copier le code source
COPY --chown=node:node . .

# Utiliser l'utilisateur non-root
USER node

# Exposer le port
EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Commande par défaut
CMD ["node", "server.js"]