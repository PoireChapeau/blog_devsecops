# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --silent

# Copier le code source
COPY . .

# Arguments de build
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Build de l'application
RUN npm run build

# Production stage
FROM nginx:1.25-alpine AS production

# Installer wget pour les healthchecks
RUN apk add --no-cache wget

# Copier la configuration Nginx AVANT de modifier les permissions
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copier les fichiers buildés depuis le stage builder
COPY --from=builder /app/build /usr/share/nginx/html

# Créer un utilisateur non-root pour Nginx (optionnel, on peut le retirer si ça pose problème)
# RUN addgroup -g 1001 -S nginx && \
#     adduser -S nginx -u 1001 -G nginx && \
#     chown -R nginx:nginx /usr/share/nginx/html && \
#     chown -R nginx:nginx /var/cache/nginx && \
#     chown -R nginx:nginx /var/log/nginx && \
#     chown -R nginx:nginx /etc/nginx/conf.d && \
#     touch /var/run/nginx.pid && \
#     chown -R nginx:nginx /var/run/nginx.pid

# Utiliser l'utilisateur par défaut (root) pour éviter les problèmes de permissions
# USER nginx

# Exposer le port
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Commande par défaut
CMD ["nginx", "-g", "daemon off;"]